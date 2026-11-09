import React, { useEffect, useState } from 'react';
import {
  Users,
  Award,
  Clock,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

interface RecentLead {
  _id: string;
  fullName: string;
  phone: string;
  bookingReference: string;
  status: string;
  createdAt: string;
  preferredTime: string;
  fitnessGoal: string;
}

interface DashboardData {
  totalLeads: number;
  attendedLeads: number;
  pendingLeads: number;
  conversionRate: string;
  goalDistribution: Array<{ name: string; value: number }>;
  timeDistribution: Array<{ name: string; value: number }>;
  leadsByDay: Array<{ date: string; leads: number }>;
  chatSessionsCount: number;
  recentLeads: RecentLead[];
}

const COLORS = ['#FF5A1F', '#FF8552', '#FFAE85', '#38BDF8', '#818CF8', '#A78BFA'];

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(apiUrl('/api/dashboard'), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to load dashboard metrics');
      }

      const resData = await res.json();
      const raw = resData.data || resData.metrics || {};
      const charts = resData.charts || {};

      setData({
        totalLeads: raw.totalLeads ?? 0,
        attendedLeads: raw.attendedLeads ?? raw.completedLeads ?? 0,
        pendingLeads: raw.pendingLeads ?? raw.newLeads ?? 0,
        conversionRate: raw.conversionRate !== undefined ? `${raw.conversionRate}%` : '0%',
        chatSessionsCount: raw.chatSessionsCount ?? raw.totalChatSessions ?? 0,
        recentLeads: raw.recentLeads || resData.recentLeads || [],
        goalDistribution: (raw.goalDistribution || charts.leadsByGoal || []).map((g: any) => ({
          name: (g.goal || g._id || 'Other').replace('-', ' ').toUpperCase(),
          value: g.count || 0,
        })),
        timeDistribution: (raw.preferredTimeDistribution || charts.leadsByTime || []).map((t: any) => ({
          name: (t.time || t.slot || t._id || 'General').toUpperCase(),
          value: t.count || 0,
        })),
        leadsByDay: (raw.leadsByDay || charts.leadsOverTime || []).map((d: any) => ({
          date: d.date || d._id,
          leads: d.count || d.leads || 0,
        })),
      });
    } catch (err: any) {
      setError(err.message || 'Error connecting to analytics endpoint');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [token]);

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-white/50 space-y-3 font-sans">
        <RefreshCw className="w-8 h-8 animate-spin text-[#FF5A1F]" />
        <span className="text-xs uppercase font-mono tracking-wider">Loading Studio Metrics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-400 flex items-center justify-between font-sans">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs">{error || 'Unable to retrieve metrics'}</span>
        </div>
        <button
          onClick={fetchDashboardStats}
          className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-semibold uppercase tracking-wider text-white cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl tracking-wider text-white uppercase">
            ROAR EXTREME ANALYTICS
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Real-time lead conversion and rooftop studio performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardStats}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Metrics</span>
          </button>

          <Link
            to="/admin/leads"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7545] text-black font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer shadow-lg shadow-[#FF5A1F]/20"
          >
            <span>Manage Leads</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-white/50 tracking-wider">Total Leads</span>
            <div className="p-2 rounded-xl bg-[#FF5A1F]/10 text-[#FF5A1F]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-white">{data.totalLeads}</span>
            <span className="text-xs text-white/40 font-mono">Applications</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-white/50 tracking-wider">Attended Sessions</span>
            <div className="p-2 rounded-xl bg-green-500/10 text-green-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-white">{data.attendedLeads}</span>
            <span className="text-xs text-green-400/80 font-mono">Completed</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-white/50 tracking-wider">Conversion Rate</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-white">{data.conversionRate}</span>
            <span className="text-xs text-white/40 font-mono">Trial to Member</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111111] border border-white/10 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-white/50 tracking-wider">AI Chat Inquiries</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-white">{data.chatSessionsCount}</span>
            <span className="text-xs text-purple-400/80 font-mono">Conversations</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#111111] border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-base text-white tracking-wide">
              APPLICATION VOLUME (LAST 14 DAYS)
            </h2>
            <span className="text-[11px] font-mono text-white/40 uppercase">Daily Inquiries</span>
          </div>
          <div className="h-64 w-full">
            {data.leadsByDay.length === 0 ? (
              <div className="h-full flex items-center justify-center text-white/30 text-xs font-mono">
                No recent submission data to graph.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.leadsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF5A1F" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#FF5A1F" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    stroke="#555"
                    fontSize={10}
                    tickFormatter={(val) => (val ? String(val).slice(5) : '')}
                  />
                  <YAxis stroke="#555" fontSize={10} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#181818',
                      borderColor: '#333',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leads"
                    stroke="#FF5A1F"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorLeads)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Goals Pie Chart */}
        <div className="p-6 rounded-2xl bg-[#111111] border border-white/10 flex flex-col">
          <h2 className="font-heading font-bold text-base text-white tracking-wide mb-2">
            PRIMARY FITNESS GOALS
          </h2>
          <div className="flex-1 h-52 w-full flex items-center justify-center">
            {data.goalDistribution.length === 0 ? (
              <div className="text-white/30 text-xs font-mono">No goal data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.goalDistribution}
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.goalDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#181818',
                      borderColor: '#333',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="mt-2 space-y-1">
            {data.goalDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px] text-white/70">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  {item.name}
                </span>
                <span className="font-mono text-white/40">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preferred Time Bar Chart */}
      <div className="p-6 rounded-2xl bg-[#111111] border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FF5A1F]" />
            <h2 className="font-heading font-bold text-base text-white tracking-wide">
              PREFERRED TRAINING TIME DISTRIBUTION
            </h2>
          </div>
          <span className="text-[11px] font-mono text-white/40 uppercase">Rooftop Slot Popularity</span>
        </div>
        <div className="h-48 w-full">
          {data.timeDistribution.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/30 text-xs font-mono">
              No slot data available yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.timeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#555" fontSize={11} />
                <YAxis stroke="#555" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#181818',
                    borderColor: '#333',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#FF5A1F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Leads Quick Overview Table */}
      {data.recentLeads && data.recentLeads.length > 0 && (
        <div className="p-6 rounded-2xl bg-[#111111] border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-white tracking-wide uppercase">
              RECENT TRIAL APPLICATIONS
            </h2>
            <Link
              to="/admin/leads"
              className="text-xs font-bold text-[#FF5A1F] hover:underline flex items-center gap-1"
            >
              <span>View All Applications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-white/40 uppercase font-mono tracking-wider border-b border-white/10 pb-2">
                <tr>
                  <th className="pb-3">Applicant</th>
                  <th className="pb-3">Mobile</th>
                  <th className="pb-3">Goal</th>
                  <th className="pb-3">Slot</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.recentLeads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-white/[0.02]">
                    <td className="py-3 font-semibold text-white">
                      {lead.fullName}
                      <span className="block font-mono text-[10px] text-[#FF5A1F]">
                        {lead.bookingReference}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-white/80">
                      <a href={`tel:${lead.phone}`} className="hover:underline flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#FF5A1F]" />
                        {lead.phone}
                      </a>
                    </td>
                    <td className="py-3 capitalize text-white/70">
                      {lead.fitnessGoal?.replace('-', ' ')}
                    </td>
                    <td className="py-3 capitalize text-white/70">{lead.preferredTime}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-white/5 text-white/80 border border-white/10">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#FF5A1F]" />
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
