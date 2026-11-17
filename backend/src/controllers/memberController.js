import { z } from 'zod';
import { Member } from '../models/Member.js';
import { Payment } from '../models/Payment.js';
import { AccessLog } from '../models/AccessLog.js';
import { Attendance } from '../models/Attendance.js';
import { FaceTemplate } from '../models/FaceTemplate.js';
import {
  getMembersList,
  createMember,
  enrolMemberFace,
  deleteMemberBiometrics,
  renewMembership,
  recordMemberPayment,
  toggleMemberFreeze,
  toggleMemberBlock,
  exportMembersToCsv,
} from '../services/memberService.js';
import { convertLeadToMember } from '../services/leadConversionService.js';

export const createMemberSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'),
    email: z.string().email().optional().or(z.literal('')),
    planId: z.string().min(1, 'Plan selection is required'),
    membershipStartDate: z.string().optional(),
    amountPaid: z.number().min(0).default(0),
    paymentMethod: z.enum(['cash', 'UPI', 'card', 'other']).default('cash'),
    notes: z.string().optional(),
  }),
});

export const enrolFaceSchema = z.object({
  body: z.object({
    descriptors: z.array(z.array(z.number())).min(3).max(5),
    faceConsent: z.object({
      given: z.literal(true, {
        errorMap: () => ({ message: 'Explicit consent is required under DPDP Act before biometric enrollment.' }),
      }),
      noticeVersion: z.string().default('1.0-DPDP-2023'),
    }),
  }),
});

export const renewMemberSchema = z.object({
  body: z.object({
    planId: z.string().min(1),
    amountPaid: z.number().min(0),
    paymentMethod: z.enum(['cash', 'UPI', 'card', 'other']).default('cash'),
    notes: z.string().optional(),
  }),
});

export const recordPaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive('Payment amount must be greater than zero'),
    method: z.enum(['cash', 'UPI', 'card', 'other']),
    notes: z.string().optional(),
  }),
});

export const convertLeadSchema = z.object({
  body: z.object({
    planId: z.string().min(1, 'Please select a membership plan'),
    amountPaid: z.number().min(0).default(0),
    paymentMethod: z.enum(['cash', 'UPI', 'card', 'other']).default('cash'),
    startDate: z.string().optional(),
  }),
});

export async function listMembers(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const { search, status, paymentStatus, expiringSoon } = req.query;

    const data = await getMembersList({
      page,
      limit,
      search,
      status,
      paymentStatus,
      expiringSoon: expiringSoon === 'true',
    });

    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
}

export async function getMemberDetails(req, res, next) {
  try {
    const { id } = req.params;
    const member = await Member.findById(id).populate('planId').populate('sourceLeadId');
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const [payments, recentAttendance, recentAccessLogs, faceTemplate] = await Promise.all([
      Payment.find({ memberId: member._id }).populate('recordedBy', 'name email').sort({ paidAt: -1 }).limit(10),
      Attendance.find({ memberId: member._id }).sort({ checkInTime: -1 }).limit(10),
      AccessLog.find({ memberId: member._id }).sort({ timestamp: -1 }).limit(10),
      FaceTemplate.findOne({ memberId: member._id }).select('descriptorCount modelVersion enrolledAt'),
    ]);

    res.json({
      success: true,
      member,
      payments,
      recentAttendance,
      recentAccessLogs,
      biometrics: faceTemplate
        ? {
            enrolled: true,
            descriptorCount: faceTemplate.descriptorCount,
            modelVersion: faceTemplate.modelVersion,
            enrolledAt: faceTemplate.enrolledAt,
          }
        : { enrolled: false },
    });
  } catch (err) {
    next(err);
  }
}

export async function createMemberHandler(req, res, next) {
  try {
    const member = await createMember(req.validatedData.body, req.admin, req);
    res.status(201).json({
      success: true,
      member,
      message: 'Member registered successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function enrolFaceHandler(req, res, next) {
  try {
    const { id } = req.params;
    const { descriptors, faceConsent } = req.validatedData.body;

    const member = await enrolMemberFace(
      id,
      {
        descriptors,
        consentNoticeVersion: faceConsent.noticeVersion,
      },
      req
    );

    res.json({
      success: true,
      member,
      message: 'Face biometric template encrypted and enrolled successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteBiometricsHandler(req, res, next) {
  try {
    const { id } = req.params;
    const member = await deleteMemberBiometrics(id, req);
    res.json({
      success: true,
      member,
      message: 'Biometric records permanently erased pursuant to DPDP compliance.',
    });
  } catch (err) {
    next(err);
  }
}

export async function renewMemberHandler(req, res, next) {
  try {
    const { id } = req.params;
    const member = await renewMembership(id, req.validatedData.body, req.admin, req);
    res.json({
      success: true,
      member,
      message: 'Membership renewed successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function recordPaymentHandler(req, res, next) {
  try {
    const { id } = req.params;
    const result = await recordMemberPayment(id, req.validatedData.body, req.admin, req);
    res.json({
      success: true,
      ...result,
      message: 'Payment recorded successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function freezeMemberHandler(req, res, next) {
  try {
    const { id } = req.params;
    const member = await toggleMemberFreeze(id, true, req);
    res.json({ success: true, member, message: 'Membership frozen.' });
  } catch (err) {
    next(err);
  }
}

export async function unfreezeMemberHandler(req, res, next) {
  try {
    const { id } = req.params;
    const member = await toggleMemberFreeze(id, false, req);
    res.json({ success: true, member, message: 'Membership un-frozen.' });
  } catch (err) {
    next(err);
  }
}

export async function blockMemberHandler(req, res, next) {
  try {
    const { id } = req.params;
    const member = await toggleMemberBlock(id, true, req);
    res.json({ success: true, member, message: 'Member blocked from facility access.' });
  } catch (err) {
    next(err);
  }
}

export async function unblockMemberHandler(req, res, next) {
  try {
    const { id } = req.params;
    const member = await toggleMemberBlock(id, false, req);
    res.json({ success: true, member, message: 'Member unblocked.' });
  } catch (err) {
    next(err);
  }
}

export async function exportMembersCsv(req, res, next) {
  try {
    const csv = await exportMembersToCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="roar_members_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function convertLeadHandler(req, res, next) {
  try {
    const { id } = req.params;
    const result = await convertLeadToMember(id, req.validatedData.body, req.admin, req);
    res.status(201).json({
      success: true,
      ...result,
      message: `Lead successfully converted to Member ${result.member.memberId}`,
    });
  } catch (err) {
    next(err);
  }
}
