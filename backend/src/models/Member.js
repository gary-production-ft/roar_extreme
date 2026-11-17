import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    memberId: {
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
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
      match: [/^[6-9]\d{9}$/, 'Must be a valid 10-digit Indian mobile number'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'frozen', 'blocked', 'pending'],
      default: 'active',
      index: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      required: true,
    },
    membershipStartDate: {
      type: Date,
      required: true,
      index: true,
    },
    membershipEndDate: {
      type: Date,
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'overdue'],
      default: 'paid',
      index: true,
    },
    amountDue: {
      type: Number,
      default: 0,
      min: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      index: true,
    },
    isFrozen: {
      type: Boolean,
      default: false,
      index: true,
    },
    faceConsent: {
      given: {
        type: Boolean,
        default: false,
      },
      timestamp: {
        type: Date,
        default: null,
      },
      noticeVersion: {
        type: String,
        default: '1.0-DPDP-2023',
      },
    },
    faceEnrolled: {
      type: Boolean,
      default: false,
      index: true,
    },
    sourceLeadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

memberSchema.index({ phone: 1, status: 1 });
memberSchema.index({ membershipEndDate: 1, paymentStatus: 1 });

export const Member = mongoose.model('Member', memberSchema);
