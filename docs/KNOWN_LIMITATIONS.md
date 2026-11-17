# ⚠️ ROAR EXTREME — Known Limitations & External Blockers

**Document Version:** 1.0  
**Last Updated:** November 18, 2026  

This document provides a transparent record of existing technical limitations, simulated components, and external human dependencies in the ROAR EXTREME codebase:

---

## 1. Physical Hardware Commissioning (Blocker)

* **Current Status:** Tested via virtual software simulation ([`scripts/simulateLockDevice.js`](file:///d:/projects%20webdeveloper/roar%20fitness/scripts/simulateLockDevice.js)).
* **Limitation:** The physical installation of the ESP32 microcontroller, 12V 280kg electromagnetic lock, optocoupler relay module, and reverse-biased **1N4007 flyback diode** on the 6th-floor rooftop door in Nashik, Maharashtra cannot be performed via software code.
* **Required Action:** On-site electrical technician must follow the wiring schematic in [`README.md`](file:///d:/projects%20webdeveloper/roar%20fitness/README.md) and execute the 11-step commissioning checklist before live physical turnstile entry is activated.

---

## 2. Transactional Email Delivery (Mocked)

* **Current Status:** In-process mock logger.
* **Limitation:** In `backend/.env`, `RESEND_API_KEY` is currently unset. Transactional confirmation emails for free pass reservations and trainer reviews are logged to the console/disk rather than being delivered to external mailboxes.
* **Required Action:** Provision a paid or verified Resend, SendGrid, or AWS SES API key and set `RESEND_API_KEY` in production environment variables.

---

## 3. MongoDB Atlas Free Tier (M0) Connection Ceilings

* **Current Status:** Compatible with local development and small tests.
* **Limitation:** MongoDB Atlas M0 Free clusters limit simultaneous connections to **100**. At the target peak concurrency of 1,500 active users (300 RPS), M0 will reject connection attempts.
* **Required Action:** Studio owners must upgrade to MongoDB Atlas M10 ($57/month, 1,500 connection limit) before public launch.

---

## 4. Google AI Studio Free Tier Quota Limits

* **Current Status:** API key active for development.
* **Limitation:** Free tier Gemini API keys are throttled to 15 Requests Per Minute (RPM). While our sub-15ms Intent Router deflects ~40% of conversational volume, peak gym chat surges could trip the circuit breaker frequently.
* **Required Action:** Attach a billing card in Google Cloud Console / Google AI Studio to upgrade the key to Tier 1 Pay-As-You-Go (360 RPM).

---

## 5. Anti-Spoofing Liveness Constraints

* **Current Status:** Heuristic blink and yaw-rotation challenges via `@vladmandic/face-api`.
* **Limitation:** Software-only 2D RGB camera liveness detection cannot detect sophisticated 3D silicone masks or high-resolution infrared screen attacks.
* **Required Action:** High-security physical turnstile installations should be paired with front desk receptionist visual oversight.
