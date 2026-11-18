# 🔐 ROAR EXTREME — Step 2: Secrets, Access & Credentials Audit

**Date:** 18 November 2026  
**Auditor / Role:** Principal Security Engineer & SRE  
**Target Repository:** `gary-production-ft/roar_extreme`  
**Branch:** `audit/sre-sec-perf`  

---

## 1. Full Git History Secret Scan

### Execution Commands & Methodology
A comprehensive git log audit was executed across all historical commits:
```bash
# 1. Search for historical admin password occurrences
git log -p -S "ADMIN_PASSWORD" --oneline
git log -p -S "RoarAdmin#2026" --oneline

# 2. Search for AI provider and private key headers
git log -p -S "AQ." --oneline
git log -p -S "BEGIN RSA PRIVATE KEY" --oneline

# 3. Tracked file audit against .env files
git ls-files --stage backend/.env .env
```

### Scan Findings & Evidence
1. **Historical Credential Exposure (Commit `d5a2c79`):**
   * **Commit Hash:** `d5a2c79` ("feat(chat): AI optimizations Phase 3")
   * **Exposed Credential String:** `RoarAdmin#2026`
   * **Location in Diff:** Appeared in `README.md` under setup instructions and in `backend/src/scripts/createAdmin.js` as a fallback default:
     ```javascript
     const password = process.argv[3] || 'RoarAdmin#2026';
     ```
   * **Severity:** **HIGH** (Historical git blob exposure).
2. **Current Tree State (VERIFIED CLEAN):**
   * The live tracked working tree contains zero secrets.
   * `backend/.env` is completely excluded from version control via `.gitignore`.
   * `createAdmin.js` now strictly requires `process.env.ADMIN_PASSWORD` or generates a cryptographically random one-time password enforcing a password change on first login.

---

## 2. Production Fail-Fast Environment Validation

To guarantee that the application can never start in production with default or placeholder credentials, [`backend/src/config/environment.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/config/environment.js) and [`backend/src/server.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/server.js) have been hardened with a **fail-fast startup gate**:

* In `NODE_ENV === 'production'`, startup is aborted with exit code `1` if:
  - `MONGO_URI` is unset.
  - `JWT_SECRET` is unset, shorter than 32 characters, or equals `dev_jwt_secret_change_in_production`.
  - `FACE_ENCRYPTION_KEY` is unset or equals `roar_biometric_aes256_secret_key_32bytes!`.
  - `LOCK_DEVICE_SECRET` is unset or equals `roar_esp32_lock_hmac_secret_key_2026!`.

---

## 3. Credential Rotation Checklist

Before public commercial deployment, all credentials must be rotated at their authoritative upstream providers:

| Credential / Secret | Entropy Standard | Where to Generate & Configure | Action Required |
| :--- | :--- | :--- | :--- |
| **`ADMIN_PASSWORD`** | 16+ chars, mixed case, symbols | Run `npm run rotate-password` in backend | Rotate existing `admin@roarextreme.com` password |
| **`JWT_SECRET`** | 32+ random bytes (hex/base64) | `openssl rand -hex 32` ➔ Render Environment Variables | Invalidate all existing active sessions |
| **`FACE_ENCRYPTION_KEY`** | Exactly 32 characters (256-bit AES) | `openssl rand -hex 16` ➔ Render Environment Variables | Key used for encrypting face descriptor vectors |
| **`LOCK_DEVICE_SECRET`** | 32+ random characters | `openssl rand -hex 32` ➔ Render & ESP32 NVS Flash | Pre-shared secret for hardware HMAC signing |
| **`MONGO_URI`** | MongoDB Atlas SRV String | MongoDB Atlas Cloud Console ➔ Database Access | Create distinct DB user with restricted readWrite role |
| **`GEMINI_API_KEY`** | Google AI Studio Key | Google AI Studio Console ➔ API Keys | Re-issue key and activate Tier 1 Pay-As-You-Go |
| **`RESEND_API_KEY`** | Resend API Token | Resend.com ➔ API Keys | Create production key with verified DNS domain |

---

## 4. Git History Rewrite Options (Awaiting Approval)

To permanently scrub the historical string `RoarAdmin#2026` from git history, management can choose between two standard methods:

### Option A: `git-filter-repo` (Recommended)
```bash
# 1. Create a text replacement mapping file
echo "RoarAdmin#2026==>REDACTED_HISTORICAL_PASSWORD" > replace.txt

# 2. Run git-filter-repo on a fresh clone
git filter-repo --replace-text replace.txt

# 3. Force-push to all branches (REQUIRES HUMAN AUTHORIZATION)
git push origin --force --all
```

### Option B: BFG Repo-Cleaner
```bash
# Run BFG with password dictionary
java -jar bfg.jar --replace-text replace.txt roar_extreme.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```
> ⚠️ **Safety Notice:** Per Rules of Engagement, no git history rewrite or force-push will be executed without explicit written user approval.

---

## 5. Token Storage Architecture & Risk Analysis

### Current Architecture:
* **Backend:** Sets an `httpOnly: true, secure: true, sameSite: 'lax'` cookie named `admin_token` on `POST /api/auth/login` (8-hour lifetime), and returns the signed token in JSON.
* **Frontend:** [`src/context/AuthContext.tsx`](file:///d:/projects%20webdeveloper/roar%20fitness/src/context/AuthContext.tsx) stores the token in `localStorage.getItem('roar_admin_token')` to inject `Authorization: Bearer <token>` on API requests.

### Threat Assessment:
* **XSS Attack Surface:** If an attacker succeeds in injecting client-side JavaScript, scripts can read tokens stored in `localStorage`.
* **Compensating Controls Active:**
  1. **Strict Helmet CSP:** Restricts script execution to `'self'`, blocking external CDN script injection.
  2. **Short Lifetime:** `JWT_EXPIRES_IN` defaults to 8 hours.
  3. **Brute-Force Lockout:** 5 failed logins triggers a 15-minute account freeze.
* **P1 Modernization Roadmap:** Fully migrate the frontend to read strictly from the HTTP-only cookie, removing `localStorage` usage entirely once cross-origin proxy configuration is unified.
