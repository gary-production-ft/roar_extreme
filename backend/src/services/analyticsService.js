import { Lead } from '../models/Lead.js';
import { ChatSession } from '../models/ChatSession.js';
import { UserPreference } from '../models/UserPreference.js';
import { Member } from '../models/Member.js';
import { Attendance } from '../models/Attendance.js';

export async function getDashboardMetrics() {
  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(next7Days.getDate() + 7);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalLeads,
    newLeads,
    contactedLeads,
    scheduledLeads,
    completedLeads,
    cancelledLeads,
    totalChatSessions,
    totalPreferencesSaved,
    totalMembers,
    activeMembers,
    expiringSoonMembers,
    paymentPendingMembers,
    todayAttendance,
  ] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ status: { $in: ['New', 'pending'] } }),
    Lead.countDocuments({ status: { $in: ['Contacted', 'contacted'] } }),
    Lead.countDocuments({ status: { $in: ['Scheduled', 'trial_scheduled'] } }),
    Lead.countDocuments({ status: { $in: ['Completed', 'completed', 'attended', 'converted'] } }),
    Lead.countDocuments({ status: { $in: ['Cancelled', 'cancelled', 'archived'] } }),
    ChatSession.countDocuments(),
    UserPreference.countDocuments(),
    Member.countDocuments(),
    Member.countDocuments({ status: 'active' }),
    Member.countDocuments({
      status: { $ne: 'expired' },
      membershipEndDate: { $gte: now, $lte: next7Days },
    }),
    Member.countDocuments({ paymentStatus: { $ne: 'paid' } }),
    Attendance.countDocuments({ checkInTime: { $gte: startOfToday } }),
  ]);

  // Aggregation: Leads by Date (last 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const leadsOverTime = await Lead.aggregate([
    {
      $match: { createdAt: { $gte: fourteenDaysAgo } },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Aggregation: Leads by Goal
  const leadsByGoal = await Lead.aggregate([
    {
      $group: {
        _id: '$fitnessGoal',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Aggregation: Leads by Time Slot
  const leadsByTime = await Lead.aggregate([
    {
      $group: {
        _id: '$preferredTime',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Recent 5 leads
  const recentLeads = await Lead.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .select('fullName phone bookingReference status createdAt preferredTime fitnessGoal');

  return {
    metrics: {
      totalLeads,
      newLeads,
      contactedLeads,
      scheduledLeads,
      completedLeads,
      cancelledLeads,
      conversionRate: totalLeads > 0 ? Math.round((completedLeads / totalLeads) * 100) : 0,
      totalChatSessions,
      totalPreferencesSaved,
      totalMembers,
      activeMembers,
      expiringSoonMembers,
      paymentPendingMembers,
      todayAttendance,
    },
    charts: {
      leadsOverTime: leadsOverTime.map((d) => ({ date: d._id, leads: d.count })),
      leadsByGoal: leadsByGoal.map((g) => ({ goal: g._id, count: g.count })),
      leadsByTime: leadsByTime.map((t) => ({ slot: t._id, count: t.count })),
    },
    recentLeads,
  };
}
