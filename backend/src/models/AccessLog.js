import mongoose from 'mongoose';

const accessLogSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
      index: true,
    },
    memberName: {
      type: String,
      default: null,
      trim: true,
    },
    decision: {
      type: String,
      enum: ['granted', 'denied'],
      required: true,
      index: true,
    },
    reason: {
      type: String,
      enum: [
        'granted',
        'no_face_match',
        'low_confidence',
        'ambiguous_match',
        'membership_expired',
        'payment_pending',
        'membership_frozen',
        'member_blocked',
        'liveness_failed',
        'outside_hours',
        'rate_limited',
        'invalid_payload',
        'kiosk_locked_out',
      ],
      required: true,
      index: true,
    },
    matchDistance: {
      type: Number,
      default: null,
    },
    livenessResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    deviceId: {
      type: String,
      default: 'kiosk-main',
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    method: {
      type: String,
      enum: ['face', 'manual'],
      default: 'face',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

accessLogSchema.index({ timestamp: -1, decision: 1 });
accessLogSchema.index({ memberId: 1, timestamp: -1 });

export const AccessLog = mongoose.model('AccessLog', accessLogSchema);
