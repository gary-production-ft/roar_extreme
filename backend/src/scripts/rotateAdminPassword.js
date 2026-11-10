import mongoose from 'mongoose';
import { env } from '../config/environment.js';
import { Admin } from '../models/Admin.js';
import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

/**
 * SECURE ADMIN PASSWORD ROTATION
 *
 * Usage:
 *   NEW_ADMIN_PASSWORD="YourStrongNewPassword#123" node src/scripts/rotateAdminPassword.js admin@roarextreme.com
 *   OR:
 *   node src/scripts/rotateAdminPassword.js admin@roarextreme.com "YourStrongNewPassword#123"
 */
async function rotatePassword() {
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || 'admin@roarextreme.com').toLowerCase();
  const newPassword = process.env.NEW_ADMIN_PASSWORD || process.argv[3];

  if (!newPassword || newPassword.length < 8) {
    logger.error('Usage Error: Password must be at least 8 characters long.');
    logger.error('Provide via NEW_ADMIN_PASSWORD environment variable or command-line argument.');
    process.exit(1);
  }

  await mongoose.connect(env.mongoUri);
  logger.info(`Connected to database. Searching for admin account: ${email}...`);

  const admin = await Admin.findOne({ email });
  if (!admin) {
    logger.error(`Admin account ${email} not found.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  admin.passwordHash = await Admin.hashPassword(newPassword);
  admin.isActive = true;
  await admin.save();

  await AuditLog.create({
    action: 'ADMIN_PASSWORD_ROTATION',
    actorType: 'admin',
    actorId: admin.email,
    targetResource: `Admin:${admin._id}`,
    ipAddress: 'cli-admin-tool',
  });

  logger.info(`✅ Successfully rotated password for ${email}.`);
  logger.info('Audit log created. You can now log in with your updated credentials.');

  await mongoose.disconnect();
}

rotatePassword().catch((err) => {
  logger.error('Password rotation failed:', err.message);
  process.exit(1);
});

