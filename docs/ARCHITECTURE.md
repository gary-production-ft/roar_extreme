# 🏛️ ROAR EXTREME — Software & Systems Architecture

**Status:** Production Hardened  
**Architecture Pattern:** Modular Monolith with Edge Biometrics & Hardware IoT Bridge  
**Primary Language:** TypeScript 5.9 (Frontend) / JavaScript ES Modules (Backend)  

---

## 1. High-Level Architecture Overview

```
                               ┌────────────────────────────────────────────────────────┐
                               │                    Client Browser                      │
                               │  - React 19 SPA (Vite 8, Tailwind 4)                   │
                               │  - Edge Biometrics WASM (@vladmandic/face-api)         │
                               └───────────┬────────────────────────────────┬───────────┘
                                           │ HTTPS                          │ Device Auth
                                           ▼                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    Express 4.21 Gateway (Node.js LTS)                                     │
│                                                                                                           │
│  [Telemetry & Request-Id] ──> [NoSQL Sanitizer] ──> [Redis Rate Limiter] ──> [Role-Based Access Control] │
└──────────────────────┬────────────────────────────────┬───────────────────────────────────┬───────────────┘
                       │                                │                                   │
                       ▼                                ▼                                   ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐ ┌─────────────────────────────────────────┐
│       AI Chat Engine         │ │   Clinical Diet & Workout    │ │      Biometric & Access Controller      │
│                              │ │                              │ │                                         │
│ • Sub-15ms Intent Intercept  │ │ • Mifflin-St Jeor Code Engine│ │ • evaluateAccess Policy Rules           │
│ • 300-entry In-memory LRU    │ │ • 40-profile Safety Gates    │ │ • AES-256-GCM Encrypted Face Store      │
│ • Gemini 3.5 Flash-Lite SSE  │ │ • NIN IFCT Food Retrieval    │ │ • Signed HMAC-SHA256 Command Dispatch   │
│ • Circuit Breaker & Fallback │ │ • ±5% Calorie Post-Validator │ │ • Bulkhead Isolated from Chat Rate Limit│
└──────────────┬───────────────┘ └──────────────┬───────────────┘ └────────────────────┬────────────────────┘
               │                                │                                      │
               ▼                                ▼                                      ▼
┌───────────────────────────────────────────────────────────────┐ ┌─────────────────────────────────────────┐
│                     Persistence Layer                         │ │         Physical IoT Hardware           │
│                                                               │ │                                         │
│ • MongoDB Atlas (Compound Indexes, Pool: min=10, max=50)      │ │ • ESP32 Controller (mbedtls Crypto)     │
│ • Redis 6 (Shared Cache, Session Revocation, Rate Limits)     │ │ • 12V 280kg Electromagnetic Lock        │
│ • Prometheus Telemetry (/metrics, p50/p95/p99 SLA Monitoring) │ │ • Mechanical Series Push-to-Exit Button │
└───────────────────────────────────────────────────────────────┘ └─────────────────────────────────────────┘
```

---

## 2. Core Subsystems & Boundaries

### 2.1 Public Visitor & Booking Engine
- **Frontend Entrypoint:** [`src/pages/Home/`](file:///d:/projects%20webdeveloper/roar%20fitness/src/pages/Home), [`src/pages/Register/`](file:///d:/projects%20webdeveloper/roar%20fitness/src/pages/Register)
- **API Routes:** `POST /api/leads`
- **Guarantees:**
  - 10-digit Indian mobile regex verification (`^[6-9]\d{9}$`).
  - Idempotent lead deduplication (re-submitting returns existing booking reference without duplicate DB records).

### 2.2 Roar AI Multilingual Fitness Coach
- **Frontend Entrypoint:** [`src/components/Chatbot/`](file:///d:/projects%20webdeveloper/roar%20fitness/src/components/Chatbot)
- **API Routes:** `POST /api/chat`, `POST /api/preferences`, `DELETE /api/preferences`
- **Pipeline:**
  1. **Intent Interceptor (<15ms):** Recognizes greetings, facility hours, rooftop directions, and pricing with zero LLM invocations.
  2. **LRU FAQ Cache (<2ms):** 300-entry LRU cache for frequent gym questions.
  3. **Gemini Streaming Relay:** Server-Sent Events (SSE) streaming tokens via `@google/genai` SDK.
  4. **Circuit Breaker:** Automatic fallback to OpenAI (`gpt-4o-mini`) and rule-based grounded fallbacks on HTTP 429 quota errors.

### 2.3 Deterministic Diet & Workout Engine
- **API Routes:** `POST /api/fitness-plans/generate`, `GET /api/fitness-plans/:id`
- **Clinical Calculation Pipeline:**
  - **Mifflin-St Jeor Equation:** Basal Metabolic Rate (BMR) calculated deterministically in JavaScript (never entrusted to LLM math hallucinations).
  - **Medical Safety Gates:** Under-18s, pregnant women, cardiac patients, and eating disorder histories are redirected to healthcare professionals.
  - **Candidate Selection:** Exercises and foods filtered from verified local catalogs grounded in **ICMR-NIN IFCT 2017**.
  - **Gemini Arrangement:** Model only arranges and explains candidate selections; post-validation enforces ±5% calorie adherence and zero allergen leakage.

### 2.4 Edge Biometrics & Physical Turnstile
- **Frontend Entrypoint:** [`src/pages/Kiosk/Kiosk.tsx`](file:///d:/projects%20webdeveloper/roar%20fitness/src/pages/Kiosk/Kiosk.tsx)
- **API Routes:** `POST /api/access/verify`
- **Data Flow:**
  - Camera frames are vectorized locally inside browser WebGL via `@vladmandic/face-api`.
  - Raw images are discarded immediately; only the 128-float embedding is transmitted over HTTPS.
  - Backend verifies member status (valid date, payment settled, not frozen, operating hours).
  - On approval, backend signs an HMAC-SHA256 command (`commandId|doorId|timestamp|nonce`) and publishes to MQTT-TLS.
  - ESP32 hardware verifies the HMAC signature using mbedtls, validates freshness (<5s), and actuates the 12V maglock relay.
