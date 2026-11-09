import mongoose from 'mongoose';

const ALLOWED_PREFERENCE_KEYS = [
  'preferredTime',
  'fitnessGoal',
  'experienceLevel',
  'preferredLanguage',
  'interestedDiscipline',
  'preferredContactChannel',
];

const userPreferenceSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    ownerType: {
      type: String,
      enum: ['session', 'visitor', 'lead'],
      default: 'visitor',
    },
    preferenceKey: {
      type: String,
      required: true,
      enum: ALLOWED_PREFERENCE_KEYS,
    },
    preferenceValue: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    source: {
      type: String,
      enum: ['chat_consent', 'direct_input'],
      default: 'chat_consent',
    },
    consentVersion: {
      type: String,
      default: 'v1.0',
    },
    consentedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      index: { expires: 0 }, // TTL index
    },
  },
  {
    timestamps: true,
  }
);

userPreferenceSchema.index({ ownerId: 1, preferenceKey: 1 }, { unique: true });

export const UserPreference = mongoose.model('UserPreference', userPreferenceSchema);
export { ALLOWED_PREFERENCE_KEYS };

