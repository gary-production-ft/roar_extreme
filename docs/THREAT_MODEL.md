# 🛡️ ROAR EXTREME — STRIDE Threat Model & Attack Surface Analysis

**Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)  
**System Scope:** Web Client, Express Backend, MongoDB Atlas, AI LLM Service, and ESP32 Physical Turnstiles  

---

## 1. Asset Classification

| Asset | Sensitivity | Primary Threat | Storage & In-Transit Protection |
| :--- | :---: | :--- | :--- |
| **Facial Descriptors (128d vectors)** | **CRITICAL** | Identity theft, biometric leakage | AES-256-GCM encryption at rest; TLS 1.3 in transit; never logged |
| **Physical Turnstile Barrier** | **CRITICAL** | Unauthorized entry, trap hazard | HMAC-SHA256 signing, fail-closed access, mechanical series exit |
| **Payment Records & Receipts** | **HIGH** | Financial tampering, double-charging | `idempotencyKey` guard, server-side price validation |
| **Member Phone & Contact PII** | **HIGH** | Spam, privacy violation | DPDP log scrubbing, strict RBAC authorization |
| **Gemini API Key & Quotas** | **MEDIUM** | Cost drain, quota exhaustion | Backend-only proxying, 3-state circuit breaker |

---

## 2. STRIDE Threat Analysis

### 2.1 Spoofing (Identity Deception)
* **Threat:** Malicious actor presents a printed photo or smartphone selfie to the kiosk camera.
  - **Mitigation:** Kiosk runs dynamic blink and yaw-rotation challenges via `@vladmandic/face-api`.
  - **Residual Risk:** Heuristic liveness is not 100% immune to 3D masks or advanced deepfake displays.
  - **Recommendation:** Pair with front-desk staff oversight or dual-factor PIN for suspicious scans.
* **Threat:** Attacker spoofs an unlock command packet to the turnstile controller.
  - **Mitigation:** Unlock commands are signed with HMAC-SHA256 (`LOCK_DEVICE_SECRET`). ESP32 discards any command lacking a valid cryptographic signature.

### 2.2 Tampering (Data Manipulation)
* **Threat:** Attacker modifies the timestamp or nonce in an unlock packet.
  - **Mitigation:** The payload is verified against the HMAC digest. Any single-byte modification invalidates the signature.
* **Threat:** Attacker submits MongoDB query operators (`$gt`, `$ne`) in JSON body to bypass auth.
  - **Mitigation:** `sanitize.js` recursively strips all `$`-keys before the payload reaches controllers or Mongoose.

### 2.3 Repudiation (Disavowal of Actions)
* **Threat:** Front desk staff manually unlocks the door and denies performing the action.
  - **Mitigation:** Manual unlock endpoint (`POST /api/admin/doors/:id/unlock`) mandates a `reason` parameter and permanently records the administrator ID in `DoorEvent`.

### 2.4 Information Disclosure (Data Leakage)
* **Threat:** Sensitive facial descriptors or phone numbers leak into server logs or exception traces.
  - **Mitigation:** Winston logger scrubbed with DPDP regex replacers in [`logger.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/utils/logger.js) masking 10-digit Indian numbers and float arrays.
* **Threat:** Stack traces exposed to users during production crashes.
  - **Mitigation:** `errorHandler.js` intercepts all uncaught errors, logging details internally while returning generic error messages in production.

### 2.5 Denial of Service (Service Disruption)
* **Threat:** Public chat flooding exhausts API connections, locking out gym members at the door.
  - **Mitigation:** **Bulkhead isolation**: `/api/access/verify` and health routes are exempted from global rate limits.
* **Threat:** Repeated 429 quota errors from Gemini cascade into backend hangs.
  - **Mitigation:** 3-state circuit breaker trips immediately on HTTP 429, switching traffic to rule-based fallback.

### 2.6 Elevation of Privilege (Unauthorized Access)
* **Threat:** Receptionist or trainer attempts to access owner-only functions (freeze, block, emergency lockdown).
  - **Mitigation:** Route-level middleware (`authorize('owner')`) enforces strict role verification on sensitive endpoints.
