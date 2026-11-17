# 🔒 ROAR EXTREME — Application Security Policy & Controls

**Standard Alignment:** OWASP ASVS 5.0.0 (Level 2 Target) & OWASP API Security Top 10  
**Data Protection Baseline:** India Digital Personal Data Protection (DPDP) Act, 2023  
**Status:** Verified in Codebase  

---

## 1. Authentication & Session Management

1. **Password Hashing:**
   - Administrative passwords hashed using `bcryptjs` with salt work factor of 10.
   - Plaintext passwords are never stored in database or emitted in logs.
2. **Account Lockout & Brute-Force Defense:**
   - 5 consecutive failed login attempts trigger a 15-minute account lockout on `adminController.js`.
   - Rate limiting enforced on `POST /api/auth/login` (5 requests / 15 minutes per IP).
3. **JWT Configuration:**
   - Signed using HMAC-SHA256 with 256-bit secret (`JWT_SECRET`).
   - Tokens accepted strictly via `Authorization: Bearer <token>` HTTP headers.
   - Query string token extraction (`?token=...`) is strictly blocked to prevent leakage in proxy/browser logs.
4. **Role-Based Access Control (RBAC):**
   - Explicit roles: `owner`, `receptionist`, `trainer`, `device`, `member`.
   - Deny-by-default on all administrative routes.

---

## 2. Injection & Data Tampering Defenses

### 2.1 NoSQL Operator Injection
All incoming request payloads are recursively processed by [`backend/src/middleware/sanitize.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/middleware/sanitize.js):
- Strips keys starting with `$` (`$gt`, `$ne`, `$where`, `$regex`).
- Deletes prototype pollution vectors (`__proto__`, `constructor`, `prototype`).
- Rejects raw `req.body` passing directly into Mongoose filters.

### 2.2 ReDoS (Regular Expression Denial of Service)
- User-supplied search queries are escaped using `escapeRegex()` before insertion into Mongoose `$regex` queries in `leadService.js` and `memberService.js`.

---

## 3. HTTP Security Headers & Content Security Policy (CSP)

Helmet is configured in [`backend/src/server.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/server.js) with:

```javascript
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com"],
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
      },
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  })
);

// Explicit Device Hardware Permissions Policy
app.use((req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()"
  );
  next();
});
```

---

## 4. Credential Rotation & Secret Management

### Pre-Deployment Rotation Checklist

| Secret | Minimum Entropy | Production Provider Location |
| :--- | :--- | :--- |
| `JWT_SECRET` | 32+ random characters | Render / Vercel Host Environment Variables |
| `FACE_ENCRYPTION_KEY` | 32-character hex key (256-bit) | Render Host Environment Variables |
| `LOCK_DEVICE_SECRET` | 32+ random characters | Render & ESP32 NVS Flash Storage |
| `MONGO_URI` | Atlas SRV connection string with dedicated DB user | Render Host Environment Variables |
| `GEMINI_API_KEY` | Google AI Studio Key | Render Host Environment Variables |

> ⚠️ **Policy on Public Secrets:** Any key committed to version control or listed in documentation examples must be treated as permanently compromised. Always populate production values via cloud host environment variables.
