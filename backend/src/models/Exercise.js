import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    exerciseId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['strength', 'core', 'functional', 'power', 'conditioning', 'cardio', 'combat'],
      required: true,
      index: true,
    },
    primaryMuscles: [{ type: String }],
    secondaryMuscles: [{ type: String }],
    equipment: [{ type: String, index: true }], // equipment required (must be subset of verified equipment)
    movementPattern: { type: String, required: true, index: true },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
      index: true,
    },
    defaultSets: { type: Number, default: 3 },
    repRange: [{ type: Number }], // e.g. [8, 12]
    durationSeconds: [{ type: Number }], // e.g. [20, 60]
    durationMinutes: [{ type: Number }], // e.g. [10, 45]
    coachingCues: [{ type: String }],
    avoidOrModifyIf: [{ type: String }], // contraindications e.g. 'knee_or_back_pain'
    regression: { type: String },
    progression: { type: String },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

export const Exercise = mongoose.model('Exercise', exerciseSchema);
