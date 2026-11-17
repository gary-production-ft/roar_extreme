# ROAR EXTREME — SRE & PRODUCTION INCIDENT RUNBOOK

**Target Service**: `roar-extreme-api` (Render / Vercel / MongoDB Atlas)  
**Target Availability**: 99.9% (~43m max downtime/month)  
**Critical Path**: Biometric Door Access & Kiosk (`/api/access/verify` SLA: < 100ms p95)

---

## 1. External Monitoring & Proactive Alerting Setup

We recommend **BetterStack (formerly Better Uptime)** or **UptimeRobot** configured on a 60-second polling interval:

| Setting | Configuration Value | Reason |
| :--- | :--- | :--- |
| **Probe URL** | `https://api.roarextreme.com/health/ready` | Tests true readiness (verifies active MongoDB connection, not just Node process). |
| **HTTP Method** | `GET` | Expects `200 OK` with JSON `status: "ready"`. |
| **Alert Threshold (Availability)** | **3 consecutive failures** (3 mins down) | Prevents flapping/false alarms on transient network blips. |
| **Alert Threshold (Latency SLA)** | **Response Time > 2,000 ms for 2 cycles** | Detects degradation before full outage. |
| **Notification Channels** | SMS / PagerDuty / Telegram Webhook | Immediate dispatch to on-call engineer and gym manager. |
| **Secondary Probe** | `https://api.roarextreme.com/health/live` | Distinguishes whether the Node.js container crashed vs MongoDB Atlas network disconnect. |

---

## 2. Incident Response Runbooks for Top 4 Production Failures

```
+--------------------------------------------------------------------------------------------------+
|                                  INCIDENT TRIAGE MATRIX                                          |
+--------------------------------------------------------------------------------------------------+
| (1) Render Cold Start Exceeds 2s Door Budget     ──► Warm-up cron / Upgrade to Render Starter    |
| (2) Gemini AI Quota Exceeded (HTTP 429)         ──► Circuit breaker auto-routes to OpenAI/Rules  |
| (3) MongoDB Atlas Connection Limit Exhausted    ──► Scale pool, terminate idle leak, upgrade M10 |
| (4) ESP32 Rooftop Controller Power/Wi-Fi Loss   ──► Fail-secure lock, manual keypad / desk key   |
+--------------------------------------------------------------------------------------------------+
```

---

### Incident 1: Render Cold Start Exceeds 2-Second Door Unlock Latency Budget

* **Symptoms**:
  - Member stands at 6th-floor rooftop kiosk; first morning verification takes 15–30 seconds.
  - BetterStack reports latency alert `> 2,000ms`.
  - Winston logs show high initialization duration during container boot.
* **Root Cause**:
  - Render Free Tier spins down containers after 15 minutes of idle traffic. A cold spin-up takes 12–25 seconds to download image, run Node, and establish Atlas TLS sockets.
* **Immediate Mitigation (0–5 Minutes)**:
  1. Trigger manual health probe: `curl -I https://api.roarextreme.com/health/ready` to wake container.
  2. Front desk receptionist activates manual entry via Admin Dashboard: `/admin/doors` -> Click "Manual Unlock" (or uses physical RFID/override key).
* **Permanent Remediation**:
  1. **Production Tier Upgrade**: Switch Render API service from **Free** to **Individual / Starter ($7/month)**. Render Starter never sleeps and keeps process memory warm 24/7.
  2. **Automated Keep-Alive Ping**: If on Free tier during staging, configure a 5-minute HTTP cron job (via UptimeRobot or cron-job.org) hitting `/health/live` to prevent spin-down during operating hours (06:00 to 22:00 IST).

---

### Incident 2: Gemini AI Quota Exceeded During Marketing Campaign

* **Symptoms**:
  - Chatbot responds with deterministic rule answers or OpenAI answers instead of Gemini.
  - Logs show: `[CIRCUIT_BREAKER] Gemini circuit tripped to OPEN. Bypassing Gemini for 30s.`
  - HTTP 429 `RESOURCE_EXHAUSTED` returned from Google GenAI API.
