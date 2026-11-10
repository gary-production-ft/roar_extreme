import mongoose from 'mongoose';
import { env } from '../config/environment.js';
import { Admin } from '../models/Admin.js';
import { logger } from '../utils/logger.js';

async function createAdmin() {
  await mongoose.connect(env.mongoUri);
  logger.info('Connected to MongoDB for admin provisioning...');

  const email = process.argv[2] || 'admin@roarextreme.com';
  const password = process.argv[3] || 'RoarAdmin#2026';
  const name = process.argv[4] || 'Roar Head Administrator';

  const existing = await Admin.findOne({ email: email.toLowerCase() });
  if (existing) {
    logger.info(`Admin with email ${email} already exists. Updating password...`);
    existing.passwordHash = await Admin.hashPassword(password);
    existing.isActive = true;
    await existing.save();
    logger.info(`Admin ${email} updated successfully!`);
  } else {
    const passwordHash = await Admin.hashPassword(password);
    const newAdmin = new Admin({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'superadmin',
      isActive: true,
    });
    await newAdmin.save();
    logger.info(`Admin created successfully:`);
    logger.info(`Email: ${email}`);
    logger.info(`Role: superadmin`);
    logger.info(`Status: active [Password set and hashed with bcrypt]`);
  }

  await mongoose.disconnect();
}

createAdmin().catch((err) => {
  logger.error('Failed to create admin:', err);
  process.exit(1);
});

