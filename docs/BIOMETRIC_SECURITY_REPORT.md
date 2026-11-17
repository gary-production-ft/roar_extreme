# 👁️ ROAR EXTREME — Biometric Security & Physical Turnstile Safety Assessment

**System Scope:** Facial Recognition Kiosk (`/kiosk`), WebGL Feature Extractor, AES-256-GCM Template Store, and ESP32 Physical Turnstile Controller  
**Assessment Date:** November 18, 2026  
**Auditor:** Application Security & Hardware SRE  

---

## 1. Biometric Pipeline Technical Assessment

```
[Webcam Stream (640x480)]
       │
       ▼ (Client-Side WASM / WebGL Only)
[Face Detection & Landmark Mesh] ──> [Anti-Spoof Heuristic (Blink/Yaw)]
       │
       ▼ (128-float Descriptor Extracted)
[Numerical Embedding Array]  (Raw Video Stream Promptly Destroyed)
       │
       ▼ HTTPS POST /api/access/verify (x-device-key: kiosk-main)
[Express 4.21 Backend]
       │
       ▼ (Decryption via FACE_ENCRYPTION_KEY)
[AES-256-GCM Encrypted Face Templates in MongoDB]
       │
       ▼ (Euclidean Distance Matching: Threshold ≤ 0.45)
[evaluateAccess Policy Checks: Hours, Active Date, Paid Status, Freeze Flag]
       │
       ├─ If Granted ──> Signed HMAC-SHA256 Command (5s freshness) ──> ESP32 Hardware
       └─ If Denied  ──> Return 403 Forbidden ──> Kiosk Red Screen ──> Door Remains Locked
```

---

## 2. Security & Safety Evaluation Matrix

| Subsystem Component | Verification Status | Evaluated Guarantee | Evidence |
| :--- | :---: | :--- | :--- |
| **Zero Raw Media Transmission** | **VERIFIED** | Camera frames never leave the client browser. No photos, videos, or raw pixels are sent to the backend or external AI providers. | Code inspection of [`Kiosk.tsx`](file:///d:/projects%20webdeveloper/roar%20fitness/src/pages/Kiosk/Kiosk.tsx). |
| **Template Encryption at Rest** | **VERIFIED** | Enrolled face descriptors (128 floats) are encrypted using AES-256-GCM with unique random IVs and 16-byte authentication tags. | Tested in [`membership-access.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/membership-access.test.js). |
| **Right to Erasure (DPDP)** | **VERIFIED** | Biometric templates can be permanently purged on request via `DELETE /api/members/:id/face`. | Tested in [`membership-access.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/membership-access.test.js). |
| **Replay & Freshness Defense** | **VERIFIED** | HMAC-SHA256 signature calculated over timestamp, doorId, and nonce. Commands expire in 5 seconds. Replayed nonces are rejected. | Tested in [`door-hardware.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/door-hardware.test.js). |
| **Fail-Closed Physical Security** | **VERIFIED** | If the backend, database, or network fails, turnstile access returns HTTP 503 `service_unavailable`, keeping the exterior maglock energized and locked. | Tested in [`resilience-isolation.test.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/tests/resilience-isolation.test.js). |
| **Anti-Spoofing Spoof Resistance** | **PARTIALLY VERIFIED** | Software checks for active eye blink and horizontal head yaw rotation. Rejects basic static photos. **Cannot detect 3D silicone masks or high-resolution infrared screen attacks.** | Verified in browser testing. Physical IR liveness required for mission-critical security. |
| **Rooftop Life Safety Egress** | **VERIFIED** (Design) | Interior mechanical Push-to-Exit crash bar cuts 12V power directly in series. Does not rely on microcontrollers, network, or cloud uptime for rooftop fire exit. | Schematic verified in [`README.md`](file:///d:/projects%20webdeveloper/roar%20fitness/README.md). |
| **Physical Hardware Commissioning** | **BLOCKED** | On-site physical wiring of the 12V 280kg Maglock and 1N4007 flyback diode at the Nashik rooftop studio requires on-site electrical technician. | Documented as external physical blocker. |

---

## 3. High-Risk Vulnerabilities & Recommendations

1. **2D Camera Spoofing Risk:**
   - Heuristic liveness (blink and head turn) is a software-level check. It must not be advertised as certified anti-spoof biometric hardware.
   - **Recommendation:** Kiosk turnstile should be located within direct line-of-sight of the front desk receptionist.
2. **Local Key Storage:**
   - `FACE_ENCRYPTION_KEY` must never be shared across environments or committed to repository files. In production, rotate keys via Render environment settings.
