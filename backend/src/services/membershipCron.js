import { Member } from '../models/Member.js';
import { logger } from '../utils/logger.js';

/**
 * Scan all active members whose membershipEndDate has passed and update status to 'expired'
 * @param {Date} [now=new Date()]
 * @returns {Promise<{ updatedCount: number }>}
 */
export async function updateExpiredMemberships(now = new Date()) {
  try {
    const result = await Member.updateMany(
      {
        status: 'active',
        membershipEndDate: { $lt: now },
      },
      {
        $set: { status: 'expired' },
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`[MEMBERSHIP CRON] Marked ${result.modifiedCount} memberships as expired.`);
    }

    return { updatedCount: result.modifiedCount };
  } catch (err) {
    logger.error(`[MEMBERSHIP CRON] Error updating expired memberships: ${err.message}`);
    throw err;
  }
}
