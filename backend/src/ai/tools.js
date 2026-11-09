export const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'getGymInformation',
      description: 'Retrieve verified facility details, rooftop location, and brand overview for Roar Fitness Nashik.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getTrainingOptions',
      description: 'Get verified details on the 8 training programs (Strength, CrossFit, Cardio, Zumba, Kickboxing, Personal Training, etc.).',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Optional specific discipline to look up.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getGymHours',
      description: 'Get verified daily operational timings and arrival instructions for Roar Fitness.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getFreeSessionInformation',
      description: 'Explain what the Free Single Session Pass includes and what to bring on day 1.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'getUserPreferences',
      description: 'Retrieve the current visitor consented preferences from memory.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'saveUserPreference',
      description: 'Save a visitor preference ONLY after explicit visitor consent.',
      parameters: {
        type: 'object',
        properties: {
          preferenceKey: {
            type: 'string',
            enum: ['preferredTime', 'fitnessGoal', 'experienceLevel', 'preferredLanguage', 'interestedDiscipline'],
            description: 'The key of the preference to store.',
          },
          preferenceValue: {
            type: 'string',
            description: 'The value to store.',
          },
        },
        required: ['preferenceKey', 'preferenceValue'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'startFreeSessionRegistration',
      description: 'Generate an interactive action directing the user to the free session registration form.',
      parameters: {
        type: 'object',
        properties: {
          prefilledGoal: { type: 'string' },
          prefilledTime: { type: 'string' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'requestHumanAssistance',
      description: 'Create a request for a gym staff member to reach out to the visitor.',
      parameters: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          phone: { type: 'string' },
          inquiryTopic: { type: 'string' },
        },
        required: ['fullName', 'phone'],
      },
    },
  },
];

