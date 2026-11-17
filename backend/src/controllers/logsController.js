import { AccessLog } from '../models/AccessLog.js';
import { Attendance } from '../models/Attendance.js';
import { Member } from '../models/Member.js';
import { logAdminAudit } from '../utils/auditLogger.js';

export async function listAccessLogs(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '25', 10);
    const { decision, reason, deviceId, memberId } = req.query;

    const query = {};
    if (decision) query.decision = decision;
    if (reason) query.reason = reason;
    if (deviceId) query.deviceId = deviceId;
    if (memberId) query.memberId = memberId;

    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AccessLog.find(query)
        .populate('memberId', 'name phone memberId')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AccessLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function exportAccessLogsCsv(req, res, next) {
  try {
    const logs = await AccessLog.find().populate('memberId', 'name phone memberId').sort({ timestamp: -1 }).limit(1000).lean();

    const headers = ['Timestamp', 'Decision', 'Reason', 'Member Name', 'Member ID', 'Phone', 'Match Distance', 'Device ID', 'Method'];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toLocaleString('en-IN'),
      l.decision,
      l.reason,
      `"${(l.memberName || l.memberId?.name || '').replace(/"/g, '""')}"`,
      l.memberId?.memberId || '',
      l.memberId?.phone || '',
      l.matchDistance != null ? l.matchDistance : '',
      l.deviceId || '',
      l.method || '',
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="roar_access_logs_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function listAttendance(req, res, next) {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '25', 10);
    const { memberId, method } = req.query;

    const query = {};
    if (memberId) query.memberId = memberId;
    if (method) query.method = method;

    const skip = (page - 1) * limit;
    const [attendance, total] = await Promise.all([
      Attendance.find(query)
        .populate('memberId', 'name phone memberId status')
        .sort({ checkInTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Attendance.countDocuments(query),
    ]);

    res.json({
      success: true,
      attendance,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function exportAttendanceCsv(req, res, next) {
  try {
    const records = await Attendance.find().populate('memberId', 'name phone memberId').sort({ checkInTime: -1 }).limit(1000).lean();

    const headers = ['Check-In Timestamp', 'Member Name', 'Member ID', 'Phone', 'Method'];
    const rows = records.map((a) => [
      new Date(a.checkInTime).toLocaleString('en-IN'),
      `"${(a.memberId?.name || '').replace(/"/g, '""')}"`,
      a.memberId?.memberId || '',
      a.memberId?.phone || '',
      a.method,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="roar_attendance_${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function recordManualAttendance(req, res, next) {
  try {
    const { memberId, notes } = req.body;
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const attendance = await Attendance.create({
      memberId: member._id,
      checkInTime: new Date(),
      method: 'manual',
    });

    await logAdminAudit(req, 'MANUAL_ATTENDANCE_RECORDED', `Member:${member._id}`, {
      memberId: member.memberId,
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      attendance,
      message: `Manual check-in logged for ${member.name}`,
    });
  } catch (err) {
    next(err);
  }
}
