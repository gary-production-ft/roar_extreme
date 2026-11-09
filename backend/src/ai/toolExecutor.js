import { getApprovedKnowledge } from '../services/knowledgeService.js';
import { savePreference, getPreferences } from '../services/memoryService.js';
import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

export async function executeTool(name, args, { sessionId, visitorId }) {
  logger.info(`Executing tool [${name}] for session [${sessionId}] with args:`, args);

  switch (name) {
    case 'getGymInformation': {
      const docs = await getApprovedKnowledge('location');
      return {
        brand: 'ROAR FITNESS (ROAR EXTREME)',
        address: '601/602 Rushiraj Regency, Vidya Vikas Circle, above Axis Bank, Patil Colony, Canada Corner, Nashik, Maharashtra 422005',
        altitude: '6th Floor Rooftop Terrace with open-air views',
        city: 'Nashik',
        docs: docs.map((d) => d.content),
      };
    }

    case 'getTrainingOptions': {
      const docs = await getApprovedKnowledge('services');
      return {
        disciplines: [
          'General Gym Training',
          'Weight Management',
          'Strength Training',
          'Cardio Fitness',
          'Zumba Aerobic Dance',
          'CrossFit Functional Conditioning',
          'Combat Kickboxing',
          '1-on-1 Personal Coaching',
        ],
        details: docs.map((d) => ({ title: d.title, content: d.content })),
      };
    }

    case 'getGymHours': {
      const docs = await getApprovedKnowledge('hours');
      return {
        hours: 'Monday – Saturday: 6:00 AM – 10:00 PM',
        sunday: 'Dedicated recovery & maintenance (by appointment)',
        arrivalNote: 'Take elevator to 5th floor, then take the dedicated staircase to the 6th floor terrace.',
        docs: docs.map((d) => d.content),
      };
    }

    case 'getFreeSessionInformation': {
      return {
        offer: 'Free Single Session Pass',
        perks: [
          'Full equipment and rooftop facility tour',
          '60-minute guided trial workout',
          'Body composition evaluation',
          '1-on-1 consultation with head coach',
        ],
        requirements: [
          'Clean change of sports shoes (mandatory for platform and turf hygiene)',
          'Personal workout towel',
          'Digital booking reference ID',
        ],
        actionUrl: '/register',
      };
    }

    case 'getUserPreferences': {
      const prefs = await getPreferences(sessionId);
      return {
        preferences: prefs.map((p) => ({ key: p.preferenceKey, value: p.preferenceValue })),
      };
    }

    case 'saveUserPreference': {
      const { preferenceKey, preferenceValue } = args;
      const pref = await savePreference(sessionId, preferenceKey, preferenceValue, 'chat_consent');
      return {
        success: true,
        savedKey: pref.preferenceKey,
        savedValue: pref.preferenceValue,
        message: `Preference for ${preferenceKey} has been stored.`,
      };
    }

    case 'startFreeSessionRegistration': {
      return {
        action: 'NAVIGATE_TO_REGISTRATION',
        url: '/register',
        prefilledGoal: args.prefilledGoal || '',
        prefilledTime: args.prefilledTime || '',
        message: 'Directing you to the free session pass application page.',
      };
    }

    case 'requestHumanAssistance': {
      await AuditLog.create({
        action: 'HUMAN_ASSISTANCE_REQUESTED',
        actorType: 'visitor',
        actorId: args.phone,
        targetResource: `Session:${sessionId}`,
        details: args,
      });
      return {
        success: true,
        message: 'Your request has been logged. Our gym manager will reach out via mobile shortly.',
      };
    }

    default:
      return { error: `Tool ${name} is not recognized or permitted.` };
  }
}

