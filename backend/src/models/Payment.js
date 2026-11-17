import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    method: {
      type: String,
      enum: ['cash', 'UPI', 'card', 'other'],
      required: true,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
      index: true,
    },
    receiptNo: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: '',
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ memberId: 1, paidAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
