import { Lead } from '../models/Lead.js';
import { createMember } from './memberService.js';
import { logAdminAudit } from '../utils/auditLogger.js';

/**
 * Convert a sales lead into an active gym member
 * @param {string} leadId
 * @param {Object} conversionData
 * @param {string} conversionData.planId
 * @param {string} [conversionData.paymentMethod='cash']
 * @param {number} [conversionData.amountPaid=0]
 * @param {string|Date} [conversionData.startDate]
 * @param {Object} adminUser Admin performing the action
 * @param {Object} req Express request object for audit logging
 */
export async function convertLeadToMember(leadId, conversionData, adminUser, req = null) {
  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new Error('Lead not found.');
  }

  // Pre-fill member attributes from existing lead record
  const memberData = {
    name: lead.fullName,
    phone: lead.phone,
    email: lead.email || '',
    planId: conversionData.planId,
    membershipStartDate: conversionData.startDate || new Date(),
    paymentMethod: conversionData.paymentMethod || 'cash',
    amountPaid: conversionData.amountPaid || 0,
    sourceLeadId: lead._id,
    notes: `Converted from lead reference: ${lead.bookingReference || lead.reference}`,
  };

  const member = await createMember(memberData, adminUser, req);

  // Update lead status to 'converted'
  lead.status = 'converted';
  lead.coachNotes = (lead.coachNotes ? lead.coachNotes + '\n' : '') + `Converted to Member ${member.memberId} on ${new Date().toLocaleDateString('en-IN')}`;
  await lead.save();

  if (req) {
    await logAdminAudit(req, 'LEAD_CONVERTED_TO_MEMBER', `Lead:${lead._id}`, {
      leadReference: lead.bookingReference || lead.reference,
      memberId: member.memberId,
      memberName: member.name,
      planId: conversionData.planId,
    });
  }

  return { member, lead };
}