* **Automated Resilience (Already in Code)**:
  - The built-in `geminiCircuitBreaker` trips to `OPEN` on the first 429 response.
  - Incoming messages immediately bypass Gemini (< 50ms) and route to OpenAI `gpt-4o-mini`, or grounded rules if OpenAI is also unavailable.
  - **The gym access system is completely isolated and experiences 0 impact.**
* **Remediation Steps**:
  1. Open [Google Cloud Console](https://console.cloud.google.com/) -> APIs & Services -> Gemini API -> Quotas.
  2. Verify if billing is enabled on Google AI Studio / Vertex AI project (upgrade from Free 15 RPM to Pay-As-You-Go Tier 1 with 360–1,000 RPM).
  3. If spending cap was hit, raise the daily budget threshold in GCP Billing.
  4. Once quota is increased, the circuit breaker automatically tests recovery every 30 seconds (`HALF_OPEN`) and restores Gemini traffic with zero server restarts.

---

### Incident 3: MongoDB Atlas Connection Limit Exhausted

* **Symptoms**:
  - Logs show `MongoServerSelectionError: connection <monitor> to ...:27017 closed` or `pool size exceeded`.
  - `/health/ready` returns `503 Service Unavailable` with `status: "unready"`.
  - Admin dashboard and access logs fail to load.
* **Root Cause**:
  - Free Tier M0 Atlas cluster has a hard cap of 100 concurrent TCP connections. If multiple API instances spin up or connections leak, Atlas rejects new handshakes.
* **Immediate Mitigation (0–5 Minutes)**:
  1. Login to MongoDB Atlas Console -> Metrics -> Network Connections.
  2. If connections are near 100, restart Render web service container to instantly drop leaked socket pool.
  3. Verify connection pool ceiling in backend env: `DB_MAX_POOL_SIZE=30`.
* **Permanent Remediation**:
  1. Upgrade to **Atlas M10 Dedicated Tier** ($57/mo). M10 provides:
     - 1,500 simultaneous connection cap.
     - Dedicated vCPU & RAM.
     - Burst IOPS up to 3,000.
  2. Verify that Mongoose queries use `.lean()` (already implemented across all listing endpoints) to prevent memory bloating.

---

### Incident 4: ESP32 Lock Controller Loses Wi-Fi or Power (6th Floor Rooftop)

* **Symptoms**:
  - Admin Dashboard `/admin/doors` flags door status: `offline` (red indicator).
  - Background sweep logs: `[DEVICE SWEEP] Marked lock-device-01 offline due to missed heartbeats (> 45s)`.
  - Kiosk displays `Access Granted` on screen, but electromagnetic lock does not actuate.
* **Hardware Safety Guarantee (Fail-Secure / Fail-Safe Physical Route)**:
  - **Fire Exit Route Compliance**: The rooftop exit door features a physical push mechanical crash bar (panic bar) on the interior. Trainees can ALWAYS exit mechanically without electrical power or server connection.
  - **Default Power State**: In the event of 12V DC power failure, the electromagnetic lock drops magnetic hold (fail-safe for rooftop fire exit) or electric strike defaults to locked from exterior.
* **Immediate Mitigation (0–5 Minutes)**:
  1. Front desk receptionist takes physical brass override key to unlock staircase rooftop access door.
  2. Check rooftop Wi-Fi AP: Verify that the Canada Corner 5GHz/2.4GHz Wi-Fi extender on the 6th floor has power.
  3. Power-cycle the ESP32 enclosure via the 12V 2A DC supply reset switch located inside the reception security cabinet.
  4. Once ESP32 boots, it establishes TLS connection to MQTT broker within 4 seconds and publishes a `heartbeat`, automatically clearing the offline flag in MongoDB.
