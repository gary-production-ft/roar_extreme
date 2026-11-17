import mongoose from 'mongoose';

const chatFeedbackSchema = new mongoose.Schema(
  {
    messageId: { type: String, required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    rating: { type: String, enum: ['up', 'down'], required: true },
    // Optional: store the assistant text so we can review low-rated answers
    assistantText: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

// One rating per message (upsert-friendly) — defined via schema field-level index above, no duplicate needed

export const ChatFeedback = mongoose.model('ChatFeedback', chatFeedbackSchema);
