# 🌐 ROAR EXTREME — Step 3: Statelessness, Multi-Instance Scaling & Compatibility

**Date:** 18 November 2026  
**Auditor / Role:** Principal SRE & Systems Architect  
**Target Repository:** `gary-production-ft/roar_extreme`  
**Branch:** `audit/sre-sec-perf`  

---

## 1. Multi-Instance Statelessness Audit

To scale horizontally behind a reverse proxy (e.g. Render zero-downtime rolling deploys or AWS ALB), every stateful component was audited against multi-instance guarantees:

| Component | Storage Layer | Multi-Instance Behavior | Scaling Support |
| :--- | :--- | :--- | :---: |
| **Rate Limiting** | Redis (`ioredis`) via `RedisRateLimitStore` with in-memory fallback | Shared atomicity via Redis `multi()` pipeline; when Redis is offline, operates safely in per-instance local memory. | **SUPPORTED** |
| **Payment Idempotency** | MongoDB `Payment` collection (`idempotencyKey`) | Shared database unique compound index; prevents double-charges across concurrent instances. | **SUPPORTED** |
| **Admin Lockout Counter** | MongoDB `Admin` collection (`failedLoginAttempts`, `lockUntil`) | Shared document updates; brute-force attempts from multiple pods accumulate on the same record. | **SUPPORTED** |
| **Chat Session Memory** | MongoDB `Memory` and `UserPreference` collections | Shared query reads/writes by `sessionId`; any instance can serve any conversational turn. | **SUPPORTED** |
| **Biometric Access Logs** | MongoDB `AccessLog` & `Attendance` collections | Shared insert/query; cooldown period verified across all instances. | **SUPPORTED** |
| **FAQ Cache & Intent Rules** | In-memory LRU (`faqCache.js`) | Read-only deterministic cache primed on startup; identical across all instances with zero cross-instance sync overhead. | **SUPPORTED** |
| **Door Command Nonces** | Hardware ESP32 Ring Buffer | The physical ESP32 tracks nonces on edge; prevents replay regardless of which backend pod signed the packet. | **SUPPORTED** |

> **Stateless Verdict:** When `REDIS_URL` is configured, the backend API is **fully stateless** and supports multi-instance horizontal scaling. Without `REDIS_URL`, horizontal scaling is supported with per-instance rate limits.

---

## 2. Deployment Topology Resolution

### Evaluated Alternatives:
1. **Single-Service Render Deployment (Frontend + API together):**
   - Express serves both `/api/*` and static React files from `/dist`.
   - *Pros:* Single domain, zero CORS setup.
   - *Cons:* Heavy static asset transfers consume Node.js CPU and event-loop time, increasing API latency.
2. **Decoupled Architecture (Vercel Frontend + Render API) [RECOMMENDED & CONFIGURED]:**
   - **Frontend:** Deployed to Vercel global edge CDN (`https://roarextreme.com`). Static files served with sub-20ms edge latency.
   - **Backend:** Deployed to Render Web Service (`https://api.roarextreme.com`). Dedicated Node.js compute for business logic and AI streaming.
   - **CORS Configuration:** `CLIENT_URL` explicitly configured in backend with credentials support (`origin: env.clientUrl, credentials: true`).
   - **Cookies:** `admin_token` cookie configured with `sameSite: 'lax', secure: true, httpOnly: true`.

---

## 3. Contract Drift & Consistency Standards

| Standard Dimension | Specification Enforced | Verification File / Evidence |
| :--- | :--- | :--- |
| **Validation Schemas** | Strict Zod validation on all POST/PATCH endpoints | [`backend/src/middleware/validate.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/middleware/validate.js) |
| **Error Response Format** | Fixed `{ success: false, message: string, errors?: [] }` schema | [`backend/src/middleware/errorHandler.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/middleware/errorHandler.js) |
| **Request Correlation** | `X-Request-Id` injected into every response header | [`backend/src/middleware/requestTelemetry.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/middleware/requestTelemetry.js) |
| **Timezone Anchor** | Strict `Asia/Kolkata` time formatting across operating hours and check-ins | [`backend/src/config/businessHours.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/config/businessHours.js) |
| **Logging Schema** | Winston structured JSON with automated DPDP PII scrubbing | [`backend/src/utils/logger.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/utils/logger.js) |
