import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    preferredTime: {
      type: String,
      enum: ['morning', 'afternoon', 'evening'],
      required: true,
    },
    fitnessGoal: {
      type: String,
      enum: ['weight-loss', 'muscle-building', 'strength', 'general-fitness'],
      required: true,
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'New', 'Contacted', 'Scheduled', 'Completed', 'Cancelled',
        'pending', 'contacted', 'attended', 'cancelled', 'completed'
      ],
      default: 'New',
      index: true,
    },
    emailStatus: {
      type: String,
      enum: ['Pending', 'Sent', 'Failed', 'None'],
      default: 'Pending',
    },
    coachNotes: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      default: 'web_form',
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

leadSchema.index({ createdAt: -1 });

export const Lead = mongoose.model('Lead', leadSchema);

