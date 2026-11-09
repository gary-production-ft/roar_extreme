import { Lead } from '../models/Lead.js';
import { ChatSession } from '../models/ChatSession.js';
import { UserPreference } from '../models/UserPreference.js';

export async function getDashboardMetrics() {
  const [
    totalLeads,
    newLeads,
    contactedLeads,
    scheduledLeads,
    completedLeads,
    cancelledLeads,
    totalChatSessions,
    totalPreferencesSaved,
  ] = await Promise.all([
    Lead.countDocuments(),
    Lead.countDocuments({ status: 'New' }),
    Lead.countDocuments({ status: 'Contacted' }),
    Lead.countDocuments({ status: 'Scheduled' }),
    Lead.countDocuments({ status: 'Completed' }),
    Lead.countDocuments({ status: 'Cancelled' }),
    ChatSession.countDocuments(),
    UserPreference.countDocuments(),
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
    },
    charts: {
      leadsOverTime: leadsOverTime.map((d) => ({ date: d._id, leads: d.count })),
      leadsByGoal: leadsByGoal.map((g) => ({ goal: g._id, count: g.count })),
      leadsByTime: leadsByTime.map((t) => ({ slot: t._id, count: t.count })),
    },
    recentLeads,
  };
}

