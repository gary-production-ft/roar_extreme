import { getDashboardMetrics } from '../services/analyticsService.js';

export async function getDashboardData(req, res, next) {
  try {
    const data = await getDashboardMetrics();
    res.json({
      success: true,
      data: {
        totalLeads: data.metrics.totalLeads,
        attendedLeads: data.metrics.completedLeads,
        pendingLeads: data.metrics.newLeads,
        scheduledLeads: data.metrics.scheduledLeads,
        contactedLeads: data.metrics.contactedLeads,
        conversionRate: data.metrics.conversionRate,
        chatSessionsCount: data.metrics.totalChatSessions,
        goalDistribution: data.charts.leadsByGoal,
        preferredTimeDistribution: data.charts.leadsByTime.map((t) => ({ time: t.slot, count: t.count })),
        leadsByDay: data.charts.leadsOverTime.map((d) => ({ date: d.date, count: d.leads })),
        recentLeads: data.recentLeads,
      },
      ...data,
    });
  } catch (err) {
    next(err);
  }
}

