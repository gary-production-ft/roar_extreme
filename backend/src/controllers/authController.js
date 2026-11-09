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

export async function login(req, res, next) {
  try {
    const { email, password } = req.validatedData.body;

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );

    // Set secure HTTP-only cookie
    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    await AuditLog.create({
      action: 'ADMIN_LOGIN',
      actorType: 'admin',
      actorId: admin.email,
      targetResource: `Admin:${admin._id}`,
      ipAddress: req.ip || '',
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      message: 'Login successful',
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
  });

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
}

export async function getMe(req, res) {
  res.json({
    success: true,
    admin: req.admin,
  });
}

