# 🔎 ROAR EXTREME — Comprehensive Engineering Audit

**Assessment Date:** November 18, 2026  
**Auditor:** Principal Software Architect & SRE  
**Repository:** `gary-production-ft/roar_extreme`  
**Target Environment:** Node.js v24.19.0 LTS / Express 4.21 / Mongoose 8.9 / React 19.3 / Vite 8.3 / MongoDB Atlas  

---

## 1. System Architecture Inventory

| Layer | Technology | Version | Location / Entrypoint | Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend SPA** | React, TypeScript, Vite | React 19.3.1, TS 5.9, Vite 8.3.6 | [`src/main.tsx`](file:///d:/projects%20webdeveloper/roar%20fitness/src/main.tsx) | Client routing, lead registration, member kiosk, admin dashboard |
| **Styling** | Tailwind CSS 4 | Tailwind 4.3.5 | [`src/index.css`](file:///d:/projects%20webdeveloper/roar%20fitness/src/index.css) | Spatial design system, dark palette (`#080808` / `#FF5A1F`), responsive layouts |
| **Biometrics** | `@vladmandic/face-api` | 1.7.15 | [`src/pages/Kiosk/Kiosk.tsx`](file:///d:/projects%20webdeveloper/roar%20fitness/src/pages/Kiosk/Kiosk.tsx) | Client WebGL/WASM 128-float facial vectorization & liveness challenge |
| **Backend API** | Node.js Express | Express 4.21.2 | [`backend/src/server.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/server.js) | REST API, SSE streaming, authentication, turnstile dispatch |
| **Database** | MongoDB / Mongoose | Mongoose 8.9.5 | [`backend/src/models/`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/models) | Document schemas: Admin, Lead, Member, Attendance, AccessLog, Payment |
| **Cache & Store**| Redis (`ioredis`) | 6.0.0 | [`backend/src/config/redis.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/config/redis.js) | Shared token revocation, rate limiting store, in-memory LRU fallback |
| **AI Providers** | Google Gemini / OpenAI | Gemini 3.5 Flash-Lite / GPT-4o-mini | [`backend/src/services/aiService.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/services/aiService.js) | Multi-turn conversational fitness coach & plan arranging |
| **Hardware Link**| MQTT-TLS / HMAC | mbedtls HMAC-SHA256 | [`backend/src/services/doorService.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/services/doorService.js) | ESP32 turnstile control with 5s freshness window & anti-replay nonces |

---

## 2. Findings & Severity Classification

Findings are categorized by severity:
* **P0 — Critical**: Security vulnerability, data loss risk, physical safety violation.
* **P1 — High**: Major architectural flaw or functional failure under load.
* **P2 — Medium**: Performance bottleneck, reliability gap, or maintainability debt.
* **P3 — Low**: Documentation discrepancy or non-breaking minor issue.

### Audit Findings Ledger

| ID | Severity | Category | Description | Status & Remediation |
| :--- | :---: | :--- | :--- | :--- |
| **AUD-01** | **P0** | Security | Unsanitized request inputs allowing NoSQL operator injection (`$gt`, `$ne`, etc.) into queries. | **REMEDIATED**: Added [`backend/src/middleware/sanitize.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/middleware/sanitize.js) stripping recursive `$`-keys. |
| **AUD-02** | **P0** | Safety | Turnstile fail-open risk: Unhandled backend exceptions could inadvertently signal hardware unlocks. | **REMEDIATED**: Enforced **fail-closed physical security** in [`accessController.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/controllers/accessController.js); returns HTTP 503 on error. |
| **AUD-03** | **P1** | Security | Auth token accepted via URL query parameter (`?token=...`), risking credential leakage in server logs. | **REMEDIATED**: Enforced Authorization Bearer header only in [`authenticate.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/middleware/authenticate.js). |
| **AUD-04** | **P1** | Resilience | Door access verification sharing the global rate limit, allowing public chat floods to block door entries. | **REMEDIATED**: Created **bulkhead isolation** exempting `/api/access/verify` and health routes from global rate limits. |
| **AUD-05** | **P1** | Integrity | Duplicate membership payment charges possible under rapid double-click or network retry bursts. | **REMEDIATED**: Added `idempotencyKey` and 15s duplicate charge detection in [`Payment.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/models/Payment.js). |
| **AUD-06** | **P2** | Performance | MongoDB unindexed queries causing `COLLSCAN`s across membership and access log tables under high traffic. | **REMEDIATED**: Added compound indexes on hot paths (`memberId + createdAt`, `status + checkInTime`); 0 `COLLSCAN`s verified. |
| **AUD-07** | **P2** | AI / Cost | Unbounded Gemini retries during 429 quota exhaustion leading to thread exhaustion and cascading failures. | **REMEDIATED**: Implemented 3-state Circuit Breaker (`CLOSED`, `OPEN`, `HALF_OPEN`) with immediate 30s backoff. |
| **AUD-08** | **P3** | Docs | Discrepancy between README claims (Express 5, Mongoose 9) and installed dependencies (Express 4.21, Mongoose 8.9). | **REMEDIATED**: Updated README badges and text to reflect accurate installed versions. |
| **AUD-09** | **P3** | Hardware | Physical rooftop turnstile claims: Software tested on simulator, but physical hardware is not yet wired on-site. | **DOCUMENTED**: Formally classified as verified in simulation; physical on-site commissioning marked as pending hardware rollout. |

---

## 3. Issues Requiring External Human Action

1. **Physical Rooftop Hardware Wiring (Nashik Studio)**:
   - Mounting the 12V 280kg Maglock on the 6th-floor rooftop door above the 5th-floor elevator staircase.
   - Installing the reverse-biased **1N4007 flyback diode** across lock terminals to eliminate 150V+ inductive back-EMF spikes.
   - Wiring the series physical normally-closed (NC) Push-to-Exit crash bar into the 12V line for life-safety egress.
2. **MongoDB Atlas Tier Upgrade**:
   - Upgrading from Atlas M0 Free (100 connection cap) to Atlas M10 ($57/mo, 1,500 connections) prior to public marketing launch.
3. **Google AI Studio Pay-As-You-Go Activation**:
   - Activating Tier 1 billing for the Gemini API key to lift the Free Tier 15 RPM cap to 360 RPM.
4. **Resend / SMTP Mail Delivery Provisioning**:
   - Adding a live `RESEND_API_KEY` to send real transactional email passes instead of mock logging.
