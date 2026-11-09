import { Lead } from '../models/Lead.js';
import { generateBookingReference } from '../utils/generateReference.js';
import { sendConfirmationEmail, sendAdminNotification } from './emailService.js';
import { logger } from '../utils/logger.js';
import { AuditLog } from '../models/AuditLog.js';

export async function createLead(data, ipAddress = '') {
  // Normalize phone number (digits only, last 10 digits)
  const cleanPhone = data.phone.replace(/\D/g, '').slice(-10);

  // Idempotency check: if exact same phone applied in the last 2 minutes, return existing
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const recentDuplicate = await Lead.findOne({
    phone: cleanPhone,
    createdAt: { $gte: twoMinutesAgo },
  });

  if (recentDuplicate) {
    logger.info(`Duplicate submission detected for phone ${cleanPhone}. Returning existing reference.`);
    return {
      lead: recentDuplicate,
      isDuplicate: true,
      bookingReference: recentDuplicate.bookingReference,
    };
  }

  // Generate unique booking reference with collision safety
  let bookingReference = generateBookingReference();
  let exists = await Lead.findOne({ bookingReference });
  while (exists) {
    bookingReference = generateBookingReference();
    exists = await Lead.findOne({ bookingReference });
  }

  const newLead = new Lead({
    fullName: data.fullName.trim(),
    phone: cleanPhone,
    email: data.email ? data.email.trim().toLowerCase() : undefined,
    preferredTime: data.preferredTime,
    fitnessGoal: data.fitnessGoal,
    experienceLevel: data.experienceLevel,
    bookingReference,
    status: 'New',
    emailStatus: data.email ? 'Pending' : 'None',
    coachNotes: data.coachNotes || '',
    source: data.source || 'web_form',
    idempotencyKey: data.idempotencyKey || undefined,
  });

  await newLead.save();

  // Audit Log
  await AuditLog.create({
    action: 'LEAD_REGISTERED',
    actorType: 'visitor',
    actorId: cleanPhone,
    targetResource: `Lead:${newLead._id}`,
    details: { bookingReference, goal: newLead.fitnessGoal },
    ipAddress,
  });

  // Trigger emails asynchronously (do not block client response)
  if (newLead.email) {
    sendConfirmationEmail(newLead)
      .then((res) => {
        newLead.emailStatus = res.sent ? 'Sent' : 'Failed';
        newLead.save().catch(() => {});
      })
      .catch((err) => {
        logger.error(`Email dispatch exception: ${err.message}`);
        newLead.emailStatus = 'Failed';
        newLead.save().catch(() => {});
      });
  }

  sendAdminNotification(newLead).catch((err) => {
    logger.error(`Admin lead alert exception: ${err.message}`);
  });

  return {
    lead: newLead,
    isDuplicate: false,
    bookingReference,
  };
}

export async function getLeads({ page = 1, limit = 20, status, search, goal }) {
  const query = {};

  if (status && status !== 'All') {
    query.status = status;
  }

  if (goal && goal !== 'All') {
    query.fitnessGoal = goal;
  }

  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { bookingReference: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;
  const [leads, total] = await Promise.all([
    Lead.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Lead.countDocuments(query),
  ]);

  return {
    leads,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateLeadStatus(id, { status, coachNotes }) {
  const lead = await Lead.findById(id);
  if (!lead) throw new Error('Lead not found');

  if (status) {
    const s = String(status).toLowerCase();
    if (s === 'pending' || s === 'new') lead.status = 'New';
    else if (s === 'contacted') lead.status = 'Contacted';
    else if (s === 'scheduled') lead.status = 'Scheduled';
    else if (s === 'attended' || s === 'completed') lead.status = 'Completed';
    else if (s === 'cancelled') lead.status = 'Cancelled';
    else lead.status = status;
  }
  if (coachNotes !== undefined) lead.coachNotes = coachNotes;

  await lead.save();
  return lead;
}

export async function deleteLeadById(id) {
  const lead = await Lead.findByIdAndDelete(id);
  if (!lead) throw new Error('Lead not found');
  return { success: true, message: 'Lead deleted' };
}

export async function exportLeadsToCsv() {
  const leads = await Lead.find().sort({ createdAt: -1 });
  const headers = [
    'Reference ID',
    'Full Name',
    'Phone',
    'Email',
    'Preferred Time',
    'Fitness Goal',
    'Experience Level',
    'Status',
    'Coach Notes',
    'Registered At',
  ];

  const rows = leads.map((l) => [
    `"${l.bookingReference}"`,
    `"${l.fullName.replace(/"/g, '""')}"`,
    `"+91 ${l.phone}"`,
    `"${l.email || ''}"`,
    `"${l.preferredTime}"`,
    `"${l.fitnessGoal}"`,
    `"${l.experienceLevel}"`,
    `"${l.status}"`,
    `"${(l.coachNotes || '').replace(/"/g, '""')}"`,
    `"${new Date(l.createdAt).toISOString()}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

