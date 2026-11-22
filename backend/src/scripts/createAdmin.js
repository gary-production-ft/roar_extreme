import mongoose from 'mongoose';
import crypto from 'crypto';
import { env } from '../config/environment.js';
import { Admin } from '../models/Admin.js';
import { logger } from '../utils/logger.js';

async function createAdmin() {
  await mongoose.connect(env.mongoUri);
  logger.info('Connected to MongoDB for admin provisioning...');

  const email = (process.argv[2] || process.env.ADMIN_EMAIL || 'admin@roarextreme.com').toLowerCase();
  let password = process.env.ADMIN_PASSWORD || process.argv[3];
  let forcePasswordChange = false;

  if (password && ['RoarAdmin#2026', 'admin123', 'password'].includes(password)) {
    logger.error('CRITICAL SECURITY: Cannot provision admin with known compromised password. Aborting.');
    process.exit(1);
  }

  if (!password) {
    // Generate secure 12-char random temp password and enforce password change on first login
    password = `Roar#${crypto.randomBytes(6).toString('hex')}`;
    forcePasswordChange = true;
    logger.warn('No ADMIN_PASSWORD supplied in environment or argument.');
    logger.warn(`Generated temporary password: ${password}`);
    logger.warn('Administrator will be required to change this password on first login.');
  }

  const role = process.argv[4] || process.env.ADMIN_ROLE || 'owner';
  const name = process.argv[5] || process.env.ADMIN_NAME || 'Roar Gym Owner';

  const existing = await Admin.findOne({ email });
  if (existing) {
    logger.info(`Admin with email ${email} already exists. Updating credentials...`);
    existing.passwordHash = await Admin.hashPassword(password);
    existing.role = role;
    existing.isActive = true;
    existing.mustChangePassword = forcePasswordChange;
    existing.failedLoginAttempts = 0;
    existing.lockUntil = null;
    await existing.save();
    logger.info(`Admin ${email} updated successfully with role: ${role}`);
  } else {
    const passwordHash = await Admin.hashPassword(password);
    const newAdmin = new Admin({
      name,
      email,
      passwordHash,
      role,
      isActive: true,
      mustChangePassword: forcePasswordChange,
    });
    await newAdmin.save();
    logger.info('Admin provisioned successfully:');
    logger.info(`Email: ${email}`);
    logger.info(`Role: ${role}`);
    logger.info(`Must change password on first login: ${forcePasswordChange}`);
  }

  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  logger.error('Failed to provision admin:', err);
  process.exit(1);
});
