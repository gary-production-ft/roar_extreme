import dotenv from 'dotenv';
dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || process.env.mongodb || 'mongodb://127.0.0.1:27017/roar_extreme',
  clientUrl: process.env.CLIENT_URL || 'https://roarextreme.vercel.app',
  jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.Gemini || process.env.gemini || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-3.5-flash-lite',
  resendApiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.FROM_EMAIL || 'noreply@roarextreme.com',
  gymNotificationEmail: process.env.GYM_NOTIFICATION_EMAIL || 'admin@roarextreme.com',
  memoryEnabled: process.env.MEMORY_ENABLED === 'true',
  chatHistoryRetentionDays: parseInt(process.env.CHAT_HISTORY_RETENTION_DAYS || '30', 10),
  memoryRetentionDays: parseInt(process.env.MEMORY_RETENTION_DAYS || '180', 10),
};

