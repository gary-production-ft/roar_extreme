# 🧪 ROAR EXTREME — Comprehensive Testing Strategy

**Frameworks:** Vitest 3.0 (Unit & Integration), Playwright (E2E / Mobile QA), k6 (Load Testing)  
**Test Suites:** 10 Test Files / 143 Unit & Integration Tests (100% Passing)  
**Clinical Evaluations:** 40 / 40 Profiles Passing (100% Passing)  

---

## 1. Testing Pyramid & Test Types

```
                    ┌─────────────────────────┐
                    │      End-to-End         │  Playwright Mobile QA (scripts/mobileQa.js)
                    │  (320px to 1280px View) │  Virtual Device Runner (simulateLockDevice.js)
                    ├─────────────────────────┤
                    │    Integration Tests    │  Express Routes, Mongoose Queries,
                    │ (API, Auth, Access, SRE)│  Bulkheads, Telemetry, Circuit Breakers
                    ├─────────────────────────┤
                    │       Unit Tests        │  Mifflin-St Jeor Formulas, NoSQL Sanitizer,
                    │  & Clinical Benchmarks  │  HMAC Signatures, 40-Profile Safety Gates
                    └─────────────────────────┘
```

---

## 2. Test Suites Inventory

| Test Suite | File Location | Tests | Scope & Assertions |
| :--- | :--- | :---: | :--- |
| **API & Auth** | [`backend/tests/api.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/api.test.js) | 13 | Lead submission, phone regex, JWT login, protected route rejection |
| **AI Optimizations** | [`backend/tests/ai-optimizations.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/ai-optimizations.test.js) | 37 | FAQ LRU cache, intent routing, prompt injection, feedback collection |
| **Membership & Access** | [`backend/tests/membership-access.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/membership-access.test.js) | 26 | Face enrolment, evaluation rules, payment pending/block handling |
| **Door Hardware** | [`backend/tests/door-hardware.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/door-hardware.test.js) | 21 | HMAC signing, replay attacks, freshness windows, lockdown overrides |
| **Fitness Formulas** | [`backend/tests/fitness-formulas.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/fitness-formulas.test.js) | 14 | BMR, TDEE, macro bounds, under-18 calorie suppression |
| **Fitness Pipeline** | [`backend/tests/fitness-plan-pipeline.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/fitness-plan-pipeline.test.js) | 10 | Plan creation, catalogs, trainer review requests, rating submissions |
| **Security Hardening** | [`backend/tests/security-hardening.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/security-hardening.test.js) | 8 | NoSQL sanitization, safe regex escaping, query token rejection, PII logs |
| **Resilience & Bulkhead**| [`backend/tests/resilience-isolation.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/resilience-isolation.test.js) | 8 | Door bulkhead isolation, 503 fail-closed security, payment idempotency |
| **Performance & Cache** | [`backend/tests/performance-scalability.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/performance-scalability.test.js) | 6 | Redis cache fallback, Gemini 429 circuit breaker trips |
| **Observability** | [`backend/tests/observability.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/observability.test.js) | 6 | `X-Request-Id` tracing, `/metrics` Prometheus and JSON format |

---

## 3. How to Execute Tests

```bash
# 1. Run full backend unit and integration test suite
npm run backend:test

# 2. Run clinical diet & workout evaluation benchmark (40 profiles)
npm run test:eval

# 3. Run production build & strict TypeScript compilation
npm run build

# 4. Run static linter (Oxlint)
npm run lint

# 5. Run mobile viewport automation QA (Playwright)
node scripts/mobileQa.js

# 6. Run staging concurrency load test simulation
node backend/scripts/loadTestSimulation.js
```
