import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  UserCheck,
  XCircle,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  PhoneCall,
  Calendar,
  Trash2,
  MessageSquare,
  X,
  Save,
  UserPlus,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LeadItem {
  _id: string;
  reference: string;
  bookingReference?: string;
  fullName: string;
  phone: string;
  email?: string;
  preferredTime: string;
  fitnessGoal: string;
  experienceLevel: string;
  status: string;
  coachNotes?: string;
  createdAt: string;
}

export const AdminLeads: React.FC = () => {
  const { token } = useAuth();
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [goalFilter, setGoalFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Walk-in Lead Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    preferredTime: 'morning',
    fitnessGoal: 'strength',
    experienceLevel: 'beginner',
  });

  // Coach Notes Modal State
  const [activeNotesLead, setActiveNotesLead] = useState<LeadItem | null>(null);
  const [notesText, setNotesText] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(goalFilter ? { goal: goalFilter } : {}),
      });

      const res = await fetch(`/api/leads?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setTotalLeads(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [token, page, statusFilter, goalFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLeads();
  };

  const handleStatusChange = async (leadId: string, nextStatus: string) => {
    setUpdatingId(leadId);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        setLeads((prev) =>
          prev.map((lead) => (lead._id === leadId ? { ...lead, status: nextStatus } : lead))
        );
      }
    } catch (err) {
      console.error('Failed to update lead status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteLead = async (leadId: string, name: string) => {
    if (!window.confirm(`Delete record for ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l._id !== leadId));
        setTotalLeads((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const handleAddWalkInLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    setAddError(null);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...addForm,
          source: 'walk_in_admin',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAddModalOpen(false);
        setAddForm({
          fullName: '',
          phone: '',
          email: '',
          preferredTime: 'morning',
          fitnessGoal: 'strength',
          experienceLevel: 'beginner',
        });
        fetchLeads();
      } else {
        setAddError(data.message || 'Validation error registering walk-in.');
      }
    } catch (err: any) {
      setAddError(err.message || 'Network error.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!activeNotesLead) return;
    setIsSavingNotes(true);

    try {
      const res = await fetch(`/api/leads/${activeNotesLead._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ coachNotes: notesText }),
      });

      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l._id === activeNotesLead._id ? { ...l, coachNotes: notesText } : l))
        );
        setActiveNotesLead(null);
      }
    } catch (err) {
      console.error('Failed to save coach notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleExportCSV = () => {
    window.open(`/api/leads/export/csv?token=${encodeURIComponent(token || '')}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'attended':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono uppercase bg-green-500/10 text-green-400 border border-green-500/25">
            <UserCheck className="w-3 h-3" /> Attended
          </span>
        );
      case 'contacted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/25">
            <CheckCircle2 className="w-3 h-3" /> Contacted
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/25">
            <Calendar className="w-3 h-3" /> Scheduled
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono uppercase bg-red-500/10 text-red-400 border border-red-500/25">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono uppercase bg-[#FF5A1F]/10 text-[#FF5A1F] border border-[#FF5A1F]/25">
            <Clock className="w-3 h-3" /> New
          </span>
        );
    }
  };

  const normalizeStatusForSelect = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'attended' || s === 'completed') return 'Completed';
    if (s === 'contacted') return 'Contacted';
    if (s === 'scheduled') return 'Scheduled';
    if (s === 'cancelled') return 'Cancelled';
    return 'New';
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl tracking-wider text-white uppercase">
            TRIAL PASS LEADS ({totalLeads})
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Manage inquiries, assign trial passes, and track rooftop attendance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-semibold transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#FF5A1F]" />
            <span>Register Walk-In</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7545] text-black font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer shadow-lg shadow-[#FF5A1F]/20"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111111] border border-white/10 flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by applicant name, phone, or ROAR reference..."
            className="w-full bg-[#181818] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5A1F] transition-colors"
          />
        </form>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#181818] border border-white/10 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-white/40" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-white/80 focus:outline-none text-xs cursor-pointer"
            >
              <option value="" className="bg-[#181818]">All Statuses</option>
              <option value="New" className="bg-[#181818]">New</option>
              <option value="Contacted" className="bg-[#181818]">Contacted</option>
              <option value="Scheduled" className="bg-[#181818]">Scheduled</option>
              <option value="Completed" className="bg-[#181818]">Attended</option>
              <option value="Cancelled" className="bg-[#181818]">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-[#181818] border border-white/10 rounded-xl px-3 py-1.5 text-xs">
            <select
              value={goalFilter}
              onChange={(e) => {
                setGoalFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-white/80 focus:outline-none text-xs cursor-pointer"
            >
              <option value="" className="bg-[#181818]">All Goals</option>
              <option value="weight-loss" className="bg-[#181818]">Weight Loss</option>
              <option value="muscle-building" className="bg-[#181818]">Muscle Building</option>
              <option value="strength" className="bg-[#181818]">Strength</option>
              <option value="general-fitness" className="bg-[#181818]">General Fitness</option>
            </select>
          </div>

          <button
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setGoalFilter('');
              setPage(1);
              fetchLeads();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
            title="Reset Filters"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl bg-[#111111] border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#181818] text-white/50 uppercase font-mono tracking-wider border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Applicant & Pass ID</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">Goal & Level</th>
                <th className="px-5 py-3.5">Time Slot</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-white/40">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#FF5A1F]" />
                    <span>Loading applicant records...</span>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-white/40">
                    No applicants match your filter criteria.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-white uppercase flex items-center gap-1.5">
                        <span>{lead.fullName}</span>
                        {lead.coachNotes && (
                          <span
                            title={`Coach Note: ${lead.coachNotes}`}
                            className="w-1.5 h-1.5 rounded-full bg-[#FF5A1F]"
                          />
                        )}
                      </div>
                      <div className="font-mono text-[10px] text-[#FF5A1F] mt-0.5">
                        {lead.reference}
                      </div>
                      <div className="text-[10px] text-white/40">
                        {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 space-y-1">
                      <div className="flex items-center gap-1.5 text-white/80">
                        <Phone className="w-3 h-3 text-[#FF5A1F]" />
                        <a href={`tel:${lead.phone}`} className="hover:underline font-mono">
                          {lead.phone}
                        </a>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-white/50">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[140px]">{lead.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="capitalize font-semibold text-white/90">
                        {lead.fitnessGoal.replace('-', ' ')}
                      </div>
                      <div className="text-[10px] text-white/40 uppercase font-mono">
                        Level: {lead.experienceLevel}
                      </div>
                    </td>

                    <td className="px-5 py-3.5 capitalize text-white/70">
                      {lead.preferredTime}
                    </td>

                    <td className="px-5 py-3.5">
                      {getStatusBadge(lead.status)}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Direct Call Button */}
                        <a
                          href={`tel:${lead.phone}`}
                          title={`Call ${lead.fullName}`}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-[#FF5A1F] text-white/70 hover:text-black transition-colors cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </a>

                        {/* Coach Notes Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveNotesLead(lead);
                            setNotesText(lead.coachNotes || '');
                          }}
                          title="View / Add Coach Notes"
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            lead.coachNotes
                              ? 'bg-[#FF5A1F]/15 text-[#FF5A1F] hover:bg-[#FF5A1F] hover:text-black'
                              : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Mark Contacted Button */}
                        <button
                          type="button"
                          disabled={updatingId === lead._id}
                          onClick={() => handleStatusChange(lead._id, 'Contacted')}
                          title="Mark as Contacted"
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Quick Mark Attended Button */}
                        <button
                          type="button"
                          disabled={updatingId === lead._id}
                          onClick={() => handleStatusChange(lead._id, 'Completed')}
                          title="Mark as Attended"
                          className="p-1.5 rounded-lg bg-green-500/10 hover:bg-green-500 text-green-400 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                        </button>

                        {/* Status Select Dropdown */}
                        <select
                          value={normalizeStatusForSelect(lead.status)}
                          disabled={updatingId === lead._id}
                          onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                          className="bg-[#181818] border border-white/15 rounded-lg px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#FF5A1F] cursor-pointer disabled:opacity-50"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Attended</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        {/* Delete Lead Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteLead(lead._id, lead.fullName)}
                          title="Delete Record"
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-white/10 bg-[#141414] flex items-center justify-between text-xs text-white/60">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Walk-In Registration Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#121212] border border-white/15 rounded-2xl p-6 shadow-2xl text-white font-sans">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#FF5A1F]" />
                <h3 className="font-heading font-black text-base uppercase tracking-wider text-white">
                  Register Walk-In Applicant
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs">
                {addError}
              </div>
            )}

            <form onSubmit={handleAddWalkInLead} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] uppercase font-mono text-white/60 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.fullName}
                  onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                  placeholder="Applicant Full Name"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-mono text-white/60 mb-1">
                  10-Digit Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase font-mono text-white/60 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="name@example.com"
                  className="w-full bg-[#181818] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] uppercase font-mono text-white/60 mb-1">
                    Preferred Time
                  </label>
                  <select
                    value={addForm.preferredTime}
                    onChange={(e) => setAddForm({ ...addForm, preferredTime: e.target.value })}
                    className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F] cursor-pointer"
                  >
                    <option value="morning">Morning (6 - 10:30 AM)</option>
                    <option value="afternoon">Afternoon (11 - 4 PM)</option>
                    <option value="evening">Evening (5 - 10 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-mono text-white/60 mb-1">
                    Fitness Goal
                  </label>
                  <select
                    value={addForm.fitnessGoal}
                    onChange={(e) => setAddForm({ ...addForm, fitnessGoal: e.target.value })}
                    className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F] cursor-pointer"
                  >
                    <option value="strength">Raw Strength</option>
                    <option value="muscle-building">Muscle Building</option>
                    <option value="weight-loss">Weight Loss</option>
                    <option value="general-fitness">General Fitness</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7545] disabled:opacity-50 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-[#FF5A1F]/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAdding ? 'Registering...' : 'Register Applicant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coach Notes Modal */}
      {activeNotesLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#121212] border border-white/15 rounded-2xl p-6 shadow-2xl text-white font-sans">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#FF5A1F]" />
                <div>
                  <h3 className="font-heading font-black text-sm uppercase tracking-wider text-white">
                    Coach Notes: {activeNotesLead.fullName}
                  </h3>
                  <span className="font-mono text-[10px] text-white/50">
                    {activeNotesLead.bookingReference}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveNotesLead(null)}
                className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] uppercase font-mono text-white/60 mb-1">
                  Private Session Notes & Membership Feedback
                </label>
                <textarea
                  rows={4}
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Record trial workout performance, coach consultation feedback, or membership interest..."
                  className="w-full bg-[#181818] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#FF5A1F] leading-relaxed resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveNotesLead(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingNotes}
                  onClick={handleSaveNotes}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#FF7545] disabled:opacity-50 text-black font-bold uppercase tracking-wider text-xs shadow-lg shadow-[#FF5A1F]/20 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
