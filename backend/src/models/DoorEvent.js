import mongoose from 'mongoose';

const doorEventSchema = new mongoose.Schema(
  {
    doorId: {
      type: String,
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      default: '',
      index: true,
    },
    eventType: {
      type: String,
      enum: [
        'unlock_command',
        'unlock_ack',
        'relock',
        'manual_unlock',
        'lockdown_enabled',
        'lockdown_disabled',
        'lockdown_blocked',
        'heartbeat',
        'door_opened',
        'door_closed',
        'door_held_open',
        'tamper_alert',
        'kiosk_lockout',
      ],
      required: true,
      index: true,
    },
    accessLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccessLog',
      default: null,
      index: true,
    },
    commandId: {
      type: String,
      default: null,
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

doorEventSchema.index({ doorId: 1, timestamp: -1 });
doorEventSchema.index({ eventType: 1, timestamp: -1 });

export const DoorEvent = mongoose.model('DoorEvent', doorEventSchema);
