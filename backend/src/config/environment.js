import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || process.env.mongodb || 'mongodb://127.0.0.1:27017/roar_extreme',
  clientUrl: process.env.CLIENT_URL || 'https://roarextreme.vercel.app',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h', // 8-hour maximum lifetime
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.Gemini || process.env.gemini || '',
  geminiModel: process.env.GEMINI_MODEL || process.env.AI_MODEL || 'gemini-3.5-flash-lite',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  resendApiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.FROM_EMAIL || 'noreply@roarextreme.com',
  gymNotificationEmail: process.env.GYM_NOTIFICATION_EMAIL || 'admin@roarextreme.com',
  memoryEnabled: process.env.MEMORY_ENABLED === 'true',
  chatHistoryRetentionDays: parseInt(process.env.CHAT_HISTORY_RETENTION_DAYS || '30', 10),
  memoryRetentionDays: parseInt(process.env.MEMORY_RETENTION_DAYS || '180', 10),

  // Biometric & Access Control Configuration
  faceEncryptionKey: process.env.FACE_ENCRYPTION_KEY || 'roar_biometric_aes256_secret_key_32bytes!', // 32 bytes for AES-256-GCM
  faceMatchThreshold: parseFloat(process.env.FACE_MATCH_THRESHOLD || '0.48'),
  ambiguityMargin: parseFloat(process.env.AMBIGUITY_MARGIN || '0.08'),
  deviceApiKey: process.env.DEVICE_API_KEY || 'roar_kiosk_device_key_nashik_rooftop_01',
  attendanceCooldownMinutes: parseInt(process.env.ATTENDANCE_COOLDOWN_MINUTES || '5', 10),
  gracePeriodDays: parseInt(process.env.GRACE_PERIOD_DAYS || '0', 10),

  // Phase 2 Hardware & Lock IoT Transport
  mqttBrokerUrl: process.env.MQTT_BROKER_URL || '', // e.g. mqtts://broker.hivemq.com:8883
  mqttUsername: process.env.MQTT_USERNAME || '',
  mqttPassword: process.env.MQTT_PASSWORD || '',
  doorCommandExpiryMs: parseInt(process.env.DOOR_COMMAND_EXPIRY_MS || '5000', 10),
  deviceHeartbeatTimeoutMs: parseInt(process.env.DEVICE_HEARTBEAT_TIMEOUT_MS || '45000', 10),
  kioskLockoutDenialThreshold: parseInt(process.env.KIOSK_LOCKOUT_DENIAL_THRESHOLD || '5', 10),
  kioskLockoutDurationMs: parseInt(process.env.KIOSK_LOCKOUT_DURATION_MS || '180000', 10), // 3 min lockout

  // Operational Feature Flags & Kill-Switches (Default OFF in production until verified)
  enableDoorControl: process.env.ENABLE_DOOR_CONTROL === 'true' || (process.env.NODE_ENV !== 'production' && process.env.ENABLE_DOOR_CONTROL !== 'false'),
  enableFaceAccess: process.env.ENABLE_FACE_ACCESS === 'true' || (process.env.NODE_ENV !== 'production' && process.env.ENABLE_FACE_ACCESS !== 'false'),
  enableChatbot: process.env.ENABLE_CHATBOT !== 'false',
  enablePlanEngine: process.env.ENABLE_PLAN_ENGINE !== 'false',
};

export function validateEnvironment(logger) {
  const missing = [];
  const warnings = [];

  const hasMongo = Boolean(process.env.MONGO_URI || process.env.MONGODB_URI || process.env.mongodb);
  if (!hasMongo) {
    if (env.nodeEnv === 'production') {
      missing.push('MONGO_URI');
    } else {
      warnings.push('MONGO_URI is unset; defaulting to local 127.0.0.1:27017.');
    }
  }

  if (env.nodeEnv === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev_jwt_secret_change_in_production' || process.env.JWT_SECRET.length < 32) {
      warnings.push('JWT_SECRET should be set to a secure, non-default string of at least 32 characters in production.');
    }
    if (env.enableFaceAccess) {
      if (!process.env.FACE_ENCRYPTION_KEY || process.env.FACE_ENCRYPTION_KEY === 'roar_biometric_aes256_secret_key_32bytes!') {
        missing.push('FACE_ENCRYPTION_KEY must be set to a dedicated production 32-character key when ENABLE_FACE_ACCESS=true.');
      }
    } else {
      warnings.push('Biometric face access is disabled (ENABLE_FACE_ACCESS=false).');
    }
    if (env.enableDoorControl) {
      if (!process.env.LOCK_DEVICE_SECRET || process.env.LOCK_DEVICE_SECRET === 'roar_esp32_lock_hmac_secret_key_2026!') {
        missing.push('LOCK_DEVICE_SECRET must be set to a secure hardware signing secret when ENABLE_DOOR_CONTROL=true.');
      }
    } else {
      warnings.push('Hardware door control is disabled (ENABLE_DOOR_CONTROL=false).');
    }
    const hasGemini = Boolean(process.env.GEMINI_API_KEY || process.env.Gemini || process.env.gemini);
    if (!hasGemini) {
      warnings.push('GEMINI_API_KEY is not configured. AI chatbot will operate using grounded local fallback.');
    }
  }

  if (logger) {
    for (const w of warnings) {
      logger.warn(`[CONFIG] ${w}`);
    }
    for (const m of missing) {
      logger.error(`[CONFIG] Missing critical environment variable: ${m}`);
    }
  }

  return { isValid: missing.length === 0, missing, warnings };
}
