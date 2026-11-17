import { Member } from '../models/Member.js';
import { isWithinOperatingHours } from '../config/businessHours.js';
import { env } from '../config/environment.js';

/**
 * Single source of truth access decision function for gym entry & turnstile / door lock.
 * Phase 1: Software & webcam access.
 * Phase 2: Direct plug-in for hardware GPIO/relay without modifying this function.
 *
 * @param {string|Object} memberOrId Member mongoose document or memberId (ObjectId or memberId string)
 * @param {Date} [now=new Date()] Evaluation timestamp (defaults to current server time)
 * @returns {Promise<{ allowed: boolean, reason: string, daysRemaining: number, memberName: string|null, warningExpiringSoon?: boolean, member?: Object }>}
 */
export async function evaluateAccess(memberOrId, now = new Date()) {
  // 1. Operating Hours Check (Asia/Kolkata)
  if (!isWithinOperatingHours(now)) {
    let name = null;
    if (typeof memberOrId === 'object' && memberOrId?.name) {
      name = memberOrId.name;
    }
    return {
      allowed: false,
      reason: 'outside_hours',
      daysRemaining: 0,
      memberName: name,
    };
  }

  // 2. Fetch Member Document if an ID was passed
  let member = memberOrId;
  if (typeof memberOrId === 'string' || (memberOrId && !memberOrId.name)) {
    member = await Member.findOne({
      $or: [{ _id: memberOrId }, { memberId: memberOrId }],
    }).populate('planId');
  }

  if (!member) {
    return {
      allowed: false,
      reason: 'no_face_match',
      daysRemaining: 0,
      memberName: null,
    };
  }

  const memberName = member.name;

  // 3. Blocked Check
  if (member.isBlocked || member.status === 'blocked') {
    return {
      allowed: false,
      reason: 'member_blocked',
      daysRemaining: 0,
      memberName,
      member,
    };
  }

  // 4. Frozen Check
  if (member.isFrozen || member.status === 'frozen') {
    return {
      allowed: false,
      reason: 'membership_frozen',
      daysRemaining: 0,
      memberName,
      member,
    };
  }

  // 5. Payment Status Check
  if (member.paymentStatus !== 'paid') {
    return {
      allowed: false,
      reason: 'payment_pending',
      daysRemaining: 0,
      memberName,
      member,
    };
  }

  // 6. Membership Date Boundaries (Asia/Kolkata Calendar comparison)
  const nowDate = new Date(now);
  const startDate = new Date(member.membershipStartDate);
  const endDate = new Date(member.membershipEndDate);

  // Extend endDate by configurable grace period (in days)
  const gracePeriodDays = env.gracePeriodDays || 0;
  const effectiveEndDate = new Date(endDate);
  effectiveEndDate.setDate(effectiveEndDate.getDate() + gracePeriodDays);
  // Set to end of day in UTC representation of effective date
  effectiveEndDate.setHours(23, 59, 59, 999);

  // Calculate days remaining (floor of difference in 24h intervals)
  const msDiff = effectiveEndDate.getTime() - nowDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil(msDiff / (1000 * 60 * 60 * 24)));

  if (nowDate.getTime() < startDate.getTime() || nowDate.getTime() > effectiveEndDate.getTime()) {
    return {
      allowed: false,
      reason: 'membership_expired',
      daysRemaining: 0,
      memberName,
      member,
    };
  }

  // 7. Access Granted!
  const warningExpiringSoon = daysRemaining <= 7;
  return {
    allowed: true,
    reason: 'granted',
    daysRemaining,
    memberName,
    warningExpiringSoon,
    member,
  };
}
