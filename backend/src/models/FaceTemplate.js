import mongoose from 'mongoose';

const faceTemplateSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      unique: true,
      index: true,
    },
    encryptedDescriptors: {
      type: [String],
      required: true,
      validate: [
        (val) => Array.isArray(val) && val.length >= 3 && val.length <= 5,
        'FaceTemplate must contain between 3 and 5 encrypted descriptors',
      ],
    },
    descriptorCount: {
      type: Number,
      required: true,
      min: 3,
      max: 5,
    },
    modelVersion: {
      type: String,
      default: '@vladmandic/face-api-v1.7',
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const FaceTemplate = mongoose.model('FaceTemplate', faceTemplateSchema);
