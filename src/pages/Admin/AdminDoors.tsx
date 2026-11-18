import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Activity,
  Cpu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../config/api';

interface DeviceItem {
  _id: string;
  deviceId: string;
  type: string;
  name: string;
  status: 'online' | 'offline' | 'error' | 'locked_out';
  firmwareVersion: string;
  lastSeen: string;
  consecutiveDenials?: number;
  lockedOutUntil?: string;
}

interface DoorItem {
  _id: string;
  doorId: string;
  name: string;
  description: string;
  status: 'locked' | 'unlocked' | 'locked_down' | 'offline' | 'error';
  isLockedDown: boolean;
  lockType: string;
  failMode: string;
  unlockDurationSeconds: number;
  lastCommandAt?: string;
  lastEventAt?: string;
  lockDeviceId?: string;
  kioskDeviceId?: string;
  lockDevice?: { status: string; lastSeen: string; firmwareVersion: string };
  kioskDevice?: { status: string; lastSeen: string };
}

interface DoorEventItem {
  _id: string;
  doorId: string;
  deviceId: string;
  eventType: string;
  commandId?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

export const AdminDoors: React.FC = () => {
  const { token, admin } = useAuth();
  const [doors, setDoors] = useState<DoorItem[]>([]);
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [events, setEvents] = useState<DoorEventItem[]>([]);
  const [eventsTotal, setEventsTotal] = useState(0);
  const [eventsPage, setEventsPage] = useState(1);
  const [eventsPages, setEventsPages] = useState(1);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Manual Unlock Modal
  const [unlockModalDoor, setUnlockModalDoor] = useState<DoorItem | null>(null);
  const [manualReason, setManualReason] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Emergency Lockdown Modal
  const [lockdownModalDoor, setLockdownModalDoor] = useState<DoorItem | null>(null);
  const [lockdownReason, setLockdownReason] = useState('');
  const [isTogglingLockdown, setIsTogglingLockdown] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const isOwner = admin?.role === 'owner' || admin?.role === 'superadmin';

  const handleSeedDemo = async () => {
    if (!window.confirm('Seed simulated attendance, doors, and hardware events for testing?')) return;
    setIsSeeding(true);
    try {
      const res = await fetch(apiUrl('/api/admin/doors/seed-demo'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-seed-key': 'roar-demo-seed-2026',
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || 'Demo data seeded successfully!');
        fetchData();
        fetchEvents();
      } else {
        alert(data.message || 'Failed to seed demo data.');
      }
    } catch (err: any) {
      alert('Error seeding demo data: ' + (err.message || 'Network error'));
    } finally {
      setIsSeeding(false);
    }
  };

  const fetchData = async () => {
    try {
      const [doorsRes, devicesRes] = await Promise.all([
        fetch(apiUrl('/api/admin/doors'), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(apiUrl('/api/admin/devices'), { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (doorsRes.ok) {
        const d = await doorsRes.json();
        setDoors(d.doors || []);
      }
      if (devicesRes.ok) {
        const dev = await devicesRes.json();
        setDevices(dev.devices || []);
      }
    } catch (err) {
      console.error('Error fetching door/device data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const query = new URLSearchParams({
        page: eventsPage.toString(),
        limit: '15',
        ...(eventTypeFilter ? { eventType: eventTypeFilter } : {}),
      });

      const res = await fetch(apiUrl(`/api/admin/doors/events?${query.toString()}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        setEventsTotal(data.pagination?.total || 0);
        setEventsPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching door events:', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    fetchEvents();
  }, [token, eventsPage, eventTypeFilter]);

  const handleManualUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockModalDoor || !manualReason.trim()) return;

    setIsUnlocking(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/doors/${unlockModalDoor.doorId}/unlock`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: manualReason,
          durationSeconds: unlockModalDoor.unlockDurationSeconds || 5,
        }),
      });

      if (res.ok) {
        setUnlockModalDoor(null);
        setManualReason('');
        fetchData();
        fetchEvents();
      } else {
        const err = await res.json();
        alert(err.message || 'Manual unlock failed.');
      }
    } catch (err) {
      console.error('Manual unlock error:', err);
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleToggleLockdownSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockdownModalDoor) return;

    const targetState = !lockdownModalDoor.isLockedDown;
    setIsTogglingLockdown(true);
    try {
      const res = await fetch(apiUrl(`/api/admin/doors/${lockdownModalDoor.doorId}/lockdown`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lockdown: targetState,
          reason: lockdownReason || (targetState ? 'Emergency lockdown engaged' : 'Lockdown released'),
        }),
      });

      if (res.ok) {
        setLockdownModalDoor(null);
        setLockdownReason('');
        fetchData();
        fetchEvents();
      } else {
        const err = await res.json();
        alert(err.message || 'Lockdown state toggle failed.');
      }
    } catch (err) {
      console.error('Lockdown toggle error:', err);
    } finally {
      setIsTogglingLockdown(false);
    }
  };

  const handleResetLockout = async (deviceId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/devices/${deviceId}/reset-lockout`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error resetting lockout:', err);
    }
  };

  const formatEventBadge = (type: string) => {
    switch (type) {
      case 'unlock_command':
      case 'manual_unlock':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {type.replace('_', ' ')}
          </span>
        );
      case 'unlock_ack':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Hardware Ack
          </span>
        );
      case 'relock':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/10 text-white/70 border border-white/20">
            Relocked
          </span>
        );
      case 'lockdown_enabled':
      case 'lockdown_blocked':
      case 'tamper_alert':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
            {type.replace('_', ' ')}
          </span>
        );
      case 'door_held_open':
      case 'kiosk_lockout':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
            {type.replace('_', ' ')}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-white/5 text-white/50">
            {type.replace('_', ' ')}
          </span>
        );
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-black tracking-wider text-white">
            DOOR & <span className="text-[#FF5A1F]">HARDWARE CONTROL</span>
          </h1>
          <p className="text-xs text-white/50 font-mono mt-0.5">
            Phase 2 ESP32 Relay Actuation, Fail-Safe Maglocks & Telemetry
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedDemo}
            disabled={isSeeding}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FF5A1F]/20 hover:bg-[#FF5A1F]/30 text-[#FF5A1F] border border-[#FF5A1F]/40 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
            title="Populates realistic test members, check-ins, and hardware events"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSeeding ? 'Seeding...' : 'Seed Demo Data'}</span>
          </button>

          <button
            onClick={() => {
              fetchData();
              fetchEvents();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && doors.length === 0 && (
        <div className="p-8 text-center text-white/40 font-mono text-xs animate-pulse">
          Connecting to telemetry & devices...
        </div>
      )}

      {/* Door Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {doors.map((door) => (
          <div
            key={door._id}
            className={`p-6 rounded-3xl border transition-all ${
              door.isLockedDown
                ? 'bg-rose-950/20 border-rose-500/40 shadow-2xl shadow-rose-950/50'
                : door.status === 'unlocked'
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-[#121212] border-white/10'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#FF5A1F] tracking-widest font-bold">
                  {door.doorId}
                </span>
                <h2 className="text-xl font-heading font-black text-white tracking-wide mt-0.5">
                  {door.name}
                </h2>
                <p className="text-xs text-white/50 mt-1">{door.description}</p>
              </div>

              {/* Status Pill */}
              <div className="text-right">
                {door.isLockedDown ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                    <ShieldAlert className="w-4 h-4" />
                    Lockdown Active
                  </span>
                ) : door.status === 'unlocked' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <Unlock className="w-4 h-4" />
                    Unlocked ({door.unlockDurationSeconds}s)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase font-mono bg-white/10 text-white/80 border border-white/20">
                    <Lock className="w-4 h-4" />
                    Locked
                  </span>
                )}
              </div>
            </div>

            {/* Hardware Specification Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 pt-4 border-t border-white/5">
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[9px] font-mono uppercase text-white/40 block">Lock Mechanism</span>
                <span className="text-xs font-bold text-white uppercase">{door.lockType}</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[9px] font-mono uppercase text-white/40 block">Fail Mode</span>
                <span className="text-xs font-bold text-emerald-400 uppercase">{door.failMode.replace('_', ' ')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[9px] font-mono uppercase text-white/40 block">ESP32 Lock</span>
                <span className="text-xs font-mono text-white/80">{door.lockDeviceId}</span>
              </div>
              <div className="p-3 rounded-2xl bg-black/40 border border-white/5">
                <span className="text-[9px] font-mono uppercase text-white/40 block">Kiosk Terminal</span>
                <span className="text-xs font-mono text-white/80">{door.kioskDeviceId}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                disabled={door.isLockedDown}
                onClick={() => setUnlockModalDoor(door)}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-bold uppercase text-xs tracking-wider transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Unlock className="w-4 h-4" />
                <span>Manual Unlock</span>
              </button>

              {isOwner && (
                <button
                  type="button"
                  onClick={() => setLockdownModalDoor(door)}
                  className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    door.isLockedDown
                      ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{door.isLockedDown ? 'Release Lockdown' : 'Emergency Lockdown'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hardware Devices List */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#FF5A1F]" />
            <span>Connected Access Devices & Controllers</span>
          </h3>
          <span className="text-xs font-mono text-white/40">Heartbeat timeout: 45s</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((dev) => (
            <div
              key={dev._id}
              className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-white">{dev.deviceId}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase ${
                    dev.status === 'online'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : dev.status === 'locked_out'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                      : 'bg-white/10 text-white/40'
                  }`}
                >
                  {dev.status}
                </span>
              </div>
              <p className="text-xs text-white/70">{dev.name}</p>
              <div className="text-[10px] font-mono text-white/40 flex items-center justify-between pt-1">
                <span>Firmware: {dev.firmwareVersion}</span>
                <span>Last seen: {new Date(dev.lastSeen).toLocaleTimeString('en-IN')}</span>
              </div>

              {dev.status === 'locked_out' && (
                <button
                  type="button"
                  onClick={() => handleResetLockout(dev.deviceId)}
                  className="mt-2 w-full py-1.5 rounded-lg bg-amber-500 text-black text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  Clear Kiosk Lockout
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Live Door Events Feed */}
      <div className="bg-[#121212] border border-white/10 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF5A1F]" />
              <span>Hardware & Turnstile Events Feed ({eventsTotal})</span>
            </h3>

            <select
              value={eventTypeFilter}
              onChange={(e) => {
                setEventTypeFilter(e.target.value);
                setEventsPage(1);
              }}
              className="bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/80 focus:outline-none focus:border-[#FF5A1F]"
            >
              <option value="">All Event Types</option>
              <option value="unlock_command">Unlock Command</option>
              <option value="unlock_ack">Unlock Ack</option>
              <option value="relock">Relock</option>
              <option value="manual_unlock">Manual Override</option>
              <option value="lockdown_enabled">Lockdown Enabled</option>
              <option value="door_opened">Door Opened</option>
              <option value="door_held_open">Door Held Open (&gt;30s)</option>
              <option value="kiosk_lockout">Kiosk Lockout</option>
            </select>
          </div>

          <a
            href={apiUrl('/api/admin/doors/events/export/csv')}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 text-xs font-semibold uppercase tracking-wider"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-black/40 text-white/50 uppercase font-mono text-[10px] tracking-wider">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Door ID</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {events.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/40 font-mono">
                    No hardware events recorded yet.
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e._id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-mono text-white/70">
                      {new Date(e.timestamp).toLocaleTimeString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-white/90">{e.doorId}</td>
                    <td className="px-4 py-3">{formatEventBadge(e.eventType)}</td>
                    <td className="px-4 py-3 font-mono text-white/60 text-[11px]">{e.deviceId || '—'}</td>
                    <td className="px-4 py-3 text-white/70 text-[11px]">
                      {String(e.details?.reason || e.details?.memberName || (e.details && Object.keys(e.details).length > 0 ? JSON.stringify(e.details) : '—'))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-2 border-t border-white/10 flex items-center justify-between text-xs text-white/50 font-mono">
          <span>Page {eventsPage} of {eventsPages}</span>
          <div className="flex items-center gap-2">
            <button
              disabled={eventsPage <= 1}
              onClick={() => setEventsPage(eventsPage - 1)}
              className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={eventsPage >= eventsPages}
              onClick={() => setEventsPage(eventsPage + 1)}
              className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- MANUAL UNLOCK MODAL --- */}
      {unlockModalDoor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fade-in text-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Unlock className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Manual Turnstile Unlock
                </h3>
              </div>
              <button onClick={() => setUnlockModalDoor(null)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualUnlockSubmit} className="space-y-4">
              <p className="text-xs text-white/70">
                You are executing an authorized manual pulse on <strong className="text-white">{unlockModalDoor.name}</strong>. The 12V relay will de-energize for {unlockModalDoor.unlockDurationSeconds} seconds.
              </p>

              <div>
                <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">
                  Mandatory Operational Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Equipment delivery, coach guest entry, manual front-desk pass"
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUnlockModalDoor(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/70 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUnlocking}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-black text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isUnlocking ? 'Unlocking...' : 'Dispatch Unlock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EMERGENCY LOCKDOWN MODAL --- */}
      {lockdownModalDoor && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#160c0c] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-fade-in text-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-rose-500/20">
              <div className="flex items-center gap-2 text-rose-500">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
                <h3 className="text-base font-bold uppercase tracking-wider text-rose-400">
                  {lockdownModalDoor.isLockedDown ? 'Release Lockdown' : 'CONFIRM EMERGENCY LOCKDOWN'}
                </h3>
              </div>
              <button onClick={() => setLockdownModalDoor(null)} className="text-white/50 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleToggleLockdownSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-200 leading-relaxed">
                {lockdownModalDoor.isLockedDown
                  ? 'Releasing lockdown will restore normal automated facial scanning and valid member entry.'
                  : 'CRITICAL SECURITY ACTION: Engaging emergency lockdown will immediately keep the door locked and DENY ALL ACCESS attempts (even for paid, active members) until manually released.'}
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-white/60 mb-1">
                  Reason for Log / Incident Record
                </label>
                <input
                  type="text"
                  placeholder="e.g. Safety perimeter inspection, facility closure"
                  value={lockdownReason}
                  onChange={(e) => setLockdownReason(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setLockdownModalDoor(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/70 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isTogglingLockdown}
                  className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${
                    lockdownModalDoor.isLockedDown
                      ? 'bg-white text-black hover:bg-white/90'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/40'
                  }`}
                >
                  {isTogglingLockdown
                    ? 'Processing...'
                    : lockdownModalDoor.isLockedDown
                    ? 'Confirm Release'
                    : 'ACTIVATE LOCKDOWN NOW'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDoors;
