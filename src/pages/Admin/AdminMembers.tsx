import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Download,
  ShieldCheck,
  ShieldAlert,
  Camera,
  RefreshCw,
  Clock,
  CreditCard,
  Ban,
  PauseCircle,
  PlayCircle,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';
import {
  loadFaceModels,
  detectSingleFaceDescriptor,
} from '../../utils/faceRecognition';

interface MemberPlan {
  _id: string;
  name: string;
  durationDays: number;
  price: number;
}

interface MemberItem {
  _id: string;
  memberId: string;
  name: string;
  phone: string;
  email?: string;
  status: 'active' | 'expired' | 'frozen' | 'blocked' | 'pending';
  planId?: MemberPlan;
  membershipStartDate: string;
  membershipEndDate: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  amountDue: number;
  isBlocked: boolean;
  isFrozen: boolean;
  faceEnrolled: boolean;
  faceConsent?: { given: boolean; timestamp?: string; noticeVersion?: string };
  createdAt: string;
}

export const AdminMembers: React.FC = () => {
  const { token, admin } = useAuth();
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [plans, setPlans] = useState<MemberPlan[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [expiringFilter, setExpiringFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [enrolMember, setEnrolMember] = useState<MemberItem | null>(null);
  const [renewMember, setRenewMember] = useState<MemberItem | null>(null);
  const [paymentMember, setPaymentMember] = useState<MemberItem | null>(null);
  const [detailsMember, setDetailsMember] = useState<MemberItem | null>(null);
  const [memberDetailsData, setMemberDetailsData] = useState<{
    payments?: Array<{ _id: string; amount: number; method: string; receiptNo: string; paidAt: string }>;
    recentAttendance?: Array<{ _id: string; checkInTime: string; method: string }>;
    recentAccessLogs?: Array<{ _id: string; decision: string; reason: string; timestamp: string }>;
  } | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: '',
    phone: '',
    email: '',
    planId: '',
    startDate: new Date().toISOString().slice(0, 10),
    amountPaid: 0,
    paymentMethod: 'cash',
    notes: '',
  });

  const [renewForm, setRenewForm] = useState({
    planId: '',
    amountPaid: 0,
    paymentMethod: 'cash',
    notes: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    method: 'cash',
    notes: '',
  });

  // Enrolment Wizard State
  const [enrolStep, setEnrolStep] = useState<'consent' | 'capture' | 'saving' | 'done'>('consent');
  const [consentChecked, setConsentChecked] = useState(false);
  const [capturedDescriptors, setCapturedDescriptors] = useState<number[][]>([]);
  const [enrolError, setEnrolError] = useState<string | null>(null);
  const enrolVideoRef = useRef<HTMLVideoElement | null>(null);
  const enrolStreamRef = useRef<MediaStream | null>(null);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(paymentFilter ? { paymentStatus: paymentFilter } : {}),
        ...(expiringFilter ? { expiringSoon: 'true' } : {}),
      });

      const res = await fetch(apiUrl(`/api/members?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setTotalMembers(data.pagination?.total || 0);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch(apiUrl('/api/plans'));
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
        if (data.plans?.length > 0 && !addForm.planId) {
          setAddForm((prev) => ({ ...prev, planId: data.plans[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page, search, statusFilter, paymentFilter, expiringFilter]);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Fetch detailed history for a member
  const handleOpenDetails = async (member: MemberItem) => {
    setDetailsMember(member);
    setMemberDetailsData(null);
    try {
      const res = await fetch(apiUrl(`/api/members/${member._id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMemberDetailsData(data);
      }
    } catch (err) {
      console.error('Error fetching member details:', err);
    }
  };

  // Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/members'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...addForm,
          membershipStartDate: addForm.startDate,
          amountPaid: Number(addForm.amountPaid),
        }),
      });

      if (res.ok) {
        setIsAddModalOpen(false);
        fetchMembers();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to create member');
      }
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  // Renew Membership
  const handleRenewMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewMember) return;
    try {
      const res = await fetch(apiUrl(`/api/members/${renewMember._id}/renew`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...renewForm,
          amountPaid: Number(renewForm.amountPaid),
        }),
      });

      if (res.ok) {
        setRenewMember(null);
        fetchMembers();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Renewal failed');
      }
    } catch (err) {
      console.error('Error renewing member:', err);
    }
  };

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMember) return;
    try {
      const res = await fetch(apiUrl(`/api/members/${paymentMember._id}/payment`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...paymentForm,
          amount: Number(paymentForm.amount),
        }),
      });

      if (res.ok) {
        setPaymentMember(null);
        fetchMembers();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Payment recording failed');
      }
    } catch (err) {
      console.error('Error recording payment:', err);
    }
  };

  // Status Toggles
  const handleToggleFreeze = async (member: MemberItem) => {
    const action = member.isFrozen ? 'unfreeze' : 'freeze';
    if (!confirm(`Are you sure you want to ${action} membership for ${member.name}?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/members/${member._id}/${action}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchMembers();
    } catch (err) {
      console.error('Error toggling freeze:', err);
    }
  };

  const handleToggleBlock = async (member: MemberItem) => {
    const action = member.isBlocked ? 'unblock' : 'block';
    if (!confirm(`Are you sure you want to ${action} facility access for ${member.name}?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/members/${member._id}/${action}`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) fetchMembers();
    } catch (err) {
      console.error('Error toggling block:', err);
    }
  };

  const handleDeleteBiometrics = async (member: MemberItem) => {
    if (
      !confirm(
        `DPDP ACT STATUTORY COMPLIANCE:\nPermanently erase facial biometric template for ${member.name}? This action is irreversible.`
      )
    )
      return;
    try {
      const res = await fetch(apiUrl(`/api/members/${member._id}/face`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert('Biometric data erased successfully.');
        fetchMembers();
      }
    } catch (err) {
      console.error('Error deleting biometrics:', err);
    }
  };

  // Face Enrolment Camera Handlers
  const startEnrolCamera = async () => {
    setEnrolError(null);
    try {
      await loadFaceModels();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      enrolStreamRef.current = stream;
      if (enrolVideoRef.current) {
        enrolVideoRef.current.srcObject = stream;
        await enrolVideoRef.current.play();
      }
    } catch (err) {
      console.error('Enrolment camera error:', err);
      setEnrolError('Could not start webcam. Please verify camera permissions.');
    }
  };

  const stopEnrolCamera = () => {
    if (enrolStreamRef.current) {
      enrolStreamRef.current.getTracks().forEach((t) => t.stop());
      enrolStreamRef.current = null;
    }
  };

  const captureEnrolFrame = async () => {
    if (!enrolVideoRef.current) return;
    try {
      const det = await detectSingleFaceDescriptor(enrolVideoRef.current);
      if (!det) {
        setEnrolError('No clear face detected in camera view. Please align face inside the frame.');
        return;
      }
      setEnrolError(null);
      const updated = [...capturedDescriptors, det.descriptor];
      setCapturedDescriptors(updated);

      if (updated.length >= 3) {
        // We have sufficient captures (3)! Automatically submit to backend
        stopEnrolCamera();
        setEnrolStep('saving');
        await submitEnrolment(updated);
      }
    } catch (err) {
      console.error('Error during capture:', err);
    }
  };

  const submitEnrolment = async (descriptors: number[][]) => {
    if (!enrolMember) return;
    try {
      const res = await fetch(apiUrl(`/api/members/${enrolMember._id}/enrol-face`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          descriptors,
          faceConsent: {
            given: true,
            noticeVersion: '1.0-DPDP-2023',
          },
        }),
      });

      if (res.ok) {
        setEnrolStep('done');
        fetchMembers();
      } else {
        const err = await res.json();
        setEnrolError(err.message || 'Failed to save biometric template.');
        setEnrolStep('capture');
      }
    } catch (err) {
      console.error('Enrolment submission error:', err);
      setEnrolError('Network error saving biometric descriptors.');
      setEnrolStep('capture');
    }
  };

  const closeEnrolWizard = () => {
    stopEnrolCamera();
    setEnrolMember(null);
    setEnrolStep('consent');
    setConsentChecked(false);
    setCapturedDescriptors([]);
    setEnrolError(null);
  };

  const getStatusBadge = (status: string, isBlocked: boolean, isFrozen: boolean) => {
    if (isBlocked) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
          Blocked
        </span>
      );
    }
    if (isFrozen) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
          Frozen
        </span>
      );
    }
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        );
      case 'expired':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
            Expired
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-white/70">
            {status}
          </span>
        );
    }
  };

  const isOwner = admin?.role === 'owner' || admin?.role === 'superadmin';

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black tracking-wider text-white">
            MEMBER <span className="text-[#FF5A1F]">MANAGEMENT</span>
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Active Studio Members & Biometric Turnstile Access
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={apiUrl('/api/members/export/csv')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#FF5A1F]/90 text-black text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#FF5A1F]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Statutory Legal Notice Alert */}
      <div className="p-3.5 rounded-2xl bg-[#FF5A1F]/10 border border-[#FF5A1F]/30 flex items-start gap-3">
        <Info className="w-4 h-4 text-[#FF5A1F] shrink-0 mt-0.5" />
        <div className="text-[11px] text-white/80 leading-relaxed">
          <span className="font-semibold text-white">Statutory DPDP Act Advisory:</span> All biometric enrollment must be preceded by explicit digital consent. In compliance with India’s Digital Personal Data Protection Act, 2023, raw images are never recorded and 128-d descriptors are stored under AES-256-GCM encryption. Please ensure legal sign-off on studio notice wording before production deployment.
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone or member ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF5A1F]"
            />
          </div>

          {/* Quick Filter: Expiring in 7 Days */}
          <button
            type="button"
            onClick={() => {
              setExpiringFilter(!expiringFilter);
              setPage(1);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
              expiringFilter
                ? 'bg-amber-500 text-black font-bold'
                : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expiring in 7 Days</span>
          </button>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#FF5A1F] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="frozen">Frozen</option>
            <option value="blocked">Blocked</option>
            <option value="pending">Pending</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white/80 focus:outline-none focus:border-[#FF5A1F] cursor-pointer"
          >
            <option value="">All Payments</option>
            <option value="paid">Fully Paid</option>
            <option value="pending">Pending Balance</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="text-xs font-mono text-white/50">
          Total Members: <span className="text-white font-bold">{totalMembers}</span>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-white/50 uppercase font-mono text-[10px] tracking-wider">
                <th className="px-5 py-3.5">Member</th>
                <th className="px-5 py-3.5">Plan & Dates</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Biometrics</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-white/40 font-mono">
                    <div className="w-6 h-6 border-2 border-[#FF5A1F] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading members database...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-white/40 font-mono">
                    No members match the current search filters.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member._id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Member Column */}
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white text-sm">{member.name}</div>
                      <div className="text-[11px] font-mono text-[#FF5A1F]">{member.memberId}</div>
                      <div className="text-[11px] text-white/60 font-mono">{member.phone}</div>
                    </td>

                    {/* Plan & Dates */}
                    <td className="px-5 py-3.5 space-y-0.5">
                      <div className="font-medium text-white/90">{member.planId?.name || 'Standard Pass'}</div>
                      <div className="text-[10px] font-mono text-white/50">
                        {new Date(member.membershipStartDate).toLocaleDateString('en-IN')} ➔{' '}
                        {new Date(member.membershipEndDate).toLocaleDateString('en-IN')}
                      </div>
                    </td>

                    {/* Payment Column */}
                    <td className="px-5 py-3.5 space-y-0.5">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                          member.paymentStatus === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {member.paymentStatus}
                      </span>
                      {member.amountDue > 0 && (
                        <div className="text-[10px] text-rose-400 font-mono">
                          Due: ₹{member.amountDue.toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>

                    {/* Biometrics Column */}
                    <td className="px-5 py-3.5">
                      {member.faceEnrolled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          <ShieldCheck className="w-3 h-3" />
                          Enrolled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded">
                          <ShieldAlert className="w-3 h-3" />
                          Unenrolled
                        </span>
                      )}
                    </td>

                    {/* Status Column */}
                    <td className="px-5 py-3.5">
                      {getStatusBadge(member.status, member.isBlocked, member.isFrozen)}
                    </td>

                    {/* Actions Column */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Details / History Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(member)}
                          title="View Attendance & Payment History"
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Enrol Face Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEnrolMember(member);
                            setEnrolStep('consent');
                            setCapturedDescriptors([]);
                          }}
                          title="Enrol Face Biometrics"
                          className="p-1.5 rounded-lg bg-[#FF5A1F]/15 hover:bg-[#FF5A1F] text-[#FF5A1F] hover:text-black transition-colors cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>

                        {/* Renew Membership Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setRenewMember(member);
                            setRenewForm({
                              planId: plans[0]?._id || '',
                              amountPaid: plans[0]?.price || 0,
                              paymentMethod: 'cash',
                              notes: '',
                            });
                          }}
                          title="Renew Membership"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Record Payment Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMember(member);
                            setPaymentForm({
                              amount: member.amountDue || 0,
                              method: 'cash',
                              notes: '',
                            });
                          }}
                          title="Record Payment"
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>

                        {/* Owner-Only Controls: Freeze, Block, Erase Biometrics */}
                        {isOwner && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleToggleFreeze(member)}
                              title={member.isFrozen ? 'Unfreeze Membership' : 'Freeze Membership'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                member.isFrozen
                                  ? 'bg-cyan-500 text-black'
                                  : 'bg-white/5 hover:bg-cyan-500/20 text-white/50 hover:text-cyan-400'
                              }`}
                            >
                              {member.isFrozen ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleBlock(member)}
                              title={member.isBlocked ? 'Unblock Member' : 'Block Member'}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                member.isBlocked
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-white/5 hover:bg-rose-500/20 text-white/50 hover:text-rose-400'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>

                            {member.faceEnrolled && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBiometrics(member)}
                                title="DPDP Erasure: Delete Biometrics"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/30 text-rose-400 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- ADD NEW MEMBER MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Enroll New Studio Member
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-white/60 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Vikram Malhotra"
                  className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">10-Digit Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    pattern="^[6-9]\d{9}$"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="9876543210"
                    className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="name@example.com"
                    className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Membership Plan</label>
                  <select
                    value={addForm.planId}
                    onChange={(e) => {
                      const selected = plans.find((p) => p._id === e.target.value);
                      setAddForm({
                        ...addForm,
                        planId: e.target.value,
                        amountPaid: selected ? selected.price : 0,
                      });
                    }}
                    className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                  >
                    {plans.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} (₹{p.price.toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={addForm.startDate}
                    onChange={(e) => setAddForm({ ...addForm, startDate: e.target.value })}
                    className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Initial Amount Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={addForm.amountPaid}
                    onChange={(e) => setAddForm({ ...addForm, amountPaid: Number(e.target.value) })}
                    className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Payment Method</label>
                  <select
                    value={addForm.paymentMethod}
                    onChange={(e) => setAddForm({ ...addForm, paymentMethod: e.target.value })}
                    className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF5A1F]"
                  >
                    <option value="cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="card">Debit/Credit Card</option>
                    <option value="other">Bank Transfer / Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs uppercase tracking-wider font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF5A1F] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#FF5A1F]/90"
                >
                  Create Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MULTI-STEP FACE ENROLMENT WIZARD (DPDP ACT) --- */}
      {enrolMember && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fade-in text-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Biometric Face Enrolment
                </h3>
                <p className="text-[11px] text-[#FF5A1F] font-mono">
                  {enrolMember.name} • {enrolMember.memberId}
                </p>
              </div>
              <button onClick={closeEnrolWizard} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step 1: Consent */}
            {enrolStep === 'consent' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-white/80 space-y-2 leading-relaxed max-h-48 overflow-y-auto font-mono">
                  <p className="font-bold text-white uppercase text-[10px]">
                    Statutory Biometric Consent Notice (DPDP Act, 2023)
                  </p>
                  <p>
                    1. <strong>Purpose:</strong> ROAR EXTREME uses facial geometry descriptors solely for turnstile security and member attendance verification.
                  </p>
                  <p>
                    2. <strong>Encryption & Storage:</strong> Video streams and raw photos are never stored. Only mathematical 128-d floating vectors encrypted with AES-256-GCM are persisted.
                  </p>
                  <p>
                    3. <strong>Right to Erasure:</strong> You may revoke consent and request complete deletion of biometric vectors at any time via gym administration.
                  </p>
                  <p>
                    4. <strong>Third Parties:</strong> Biometric vectors are never transmitted to external AI APIs or commercial partners.
                  </p>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 accent-[#FF5A1F] w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-xs text-white/90">
                    I confirm that explicit consent has been granted by the member under notice version{' '}
                    <code className="text-[#FF5A1F]">1.0-DPDP-2023</code>.
                  </span>
                </label>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeEnrolWizard}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!consentChecked}
                    onClick={() => {
                      setEnrolStep('capture');
                      startEnrolCamera();
                    }}
                    className="px-5 py-2 rounded-xl bg-[#FF5A1F] text-black text-xs font-bold uppercase tracking-wider disabled:opacity-40 cursor-pointer"
                  >
                    Proceed to Camera
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Camera Capture */}
            {enrolStep === 'capture' && (
              <div className="space-y-4 text-center">
                <div className="relative w-full aspect-4/3 bg-black rounded-2xl overflow-hidden border border-white/20 flex items-center justify-center">
                  <video
                    ref={enrolVideoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-full object-cover -scale-x-100"
                  />
                  {/* Face Guide Oval */}
                  <div className="absolute inset-4 rounded-[48%] border-2 border-dashed border-[#FF5A1F]/70 pointer-events-none" />
                </div>

                {enrolError && (
                  <p className="text-xs text-rose-400 font-mono bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                    {enrolError}
                  </p>
                )}

                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        capturedDescriptors.length >= step
                          ? 'w-10 bg-emerald-500'
                          : 'w-6 bg-white/20'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs font-mono text-white/70">
                  Captured <span className="text-[#FF5A1F] font-bold">{capturedDescriptors.length}</span> of 3 required sample frames
                </p>

                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={closeEnrolWizard}
                    className="px-4 py-2 rounded-xl bg-white/5 text-white/70 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={captureEnrolFrame}
                    className="px-6 py-2 rounded-xl bg-[#FF5A1F] text-black text-xs font-bold uppercase tracking-wider cursor-pointer shadow-lg shadow-[#FF5A1F]/30"
                  >
                    Capture Frame ({capturedDescriptors.length + 1}/3)
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Saving */}
            {enrolStep === 'saving' && (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-3 border-[#FF5A1F] border-t-transparent rounded-full animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-white">Encrypting Biometric Descriptors</h4>
                <p className="text-xs text-white/50 font-mono">
                  Computing 128-d vectors with AES-256-GCM cipher...
                </p>
              </div>
            )}

            {/* Step 4: Done */}
            {enrolStep === 'done' && (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-bold text-white">Enrolment Complete!</h4>
                <p className="text-xs text-white/70 max-w-xs mx-auto">
                  {enrolMember.name} can now scan at the /kiosk turnstile for automatic entry and attendance logging.
                </p>
                <button
                  type="button"
                  onClick={closeEnrolWizard}
                  className="px-6 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- RENEW MEMBERSHIP MODAL --- */}
      {renewMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Renew Membership Pass
            </h3>
            <p className="text-xs text-white/50 font-mono mb-4">
              Member: <span className="text-[#FF5A1F] font-bold">{renewMember.name}</span> ({renewMember.memberId})
            </p>

            <form onSubmit={handleRenewMember} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono text-white/60 mb-1">Select Package</label>
                <select
                  value={renewForm.planId}
                  onChange={(e) => {
                    const plan = plans.find((p) => p._id === e.target.value);
                    setRenewForm({
                      ...renewForm,
                      planId: e.target.value,
                      amountPaid: plan ? plan.price : 0,
                    });
                  }}
                  className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                >
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.durationDays} days) - ₹{p.price.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={renewForm.amountPaid}
                    onChange={(e) => setRenewForm({ ...renewForm, amountPaid: Number(e.target.value) })}
                    className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Payment Method</label>
                  <select
                    value={renewForm.paymentMethod}
                    onChange={(e) => setRenewForm({ ...renewForm, paymentMethod: e.target.value })}
                    className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenewMember(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/70 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider"
                >
                  Confirm Renewal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RECORD AD-HOC PAYMENT MODAL --- */}
      {paymentMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
              Record Due Payment
            </h3>
            <p className="text-xs text-white/50 font-mono mb-4">
              Member: <span className="text-[#FF5A1F] font-bold">{paymentMember.name}</span> | Outstanding: ₹
              {paymentMember.amountDue}
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                    className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-white/60 mb-1">Payment Method</label>
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                    className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-white/60 mb-1">Notes / Receipt Remark</label>
                <input
                  type="text"
                  placeholder="e.g. Cleared remaining balance via GPay"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMember(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/70 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MEMBER DETAILS & AUDIT HISTORY MODAL --- */}
      {detailsMember && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/15 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">{detailsMember.name}</h3>
                <p className="text-xs text-[#FF5A1F] font-mono">
                  {detailsMember.memberId} • {detailsMember.phone}
                </p>
              </div>
              <button onClick={() => setDetailsMember(null)} className="text-white/50 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Payment History */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2 font-mono">
                  Payment History & Receipts
                </h4>
                <div className="bg-black/40 rounded-xl border border-white/5 divide-y divide-white/5 text-xs">
                  {!memberDetailsData?.payments?.length ? (
                    <div className="p-3 text-white/40">No payment receipts on record.</div>
                  ) : (
                    memberDetailsData.payments.map((p) => (
                      <div key={p._id} className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-white">₹{p.amount.toLocaleString('en-IN')}</span>
                          <span className="text-[11px] text-white/50 ml-2">via {p.method}</span>
                          <div className="text-[10px] font-mono text-white/40">{p.receiptNo}</div>
                        </div>
                        <div className="text-[11px] font-mono text-white/60">
                          {new Date(p.paidAt).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Attendance */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2 font-mono">
                  Recent Attendance Check-Ins
                </h4>
                <div className="bg-black/40 rounded-xl border border-white/5 divide-y divide-white/5 text-xs">
                  {!memberDetailsData?.recentAttendance?.length ? (
                    <div className="p-3 text-white/40">No check-in entries logged yet.</div>
                  ) : (
                    memberDetailsData.recentAttendance.map((a) => (
                      <div key={a._id} className="p-3 flex items-center justify-between">
                        <span className="font-mono text-white/90">
                          {new Date(a.checkInTime).toLocaleString('en-IN')}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#FF5A1F]/15 text-[#FF5A1F]">
                          {a.method}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Access Attempt Logs */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-2 font-mono">
                  Turnstile Access Attempt Logs
                </h4>
                <div className="bg-black/40 rounded-xl border border-white/5 divide-y divide-white/5 text-xs">
                  {!memberDetailsData?.recentAccessLogs?.length ? (
                    <div className="p-3 text-white/40">No turnstile access logs recorded.</div>
                  ) : (
                    memberDetailsData.recentAccessLogs.map((log) => (
                      <div key={log._id} className="p-3 flex items-center justify-between">
                        <div>
                          <span
                            className={`font-semibold uppercase text-[10px] font-mono ${
                              log.decision === 'granted' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {log.decision}
                          </span>
                          <span className="text-white/50 text-[11px] ml-2">({log.reason})</span>
                        </div>
                        <span className="text-[10px] font-mono text-white/40">
                          {new Date(log.timestamp).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembers;
