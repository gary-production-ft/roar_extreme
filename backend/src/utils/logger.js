/**
 * ROAR EXTREME — SECURE APPLICATION LOGGER
 * 
 * DPDP Act & OWASP ASVS Compliant:
 * - Automatically scrubs Personally Identifiable Information (PII)
 *   (Indian mobile numbers, email addresses, passwords, JWT tokens, biometric vectors).
 * - Outputs structured JSON in production for ELK/Datadog/Render Log ingestion.
 * - Formatted console output in development.
 */

// Regex patterns for sensitive data
const PHONE_REGEX = /(\+?91[\-\s]?)?[6-9]\d{9}/g;
const EMAIL_REGEX = /([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/g;
const JWT_REGEX = /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g;
const BEARER_REGEX = /Bearer\s+[a-zA-Z0-9_\-\.]+/gi;

/**
 * Mask PII string
 */
export function maskPii(str) {
  if (typeof str !== 'string') return str;

  return str
    // Mask Bearer tokens
    .replace(BEARER_REGEX, 'Bearer [REDACTED_TOKEN]')
    // Mask raw JWTs
    .replace(JWT_REGEX, '[REDACTED_JWT]')
    // Mask Emails: test@example.com -> t***@example.com
    .replace(EMAIL_REGEX, (_match, user, domain, tld) => {
      const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : `${user[0]}***`;
      return `${maskedUser}@${domain}.${tld}`;
    })
    // Mask Indian phone numbers: +919876543210 -> ******3210
    .replace(PHONE_REGEX, (match) => {
      const clean = match.replace(/\D/g, '');
      const last4 = clean.slice(-4);
      return `******${last4}`;
    });
}

/**
 * Deep-scrub PII from objects, arrays, and error stacks
 */
export function scrubObject(obj, depth = 0) {
  if (depth > 6 || obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return maskPii(obj);
  }

  if (Array.isArray(obj)) {
    // Biometric face vector detection: array of floats > 50 elements
    if (obj.length >= 64 && typeof obj[0] === 'number') {
      return `[REDACTED_DESCRIPTOR_${obj.length}_DIMENSIONS]`;
    }
    return obj.map((item) => scrubObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    // Handle Error objects
    if (obj instanceof Error) {
      return {
        name: obj.name,
        message: maskPii(obj.message),
        stack: process.env.NODE_ENV === 'production' ? undefined : maskPii(obj.stack || ''),
      };
    }

    const scrubbed = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      // Explicit sensitive field suppression
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('descriptor') ||
        lowerKey.includes('embedding') ||
        lowerKey.includes('authorization') ||
        lowerKey.includes('cookie')
      ) {
        scrubbed[key] = '[REDACTED]';
      } else {
        scrubbed[key] = scrubObject(value, depth + 1);
      }
    }
    return scrubbed;
  }

  return obj;
}

function formatLog(level, message, ...meta) {
  const timestamp = new Date().toISOString();
  const safeMessage = typeof message === 'string' ? maskPii(message) : scrubObject(message);
  const safeMeta = meta.length > 0 ? meta.map((m) => scrubObject(m)) : undefined;

  if (process.env.NODE_ENV === 'production') {
    const logEntry = {
      timestamp,
      level,
      message: safeMessage,
      ...(safeMeta && safeMeta.length === 1 ? { meta: safeMeta[0] } : safeMeta ? { meta: safeMeta } : {}),
      service: 'roar-extreme-api',
    };
    return JSON.stringify(logEntry);
  }

  const metaString = safeMeta && safeMeta.length > 0 ? ' ' + JSON.stringify(safeMeta.length === 1 ? safeMeta[0] : safeMeta) : '';
  return `[${level.toUpperCase()}] ${timestamp} - ${safeMessage}${metaString}`;
}

export const logger = {
  info: (msg, ...meta) => console.log(formatLog('info', msg, ...meta)),
  warn: (msg, ...meta) => console.warn(formatLog('warn', msg, ...meta)),
  error: (msg, ...meta) => console.error(formatLog('error', msg, ...meta)),
  debug: (msg, ...meta) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatLog('debug', msg, ...meta));
    }
  },
};
