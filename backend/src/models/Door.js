import mongoose from 'mongoose';

const doorSchema = new mongoose.Schema(
  {
    doorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['locked', 'unlocked', 'locked_down', 'offline', 'error'],
      default: 'locked',
      index: true,
    },
    isLockedDown: {
      type: Boolean,
      default: false,
      index: true,
    },
    lockType: {
      type: String,
      enum: ['maglock', 'strike', 'solenoid', 'other'],
      default: 'maglock',
    },
    failMode: {
      type: String,
      enum: ['fail_safe', 'fail_secure'],
      default: 'fail_safe',
    },
    unlockDurationSeconds: {
      type: Number,
      default: 5,
      min: 1,
      max: 30,
    },
    kioskDeviceId: {
      type: String,
      default: 'kiosk-main',
      index: true,
    },
    lockDeviceId: {
      type: String,
      default: 'lock-esp32-01',
      index: true,
    },
    lastCommandAt: {
      type: Date,
      default: null,
    },
    lastEventAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

doorSchema.index({ lockDeviceId: 1, status: 1 });

export const Door = mongoose.model('Door', doorSchema);
