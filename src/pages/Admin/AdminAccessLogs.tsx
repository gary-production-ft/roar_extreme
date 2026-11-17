import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  Download,
  UserCheck,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

interface AccessLogItem {
  _id: string;
  memberId?: { _id: string; name: string; phone: string; memberId: string };
  memberName?: string;
  decision: 'granted' | 'denied';
  reason: string;
  matchDistance?: number;
  deviceId: string;
  timestamp: string;
  method: string;
}

interface AttendanceItem {
  _id: string;
  memberId: { _id: string; name: string; phone: string; memberId: string; status: string };
  checkInTime: string;
  method: 'face' | 'manual';
}

interface MemberOption {
  _id: string;
  name: string;
  phone: string;
  memberId: string;
}

export const AdminAccessLogs: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'access' | 'attendance'>('access');

  // Access Logs state
  const [accessLogs, setAccessLogs] = useState<AccessLogItem[]>([]);
  const [accessTotal, setAccessTotal] = useState(0);
  const [accessPage, setAccessPage] = useState(1);
  const [accessPages, setAccessPages] = useState(1);
  const [decisionFilter, setDecisionFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');

  // Attendance state
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceItem[]>([]);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePages, setAttendancePages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);

  // Manual Check-In Modal
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [membersList, setMembersList] = useState<MemberOption[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);

  const fetchAccessLogs = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: accessPage.toString(),
        limit: '20',
        ...(decisionFilter ? { decision: decisionFilter } : {}),
        ...(reasonFilter ? { reason: reasonFilter } : {}),
      });

      const res = await fetch(apiUrl(`/api/admin/access-logs?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAccessLogs(data.logs || []);
        setAccessTotal(data.pagination?.total || 0);
        setAccessPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching access logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: attendancePage.toString(),
        limit: '20',
      });

      const res = await fetch(apiUrl(`/api/admin/attendance?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setAttendanceLogs(data.attendance || []);
        setAttendanceTotal(data.pagination?.total || 0);
        setAttendancePages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching attendance logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'access') {
      fetchAccessLogs();
    } else {
      fetchAttendance();
    }
  }, [activeTab, accessPage, attendancePage, decisionFilter, reasonFilter]);

  const fetchActiveMembersForManual = async () => {
    try {
      const res = await fetch(apiUrl('/api/members?status=active&limit=100'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMembersList(data.members || []);
        if (data.members?.length > 0 && !selectedMemberId) {
          setSelectedMemberId(data.members[0]._id);
        }
      }
    } catch (err) {
      console.error('Error loading members for manual check-in:', err);
    }
  };

  const handleOpenManualCheckin = () => {
    setIsManualModalOpen(true);
    fetchActiveMembersForManual();
  };

  const handleManualCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    setIsSubmittingManual(true);
    try {
      const res = await fetch(apiUrl('/api/admin/attendance/manual'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: selectedMemberId,
          notes: manualNote,
        }),
      });

      if (res.ok) {
        setIsManualModalOpen(false);
        setManualNote('');
        if (activeTab === 'attendance') {
          fetchAttendance();
        } else {
          setActiveTab('attendance');
        }
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to record manual check-in.');
      }
    } catch (err) {
      console.error('Error submitting manual check-in:', err);
    } finally {
      setIsSubmittingManual(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black tracking-wider text-white">
            ACCESS & <span className="text-[#FF5A1F]">ATTENDANCE</span>
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Turnstile Facial Biometric Logs & Daily Check-In Records
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={apiUrl(
              activeTab === 'access'
                ? '/api/admin/access-logs/export/csv'
                : '/api/admin/attendance/export/csv'
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={handleOpenManualCheckin}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#FF5A1F]/20 cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>Manual Check-In</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('access')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'access'
              ? 'bg-[#FF5A1F] text-black shadow-lg shadow-[#FF5A1F]/20'
              : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Turnstile Access Logs ({accessTotal})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-[#FF5A1F] text-black shadow-lg shadow-[#FF5A1F]/20'
              : 'bg-white/5 hover:bg-white/10 text-white/60 hover:text-white'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Daily Attendance ({attendanceTotal})</span>
        </button>
      </div>

      {/* ACCESS LOGS TAB */}
      {activeTab === 'access' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <select
                value={decisionFilter}
                onChange={(e) => {
                  setDecisionFilter(e.target.value);
                  setAccessPage(1);
                }}
                className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#FF5A1F] cursor-pointer"
              >
                <option value="">All Decisions</option>
                <option value="granted">Granted Only</option>
                <option value="denied">Denied Only</option>
              </select>

              <select
                value={reasonFilter}
                onChange={(e) => {
                  setReasonFilter(e.target.value);
                  setAccessPage(1);
                }}
                className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#FF5A1F] cursor-pointer"
              >
                <option value="">All Reasons</option>
                <option value="granted">Granted</option>
                <option value="no_face_match">No Face Match</option>
                <option value="low_confidence">Low Confidence / Ambiguous</option>
                <option value="membership_expired">Membership Expired</option>
                <option value="payment_pending">Payment Pending</option>
                <option value="membership_frozen">Membership Frozen</option>
                <option value="member_blocked">Member Blocked</option>
                <option value="liveness_failed">Liveness Failed (Anti-Spoof)</option>
                <option value="outside_hours">Outside Hours</option>
              </select>
            </div>

            <div className="text-xs font-mono text-white/50">
              Total Log Entries: <span className="text-white font-bold">{accessTotal}</span>
            </div>
          </div>

          {/* Access Logs Table */}
          <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-white/50 uppercase font-mono text-[10px] tracking-wider">
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5">Decision</th>
                    <th className="px-5 py-3.5">Reason Code</th>
                    <th className="px-5 py-3.5">Member</th>
                    <th className="px-5 py-3.5">Distance</th>
                    <th className="px-5 py-3.5">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-white/40 font-mono">
                        <div className="w-6 h-6 border-2 border-[#FF5A1F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading turnstile log events...
                      </td>
                    </tr>
                  ) : accessLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-white/40 font-mono">
                        No access attempt logs recorded under current filter.
                      </td>
                    </tr>
                  ) : (
                    accessLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-white/70">
                          {new Date(log.timestamp).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5">
                          {log.decision === 'granted' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              Granted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded font-bold">
                              <XCircle className="w-3 h-3" />
                              Denied
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-white/80">
                          {log.reason}
                        </td>
                        <td className="px-5 py-3.5">
                          {log.memberId ? (
                            <div>
                              <div className="font-semibold text-white">{log.memberId.name}</div>
                              <div className="text-[10px] font-mono text-[#FF5A1F]">{log.memberId.memberId}</div>
                            </div>
                          ) : (
                            <span className="text-white/40 italic">Unknown / Unregistered</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-white/60">
                          {log.matchDistance != null ? log.matchDistance.toFixed(4) : '—'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[10px] text-white/40">
                          {log.deviceId}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono">
              <span>Page {accessPage} of {accessPages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={accessPage <= 1}
                  onClick={() => setAccessPage(accessPage - 1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={accessPage >= accessPages}
                  onClick={() => setAccessPage(accessPage + 1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE TAB */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-white/50 uppercase font-mono text-[10px] tracking-wider">
                    <th className="px-5 py-3.5">Check-In Time</th>
                    <th className="px-5 py-3.5">Member Name</th>
                    <th className="px-5 py-3.5">Member ID</th>
                    <th className="px-5 py-3.5">Phone Number</th>
                    <th className="px-5 py-3.5">Method</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-white/40 font-mono">
                        <div className="w-6 h-6 border-2 border-[#FF5A1F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Loading verified attendance entries...
                      </td>
                    </tr>
                  ) : attendanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-white/40 font-mono">
                        No attendance check-ins on record.
                      </td>
                    </tr>
                  ) : (
                    attendanceLogs.map((item) => (
                      <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3.5 font-mono text-white/80">
                          {new Date(item.checkInTime).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-white">
                          {item.memberId?.name || 'Unknown'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[#FF5A1F]">
                          {item.memberId?.memberId || '—'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-white/60">
                          {item.memberId?.phone || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                              item.method === 'face'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {item.method}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono">
              <span>Page {attendancePage} of {attendancePages}</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={attendancePage <= 1}
                  onClick={() => setAttendancePage(attendancePage - 1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={attendancePage >= attendancePages}
                  onClick={() => setAttendancePage(attendancePage + 1)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MANUAL CHECK-IN MODAL --- */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Manual Attendance Check-In
              </h3>
              <button onClick={() => setIsManualModalOpen(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualCheckInSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-white/60 mb-1">Select Active Member</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                >
                  {membersList.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.memberId} - {m.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/60 mb-1">Check-In Notes / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Member forgot scan / optical calibration"
                  value={manualNote}
                  onChange={(e) => setManualNote(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs uppercase tracking-wider font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="px-5 py-2 rounded-xl bg-[#FF5A1F] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#FF5A1F]/90 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingManual ? 'Logging...' : 'Confirm Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAccessLogs;
