# ROAR EXTREME — Environment Configuration Reference

**Release Version:** v1.0.0  
**Date:** 18 November 2026  
**Status:** PROVEN (Production Fail-Fast Verified)

---

## 1. Overview & Fail-Fast Startup Gate

ROAR EXTREME enforces strict configuration hygiene. When starting in production mode (`NODE_ENV=production`), the application validates critical security variables immediately upon boot. If any required secret is missing, empty, or using default placeholder text, the process terminates immediately (`process.exit(1)`) with a descriptive log message.

---

## 2. Backend Environment Variables (`backend/.env`)

### 2.1 Core Server & Runtime Settings
| Variable Name | Required in Prod | Default (Dev) | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Optional | `development` | Runtime mode: `development`, `test`, or `production`. Controls logging verbosity and fail-fast checks. |
| `PORT` | Optional | `5000` | Local network port for the Express application. Automatically assigned by Render in production. |
| `FRONTEND_URL` | **YES** | `http://localhost:5173` | Allowed CORS origin. In production, set to your Vercel domain (e.g., `https://roarextreme.in`). |
| `TIMEZONE` | Optional | `Asia/Kolkata` | Anchors all timestamps, attendance records, and booking slots to Indian Standard Time (IST). |

### 2.2 Database & Cache Connections
| Variable Name | Required in Prod | Default (Dev) | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `MONGO_URI` | **YES (Enforced)** | `mongodb://localhost:27017/roar_extreme` | MongoDB connection string. In production, use MongoDB Atlas SRV URI with TLS enabled (`mongodb+srv://...`). |
| `REDIS_URL` | Recommended | None (In-Memory) | Connection URI for Redis instance (`rediss://...`). Used for atomic distributed rate-limiting and session cache. |

### 2.3 Cryptography & Security Secrets
| Variable Name | Required in Prod | Default (Dev) | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET` | **YES (Enforced)** | `dev-secret-do-not-use-in-production` | Secret string for signing HS256 authentication tokens. Must be minimum 64 characters of high-entropy randomness. |
| `JWT_EXPIRES_IN` | Optional | `7d` | Token validity duration. Recommended: `1d` for production, `7d` with refresh. |
| `FACE_ENCRYPTION_KEY` | **YES (Enforced)** | `dev-face-key-32-chars-long-need-32b!` | Exactly 32-character (256-bit) string used for AES-256-GCM encryption of biometric vectors. |
| `LOCK_DEVICE_SECRET` | **YES (Enforced)** | `dev-lock-secret-not-for-prod` | HMAC-SHA256 pre-shared secret between backend API and physical ESP32 turnstile. |

### 2.4 External AI & Email Integrations
| Variable Name | Required in Prod | Default (Dev) | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Recommended | None | Google Gemini API key used as Tier 1 primary LLM provider for conversational coach and plans. |
| `OPENAI_API_KEY` | Optional | None | OpenAI API key used as secondary fallback when Gemini returns rate-limit (429) or 5xx errors. |
| `RESEND_API_KEY` | Optional | None | Resend API key for transactional email delivery. When omitted, leads succeed with reference code logged. |
| `RESEND_FROM_EMAIL` | Optional | `onboarding@resend.dev` | Sender email address verified in your Resend account. |

### 2.5 Operational Feature Flags & Kill-Switches
| Variable Name | Required in Prod | Default (Prod) | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `ENABLE_DOOR_CONTROL` | Optional | `false` | Enables hardware turnstile unlock commands. Keep `false` until rooftop wiring is commissioned. |
| `ENABLE_FACE_ACCESS` | Optional | `false` | Enables facial recognition endpoints. Keep `false` until DPDP legal consent review is signed off. |
| `ENABLE_CHATBOT` | Optional | `true` | Kill-switch for AI conversational coach. Set `false` during provider outages or budget overruns. |
| `ENABLE_PLAN_ENGINE` | Optional | `true` | Kill-switch for automated diet & workout generation. Set `false` to redirect members to on-site trainers. |

---

## 3. Frontend Environment Variables (`.env`)

Vite exposes environment variables prefixed with `VITE_` to the client-side JavaScript bundle.

| Variable Name | Required in Prod | Default (Dev) | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **YES** | `http://localhost:5000/api` | Absolute URL to the backend API. In production, set to your Render API domain (e.g., `https://api.roarextreme.in/api`). |
| `VITE_TURNSTILE_SITE_KEY` | Optional | None | Cloudflare Turnstile public site key for bot verification on trial registration forms. |

---

## 4. Secret Generation Quick-Reference

Run these commands in a secure terminal to generate production-grade cryptographic secrets:

```bash
# Generate 64-character hex JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate 32-character hex FACE_ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate 32-character hex LOCK_DEVICE_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```
