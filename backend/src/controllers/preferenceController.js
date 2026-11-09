import { z } from 'zod';
import {
  savePreference,
  getPreferences,
  deletePreference,
  clearAllPreferences,
} from '../services/memoryService.js';
import { ALLOWED_PREFERENCE_KEYS } from '../models/UserPreference.js';

export const savePreferenceSchema = z.object({
  body: z.object({
    sessionId: z.string().min(5),
    preferenceKey: z.enum(ALLOWED_PREFERENCE_KEYS),
    preferenceValue: z.any(),
    source: z.enum(['chat_consent', 'direct_input']).default('chat_consent'),
  }),
});

export async function getUserPreferences(req, res, next) {
  try {
    const { sessionId } = req.query;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    const preferences = await getPreferences(sessionId);
    res.json({
      success: true,
      preferences,
    });
  } catch (err) {
    next(err);
  }
}

export async function storePreference(req, res, next) {
  try {
    const { sessionId, preferenceKey, preferenceValue, source } = req.validatedData.body;
    const pref = await savePreference(sessionId, preferenceKey, preferenceValue, source);

    res.status(201).json({
      success: true,
      preference: pref,
      message: 'Preference saved with user consent',
    });
  } catch (err) {
    next(err);
  }
}

export async function removePreference(req, res, next) {
  try {
    const { key } = req.params;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    await deletePreference(sessionId, key);
    res.json({
      success: true,
      message: `Preference '${key}' deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
}

export async function clearPreferences(req, res, next) {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId is required' });
    }

    await clearAllPreferences(sessionId);
    res.json({
      success: true,
      message: 'All saved preferences cleared.',
    });
  } catch (err) {
    next(err);
  }
}

