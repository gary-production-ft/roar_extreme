import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'receptionist', 'trainer', 'superadmin', 'coach', 'staff'],
      default: 'receptionist',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

adminSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

adminSchema.methods.isLocked = function () {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

adminSchema.methods.recordFailedLogin = async function () {
  const attempts = (this.failedLoginAttempts || 0) + 1;
  const updates = { failedLoginAttempts: attempts };
  if (attempts >= 5) {
    // Lock out for 15 minutes after 5 consecutive failures
    updates.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  return this.updateOne(updates);
};

adminSchema.methods.resetFailedLogins = async function () {
  return this.updateOne({
    $set: { failedLoginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

adminSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

export const Admin = mongoose.model('Admin', adminSchema);
