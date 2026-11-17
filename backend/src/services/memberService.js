import crypto from 'crypto';
import { Member } from '../models/Member.js';
import { MembershipPlan } from '../models/MembershipPlan.js';
import { Payment } from '../models/Payment.js';
import { FaceTemplate } from '../models/FaceTemplate.js';
import { encryptDescriptor } from '../utils/faceCrypto.js';
import { logAdminAudit } from '../utils/auditLogger.js';
import { escapeRegex } from '../middleware/sanitize.js';

export function generateMemberId() {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ROAR-M-${rand}`;
}

export function generateReceiptNo() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `RCP-${dateStr}-${rand}`;
}

/**
 * List members with advanced filters
 */
export async function getMembersList({
  page = 1,
  limit = 20,
  search = '',
  status = '',
  paymentStatus = '',
  expiringSoon = false,
}) {
  const query = {};

  if (search) {
    const safeRegex = escapeRegex(search.trim());
    query.$or = [
      { name: { $regex: safeRegex, $options: 'i' } },
      { phone: { $regex: safeRegex, $options: 'i' } },
      { memberId: { $regex: safeRegex, $options: 'i' } },
    ];
  }

  if (status) {
    query.status = status;
  }

  if (paymentStatus) {
    query.paymentStatus = paymentStatus;
  }

  if (expiringSoon) {
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);
    query.status = { $ne: 'expired' };
    query.membershipEndDate = { $gte: now, $lte: next7Days };
  }

  const skip = (page - 1) * limit;
  const [members, total] = await Promise.all([
    Member.find(query)
      .populate('planId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Member.countDocuments(query),
  ]);

  return {
    members,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit) || 1,
    },
  };
}

/**
 * Create a new member and initial payment
 */
export async function createMember(data, adminUser, req = null) {
  const plan = await MembershipPlan.findById(data.planId);
  if (!plan) {
    throw new Error('Selected membership plan was not found.');
  }

  const startDate = data.membershipStartDate ? new Date(data.membershipStartDate) : new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + plan.durationDays);

  const memberId = generateMemberId();

  const isFullyPaid = data.amountPaid >= plan.price;
  const paymentStatus = isFullyPaid ? 'paid' : data.amountPaid > 0 ? 'pending' : 'pending';
  const amountDue = Math.max(0, plan.price - (data.amountPaid || 0));

  const member = new Member({
    memberId,
    name: data.name,
    phone: data.phone,
    email: data.email || '',
    status: 'active',
    planId: plan._id,
    membershipStartDate: startDate,
    membershipEndDate: endDate,
    paymentStatus,
    amountDue,
    sourceLeadId: data.sourceLeadId || null,
    notes: data.notes || '',
  });

  await member.save();

  // Record initial payment if amount > 0
  if (data.amountPaid && data.amountPaid > 0) {
    const receiptNo = generateReceiptNo();
    await Payment.create({
      memberId: member._id,
      amount: data.amountPaid,
      method: data.paymentMethod || 'cash',
      recordedBy: adminUser._id,
      receiptNo,
      periodStart: startDate,
      periodEnd: endDate,
      notes: 'Initial membership enrollment payment',
    });
  }

  if (req) {
    await logAdminAudit(req, 'MEMBER_CREATE', `Member:${member._id}`, {
      memberId: member.memberId,
      name: member.name,
      plan: plan.name,
    });
  }

  return member;
}

/**
 * Enrol face descriptors with explicit DPDP Act consent
 */
export async function enrolMemberFace(memberId, { descriptors, consentNoticeVersion = '1.0-DPDP-2023' }, req = null) {
  if (!descriptors || descriptors.length < 3 || descriptors.length > 5) {
    throw new Error('Biometric enrolment requires between 3 and 5 captured face descriptors.');
  }

  const member = await Member.findById(memberId);
  if (!member) {
    throw new Error('Member not found.');
  }

  // Encrypt descriptors with AES-256-GCM. Never store raw arrays.
  const encryptedDescriptors = descriptors.map((d) => encryptDescriptor(d));

  await FaceTemplate.findOneAndUpdate(
    { memberId: member._id },
    {
      encryptedDescriptors,
      descriptorCount: descriptors.length,
      modelVersion: '@vladmandic/face-api-v1.7',
      enrolledAt: new Date(),
    },
    { upsert: true, new: true }
  );

  member.faceEnrolled = true;
  member.faceConsent = {
    given: true,
    timestamp: new Date(),
    noticeVersion: consentNoticeVersion,
  };
  await member.save();

  if (req) {
    await logAdminAudit(req, 'FACE_ENROL', `Member:${member._id}`, {
      memberId: member.memberId,
      descriptorCount: descriptors.length,
      noticeVersion: consentNoticeVersion,
    });
  }

  return member;
}

/**
 * Permanently delete biometric templates for a member (Right to Erasure under DPDP)
 */
export async function deleteMemberBiometrics(memberId, req = null) {
  const member = await Member.findById(memberId);
  if (!member) {
    throw new Error('Member not found.');
  }

  await FaceTemplate.deleteOne({ memberId: member._id });

  member.faceEnrolled = false;
  member.faceConsent = {
    given: false,
    timestamp: null,
    noticeVersion: member.faceConsent?.noticeVersion || '1.0-DPDP-2023',
  };
  await member.save();

  if (req) {
    await logAdminAudit(req, 'BIOMETRICS_DELETED', `Member:${member._id}`, {
      memberId: member.memberId,
      reason: 'DPDP erasure request or membership termination',
    });
  }

  return member;
}

/**
 * Renew membership with a selected plan and payment
 */
export async function renewMembership(memberId, { planId, paymentMethod, amountPaid, notes }, adminUser, req = null) {
  const member = await Member.findById(memberId);
  if (!member) throw new Error('Member not found.');

  const plan = await MembershipPlan.findById(planId);
  if (!plan) throw new Error('Selected membership plan was not found.');

  const now = new Date();
  // If current end date is in future, append to it; otherwise start from today
  const baseDate = member.membershipEndDate > now ? new Date(member.membershipEndDate) : now;
  const newEndDate = new Date(baseDate);
  newEndDate.setDate(newEndDate.getDate() + plan.durationDays);

  const isFullyPaid = amountPaid >= plan.price;
  const paymentStatus = isFullyPaid ? 'paid' : 'pending';
  const amountDue = Math.max(0, plan.price - (amountPaid || 0));

  member.planId = plan._id;
  member.membershipEndDate = newEndDate;
  member.paymentStatus = paymentStatus;
  member.amountDue = amountDue;
  member.status = 'active';
  member.isFrozen = false;
  await member.save();

  if (amountPaid && amountPaid > 0) {
    const receiptNo = generateReceiptNo();
    await Payment.create({
      memberId: member._id,
      amount: amountPaid,
      method: paymentMethod || 'cash',
      recordedBy: adminUser._id,
      receiptNo,
      periodStart: baseDate,
      periodEnd: newEndDate,
      notes: notes || `Membership renewal (${plan.name})`,
    });
  }

  if (req) {
    await logAdminAudit(req, 'MEMBER_RENEW', `Member:${member._id}`, {
      memberId: member.memberId,
      plan: plan.name,
      amountPaid,
      newEndDate,
    });
  }

  return member;
}

/**
 * Record an ad-hoc payment for pending balance
 */
export async function recordMemberPayment(memberId, { amount, method, notes, idempotencyKey }, adminUser, req = null) {
  const member = await Member.findById(memberId);
  if (!member) throw new Error('Member not found.');

  // 1. Explicit Idempotency Key check
  if (idempotencyKey) {
    const existing = await Payment.findOne({ idempotencyKey });
    if (existing) {
      return { member, payment: existing, isDuplicate: true };
    }
  }

  // 2. Short-window (15s) deduplication to prevent double-click charges
  const fifteenSecAgo = new Date(Date.now() - 15000);
  const recentDuplicate = await Payment.findOne({
    memberId: member._id,
    amount,
    method,
    createdAt: { $gte: fifteenSecAgo },
  });
  if (recentDuplicate) {
    return { member, payment: recentDuplicate, isDuplicate: true };
  }

  const receiptNo = generateReceiptNo();
  const payment = await Payment.create({
    memberId: member._id,
    amount,
    method,
    recordedBy: adminUser._id,
    receiptNo,
    idempotencyKey: idempotencyKey || undefined,
    periodStart: member.membershipStartDate,
    periodEnd: member.membershipEndDate,
    notes: notes || 'Balance clearance payment',
  });

  const newDue = Math.max(0, (member.amountDue || 0) - amount);
  member.amountDue = newDue;
  if (newDue === 0) {
    member.paymentStatus = 'paid';
  }
  await member.save();

  if (req) {
    await logAdminAudit(req, 'PAYMENT_RECORDED', `Payment:${payment._id}`, {
      memberId: member.memberId,
      amount,
      receiptNo,
      remainingDue: newDue,
    });
  }

  return { member, payment };
}

/**
 * Toggle freeze state
 */
export async function toggleMemberFreeze(memberId, shouldFreeze, req = null) {
  const member = await Member.findById(memberId);
  if (!member) throw new Error('Member not found.');

  member.isFrozen = shouldFreeze;
  member.status = shouldFreeze ? 'frozen' : 'active';
  await member.save();

  if (req) {
    await logAdminAudit(req, shouldFreeze ? 'MEMBER_FROZEN' : 'MEMBER_UNFROZEN', `Member:${member._id}`, {
      memberId: member.memberId,
    });
  }

  return member;
}

/**
 * Toggle block state
 */
export async function toggleMemberBlock(memberId, shouldBlock, req = null) {
  const member = await Member.findById(memberId);
  if (!member) throw new Error('Member not found.');

  member.isBlocked = shouldBlock;
  member.status = shouldBlock ? 'blocked' : 'active';
  await member.save();

  if (req) {
    await logAdminAudit(req, shouldBlock ? 'MEMBER_BLOCKED' : 'MEMBER_UNBLOCKED', `Member:${member._id}`, {
      memberId: member.memberId,
    });
  }

  return member;
}

/**
 * Export members list to CSV format
 */
export async function exportMembersToCsv() {
  const members = await Member.find().populate('planId').sort({ createdAt: -1 });

  const headers = [
    'Member ID',
    'Full Name',
    'Phone',
    'Email',
    'Status',
    'Plan Name',
    'Start Date',
    'End Date',
    'Payment Status',
    'Amount Due (INR)',
    'Face Enrolled',
    'Enrolled At',
  ];

  const rows = members.map((m) => [
    m.memberId,
    `"${(m.name || '').replace(/"/g, '""')}"`,
    m.phone,
    m.email || '',
    m.status,
    m.planId?.name || '',
    m.membershipStartDate ? new Date(m.membershipStartDate).toLocaleDateString('en-IN') : '',
    m.membershipEndDate ? new Date(m.membershipEndDate).toLocaleDateString('en-IN') : '',
    m.paymentStatus,
    m.amountDue || 0,
    m.faceEnrolled ? 'YES' : 'NO',
    new Date(m.createdAt).toLocaleDateString('en-IN'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
