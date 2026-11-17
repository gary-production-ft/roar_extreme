import mongoose from 'mongoose';
import crypto from 'crypto';

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['kiosk', 'lock', 'sensor'],
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    secretHash: {
      type: String,
      required: true,
    },
    secretSalt: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'error', 'locked_out'],
      default: 'offline',
      index: true,
    },
    doorId: {
      type: String,
      default: null,
      index: true,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    firmwareVersion: {
      type: String,
      default: '1.0.0-esp32',
    },
    lastSeen: {
      type: Date,
      default: Date.now,
      index: true,
    },
    consecutiveDenials: {
      type: Number,
      default: 0,
    },
    lockedOutUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.methods.isLockedOut = function () {
  return Boolean(this.lockedOutUntil && this.lockedOutUntil.getTime() > Date.now());
};

deviceSchema.methods.recordDenial = async function (threshold = 5, durationMs = 180000) {
  this.consecutiveDenials = (this.consecutiveDenials || 0) + 1;
  const updates = { consecutiveDenials: this.consecutiveDenials };
  if (this.consecutiveDenials >= threshold) {
    this.lockedOutUntil = new Date(Date.now() + durationMs);
    this.status = 'locked_out';
    updates.lockedOutUntil = this.lockedOutUntil;
    updates.status = 'locked_out';
  }
  return this.updateOne({ $set: updates });
};

deviceSchema.methods.resetDenials = async function () {
  this.consecutiveDenials = 0;
  this.lockedOutUntil = null;
  this.status = 'online';
  return this.updateOne({
    $set: { consecutiveDenials: 0, status: 'online' },
    $unset: { lockedOutUntil: 1 },
  });
};

deviceSchema.statics.hashSecret = function (plainSecret, salt = '') {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', actualSalt).update(plainSecret).digest('hex');
  return { hash, salt: actualSalt };
};

deviceSchema.methods.verifySecret = function (candidateSecret) {
  const candidateHash = crypto.createHmac('sha256', this.secretSalt).update(candidateSecret).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(this.secretHash, 'hex'));
};

export const Device = mongoose.model('Device', deviceSchema);
