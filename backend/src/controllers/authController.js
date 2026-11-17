import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { Admin } from '../models/Admin.js';
import { env } from '../config/environment.js';
import { AuditLog } from '../models/AuditLog.js';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

export async function login(req, res, next) {
  try {
    const { email, password } = req.validatedData.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || '';

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin || !admin.isActive) {
      await AuditLog.create({
        action: 'ADMIN_LOGIN_FAILED',
        actorType: 'visitor',
        actorId: email.toLowerCase(),
        targetResource: 'AdminAuth',
        details: { reason: 'User not found or inactive' },
        ipAddress: clientIp,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Check if account is currently locked out
    if (admin.isLocked()) {
      const minutesRemaining = Math.ceil((admin.lockUntil.getTime() - Date.now()) / 60000);
      await AuditLog.create({
        action: 'ADMIN_LOGIN_LOCKED',
        actorType: 'admin',
        actorId: admin.email,
        targetResource: `Admin:${admin._id}`,
        details: { minutesRemaining },
        ipAddress: clientIp,
      });

      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesRemaining} minute(s).`,
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      await admin.recordFailedLogin();
      await AuditLog.create({
        action: 'ADMIN_LOGIN_FAILED',
        actorType: 'admin',
        actorId: admin.email,
        targetResource: `Admin:${admin._id}`,
        details: { attempts: (admin.failedLoginAttempts || 0) + 1 },
        ipAddress: clientIp,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Successful login: reset failed attempts
    await admin.resetFailedLogins();

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    // Set secure HTTP-only cookie (8-hour maximum lifetime)
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    await AuditLog.create({
      action: 'ADMIN_LOGIN_SUCCESS',
      actorType: 'admin',
      actorId: admin.email,
      targetResource: `Admin:${admin._id}`,
      ipAddress: clientIp,
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        mustChangePassword: admin.mustChangePassword,
      },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.validatedData.body;
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found.' });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    admin.passwordHash = await Admin.hashPassword(newPassword);
    admin.mustChangePassword = false;
    await admin.save();

    await AuditLog.create({
      action: 'ADMIN_PASSWORD_CHANGED',
      actorType: 'admin',
      actorId: admin.email,
      targetResource: `Admin:${admin._id}`,
      ipAddress: req.ip || '',
    });

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie('admin_token');
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function getMe(req, res) {
  res.json({
    success: true,
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: req.admin.role,
      mustChangePassword: req.admin.mustChangePassword,
    },
  });
}
