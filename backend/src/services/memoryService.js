import { UserPreference, ALLOWED_PREFERENCE_KEYS } from '../models/UserPreference.js';
import { env } from '../config/environment.js';
import { logger } from '../utils/logger.js';

export async function savePreference(ownerId, preferenceKey, preferenceValue, source = 'chat_consent', ownerType = 'visitor') {
  if (!ALLOWED_PREFERENCE_KEYS.includes(preferenceKey)) {
    throw new Error(`Preference key '${preferenceKey}' is not allowed in safe memory storage.`);
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.memoryRetentionDays);

  const updated = await UserPreference.findOneAndUpdate(
    { ownerId, preferenceKey },
    {
      ownerId,
      ownerType,
      preferenceKey,
      preferenceValue,
      source,
      consentVersion: 'v1.0',
      consentedAt: new Date(),
      expiresAt,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  logger.info(`User preference saved [${ownerId}]: ${preferenceKey} = ${JSON.stringify(preferenceValue)}`);
  return updated;
}

export async function getPreferences(ownerId) {
  if (!ownerId) return [];
  return UserPreference.find({ ownerId }).select('preferenceKey preferenceValue consentedAt updatedAt');
}

export async function deletePreference(ownerId, preferenceKey) {
  return UserPreference.findOneAndDelete({ ownerId, preferenceKey });
}

export async function clearAllPreferences(ownerId) {
  return UserPreference.deleteMany({ ownerId });
}

/**
 * Deterministic Regex + Structured extraction of preferences from natural dialogue.
 * Detects:
 * - Preferred time: morning, afternoon, evening
 * - Goal: weight loss, muscle building, strength, fitness
 * - Experience level: beginner, intermediate, advanced
 * - Language: english, hindi, marathi
 */
export function extractPotentialPreferences(text) {
  const lower = text.toLowerCase();
  const detected = {};

  // Time slot detection
  if (/\b(morning|dawn|early|6am|7am|8am)\b/.test(lower)) {
    detected.preferredTime = 'morning';
  } else if (/\b(afternoon|noon|midday|12pm|2pm|3pm)\b/.test(lower)) {
    detected.preferredTime = 'afternoon';
  } else if (/\b(evening|night|dusk|6pm|7pm|8pm|9pm)\b/.test(lower)) {
    detected.preferredTime = 'evening';
  }

  // Fitness Goal detection
  if (/\b(fat loss|weight loss|lose weight|cut|slim down|burn fat)\b/.test(lower)) {
    detected.fitnessGoal = 'weight-loss';
  } else if (/\b(muscle|hypertrophy|bulk|build muscle|mass|gain weight)\b/.test(lower)) {
    detected.fitnessGoal = 'muscle-building';
  } else if (/\b(strength|powerlifting|lift heavy|bench press|squat|pr)\b/.test(lower)) {
    detected.fitnessGoal = 'strength';
  } else if (/\b(stamina|general fitness|stay fit|cardio|conditioning|health)\b/.test(lower)) {
    detected.fitnessGoal = 'general-fitness';
  }

  // Experience level
  if (/\b(beginner|first time|never lifted|new to gym|starter)\b/.test(lower)) {
    detected.experienceLevel = 'beginner';
  } else if (/\b(intermediate|1 year|2 years|regular|moderate)\b/.test(lower)) {
    detected.experienceLevel = 'intermediate';
  } else if (/\b(advanced|3 years|athlete|competitive|pro)\b/.test(lower)) {
    detected.experienceLevel = 'advanced';
  }

  // Language
  if (/\b(hindi|हिंदी)\b/.test(lower)) {
    detected.preferredLanguage = 'hi';
  } else if (/\b(marathi|मराठी)\b/.test(lower)) {
    detected.preferredLanguage = 'mr';
  } else if (/\b(english)\b/.test(lower)) {
    detected.preferredLanguage = 'en';
  }

  return detected;
}

