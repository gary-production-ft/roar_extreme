import mongoose from 'mongoose';

const knowledgeDocumentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'general',
        'services',
        'amenities',
        'location',
        'hours',
        'pricing',
        'free_session',
        'policy',
      ],
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    sourceUrl: {
      type: String,
      default: '',
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'unverified', 'pending'],
      default: 'verified',
      index: true,
    },
    lastVerifiedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: String,
      default: 'system',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

knowledgeDocumentSchema.index({ category: 1, verificationStatus: 1, isActive: 1 });

export const KnowledgeDocument = mongoose.model('KnowledgeDocument', knowledgeDocumentSchema);

