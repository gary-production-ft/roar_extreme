/**
 * ROAR EXTREME — INPUT SANITIZATION & INJECTION DEFENSE MIDDLEWARE
 *
 * OWASP ASVS 5.0 (Input Validation & Cryptographic Sanitization):
 * 1. NoSQL Injection Defense: Recursively strips or rejects MongoDB query operator keys ('$' / '.')
 * 2. Prototype Pollution Defense: Rejects attempts to overwrite Object.prototype (__proto__, constructor)
 * 3. Null Byte Poisoning: Strips \0 null characters from string inputs
 * 4. Regex Metacharacter Escaping: Safe search helper preventing ReDoS attacks
 */

/**
 * Escapes regex metacharacters in user query strings
 * Safe against ReDoS (Regular Expression Denial of Service)
 */
export function escapeRegex(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Recursively cleans an object/array against MongoDB operator injection
 * and prototype pollution.
 */
export function cleanInput(data, depth = 0) {
  if (depth > 10 || data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // Strip null bytes
    return data.replace(/\0/g, '');
  }

  if (Array.isArray(data)) {
    return data.map((item) => cleanInput(item, depth + 1));
  }

  if (typeof data === 'object') {
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      // Prototype pollution block
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // MongoDB operator block ($gt, $ne, $where, etc.) and dot-notation paths
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }

      cleaned[key] = cleanInput(value, depth + 1);
    }
    return cleaned;
  }

  return data;
}

/**
 * Express middleware to sanitize body, query, and params
 */
export function sanitizeInputs(req, _res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = cleanInput(req.body);
    }

    if (req.query && typeof req.query === 'object') {
      req.query = cleanInput(req.query);
    }

    if (req.params && typeof req.params === 'object') {
      req.params = cleanInput(req.params);
    }

    next();
  } catch (err) {
    next(err);
  }
}
