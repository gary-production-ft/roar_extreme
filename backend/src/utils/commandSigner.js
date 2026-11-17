import crypto from 'crypto';

// Replay protection cache (stores recent nonces with their expiry timestamp)
const seenNonces = new Map();

// Periodic sweep of expired nonces every 10 seconds
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiresAt] of seenNonces.entries()) {
    if (now > expiresAt) {
      seenNonces.delete(nonce);
    }
  }
}, 10000).unref();

/**
 * Generate canonical string for consistent HMAC-SHA256 signing
 */
export function buildCanonicalPayload({ commandId, doorId, accessLogId, timestamp, expiresAt, durationSeconds, nonce }) {
  return `${commandId}|${doorId}|${accessLogId || ''}|${timestamp}|${expiresAt}|${durationSeconds}|${nonce}`;
}

/**
 * Generate a cryptographically signed unlock command
 * @param {Object} params
 * @param {string} params.doorId Target door identifier
 * @param {string} params.accessLogId Validated AccessLog document ID
 * @param {string} params.secret Shared device secret key
 * @param {number} [params.durationSeconds=5] Relay energized duration
 * @param {number} [params.expiryMs=5000] Command validity window
 * @param {number} [params.now=Date.now()] Reference timestamp
 * @returns {Object} Signed command payload
 */
export function signUnlockCommand({
  doorId,
  accessLogId,
  secret,
  durationSeconds = 5,
  expiryMs = 5000,
  now = Date.now(),
}) {
  if (!doorId || !secret) {
    throw new Error('doorId and secret are required to sign an unlock command.');
  }

  const commandId = crypto.randomUUID();
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = now;
  const expiresAt = timestamp + expiryMs;

  const canonical = buildCanonicalPayload({
    commandId,
    doorId,
    accessLogId: String(accessLogId || ''),
    timestamp,
    expiresAt,
    durationSeconds,
    nonce,
  });

  const signature = crypto.createHmac('sha256', secret).update(canonical).digest('hex');

  return {
    commandId,
    doorId,
    accessLogId: String(accessLogId || ''),
    timestamp,
    expiresAt,
    durationSeconds,
    nonce,
    signature,
  };
}

/**
 * Verify HMAC signature, freshness, and anti-replay nonce
 * @param {Object} command Signed command payload
 * @param {string} secret Shared device secret key
 * @param {Object} [options]
 * @param {number} [options.now=Date.now()]
 * @param {number} [options.maxAgeMs=5000]
 * @returns {{ valid: boolean, error?: string }}
 */
export function verifyUnlockCommand(command, secret, options = {}) {
  if (!command || !secret) {
    return { valid: false, error: 'missing_command_or_secret' };
  }

  const { commandId, doorId, accessLogId, timestamp, expiresAt, durationSeconds, nonce, signature } = command;

  if (!commandId || !doorId || !timestamp || !expiresAt || !nonce || !signature) {
    return { valid: false, error: 'incomplete_command_payload' };
  }

  const now = options.now !== undefined ? options.now : Date.now();
  const maxAgeMs = options.maxAgeMs !== undefined ? options.maxAgeMs : 5000;

  // 1. Expiration check (5-second default lifetime)
  if (now > expiresAt) {
    return { valid: false, error: 'command_expired' };
  }

  // 2. Clock skew / Future timestamp check (> 2s in future)
  if (timestamp > now + 2000) {
    return { valid: false, error: 'future_timestamp_detected' };
  }

  // 3. Stale check
  if (now - timestamp > maxAgeMs) {
    return { valid: false, error: 'command_stale' };
  }

  // 4. Anti-Replay check: nonce cannot be reused
  if (seenNonces.has(nonce)) {
    return { valid: false, error: 'replay_detected' };
  }

  // 5. Cryptographic HMAC-SHA256 signature verification
  const canonical = buildCanonicalPayload({
    commandId,
    doorId,
    accessLogId: String(accessLogId || ''),
    timestamp,
    expiresAt,
    durationSeconds,
    nonce,
  });

  const expectedSignature = crypto.createHmac('sha256', secret).update(canonical).digest('hex');

  try {
    const isSigValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    if (!isSigValid) {
      return { valid: false, error: 'invalid_signature' };
    }
  } catch {
    return { valid: false, error: 'signature_format_mismatch' };
  }

  // Mark nonce as used with its expiry time
  seenNonces.set(nonce, expiresAt);

  return { valid: true };
}

/**
 * Utility to clear replay cache in test suites
 */
export function _resetSeenNonces() {
  seenNonces.clear();
}
