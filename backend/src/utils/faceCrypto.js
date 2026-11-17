import crypto from 'crypto';
import { env } from '../config/environment.js';

// Derive or normalize key to exactly 32 bytes (256 bits)
function getCipherKey() {
  const secret = env.faceEncryptionKey || 'roar_biometric_aes256_secret_key_32bytes!';
  return crypto.createHash('sha256').update(String(secret)).digest();
}

/**
 * Encrypt a biometric descriptor (Float32Array or number array) using AES-256-GCM.
 * Never stores raw descriptors. Output is hex format: iv:authTag:ciphertext
 * @param {Array<number>} descriptor Float array (typically 128 dimensions)
 * @returns {string} Encrypted string
 */
export function encryptDescriptor(descriptor) {
  if (!Array.isArray(descriptor) && !ArrayBuffer.isView(descriptor)) {
    throw new Error('Invalid descriptor format for encryption. Expected an array of floats.');
  }

  const key = getCipherKey();
  const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const plainText = JSON.stringify(Array.from(descriptor));
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an AES-256-GCM encrypted descriptor string back into an array of floats
 * @param {string} encryptedString format: iv:authTag:ciphertext
 * @returns {Array<number>}
 */
export function decryptDescriptor(encryptedString) {
  if (typeof encryptedString !== 'string') {
    throw new Error('Encrypted descriptor must be a string.');
  }

  const parts = encryptedString.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted descriptor payload format.');
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = getCipherKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

/**
 * Compute Euclidean distance between two 128-d face descriptors
 * d(p, q) = sqrt(sum((p_i - q_i)^2))
 * @param {Array<number>} desc1
 * @param {Array<number>} desc2
 * @returns {number}
 */
export function euclideanDistance(desc1, desc2) {
  if (!desc1 || !desc2 || desc1.length !== desc2.length) {
    throw new Error('Descriptor length mismatch in Euclidean distance calculation.');
  }

  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
