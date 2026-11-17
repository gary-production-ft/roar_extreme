import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    checkInTime: {
      type: Date,
      default: Date.now,
      index: true,
    },
    method: {
      type: String,
      enum: ['face', 'manual'],
      default: 'face',
    },
    accessLogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AccessLog',
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

attendanceSchema.index({ memberId: 1, checkInTime: -1 });

export const Attendance = mongoose.model('Attendance', attendanceSchema);
