# ROAR EXTREME — Operations & Runbooks

**Date:** 18 November 2026  
**Audience:** Site Reliability Engineers, DevOps, Operations Leads, System Administrators  
**Classification:** Standard Operating Procedures (SOP)  
**Status:** PROVEN (Local & Staging Procedures Verified)

---

## 1. Architecture & Operational Topology

ROAR EXTREME runs as a decoupled architecture:
1. **Frontend Edge**: Vercel Global Edge Network hosting static SPA assets (React 19 / Vite / Tailwind).
2. **Stateless API Tier**: Render Web Service (`starter` or `standard` container running Node.js 24 LTS).
3. **Database Cluster**: MongoDB Atlas Replica Set (Primary + 2 Secondary replica nodes with automated continuous backup).
4. **Cache & Coordination Tier**: Redis (Upstash Serverless or Redis Cloud instance for atomic sliding-window rate limits, session caches, and distributed locks).
5. **Edge Hardware**: ESP32 microcontroller with W5500 Ethernet shield on the 6th-floor rooftop gym entrance.

---

## 2. Deployment Runbook

### 2.1 Staging Deployment
- **Trigger**: Push or merge to branch `staging` or pull requests targeting `main`.
- **Pre-flight Checks** (Automated in CI):
  1. `npm run lint` — Oxlint zero-error verification across 181+ files.
  2. `npm run build` — TypeScript strict typecheck & Vite bundle compilation.
  3. `npm test --prefix backend` — 143 unit & integration tests passed.
  4. `npm run test:eval` — 40/40 clinical safety & diet/workout evaluations passed.
- **Execution**:
  - Frontend: Automated Vercel preview deployment.
  - Backend: Automated Render staging container deployment (`git push origin staging`).

### 2.2 Production Deployment (Zero-Downtime Rolling Release)
- **Trigger**: Tagged release `v*.*.*` or merge to `main`.
- **Step-by-step Procedure**:
  1. **Notify On-Call**: Announce maintenance or deployment window in the operations channel.
  2. **Audit Git Status**: Ensure working tree is clean and CI checks are 100% green.
  3. **Verify Environment Variables**: Confirm all required production secrets are set on Render & Vercel.
     *The backend fails fast on startup (`process.exit(1)`) if `JWT_SECRET`, `FACE_ENCRYPTION_KEY`, `LOCK_DEVICE_SECRET`, or `MONGO_URI` are missing or default.*
  4. **Deploy Backend First**:
     - Render executes rolling replacement: new container health checks (`GET /api/health`) must return HTTP 200 before old container is drained.
  5. **Deploy Frontend**:
     - Vercel updates DNS/Edge routing atomically to new immutable build hash.
  6. **Post-Deploy Smoke Test**:
     - `GET https://<api-domain>/api/health` -> HTTP 200 `{ status: "ok" }`.
     - `GET https://<api-domain>/api/catalog/memberships` -> HTTP 200.
     - Login via Admin portal with 2FA / Session verification.

---

## 3. Rollback Runbook

### 3.1 Instant Frontend Rollback (< 60 Seconds)
1. Navigate to Vercel Dashboard -> Deployments.
2. Identify previous healthy production deployment.
3. Click `...` -> **Promote to Production**. Instant edge DNS cutover occurs without rebuild.

### 3.2 Backend Rollback (< 3 Minutes)
1. Navigate to Render Dashboard -> Backend Service -> Deploys.
2. Select previous known healthy commit hash or deploy ID.
3. Click **Rollback to this deploy**.
4. Monitor deploy logs for successful boot message:
   ```
   [BOOT] ROAR EXTREME API running on port 5000 in production mode.
   [HEALTH] Database connected successfully.
   ```
5. If rollback was due to database migration or schema error:
   - Check `backend/src/models/` for backward-compatible schema definitions. Mongoose schema fields are additive and default-safe.

---

## 4. Secret & Key Rotation Runbook

### 4.1 JWT Secret (`JWT_SECRET`)
- **Impact**: All active administrative and member sessions will be invalidated immediately. Users will need to re-authenticate.
- **Frequency**: Every 90 days or immediately upon suspected breach.
- **Procedure**:
  1. Generate high-entropy 256-bit string:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
  2. Update `JWT_SECRET` in Render Environment Settings.
  3. Trigger rolling restart.
  4. Notify gym reception and admin users that a re-login is required.

### 4.2 Biometric Face Encryption Key (`FACE_ENCRYPTION_KEY`)
- **Impact**: CRITICAL. If changed without re-encrypting existing database vectors, all stored facial embeddings become unreadable.
- **Procedure for Re-encryption Migration**:
  1. Set `FACE_ENCRYPTION_KEY_OLD=<current_key>` and `FACE_ENCRYPTION_KEY_NEW=<new_key>` in environment.
  2. Run migration script (dry-run first):
     ```bash
     node backend/scripts/rotateFaceKeys.js --dry-run
     node backend/scripts/rotateFaceKeys.js --execute
     ```
  3. Promote `FACE_ENCRYPTION_KEY_NEW` to `FACE_ENCRYPTION_KEY`. Remove `_OLD` variable.
  4. Restart API containers.

### 4.3 ESP32 Lock Secret (`LOCK_DEVICE_SECRET`)
- **Impact**: Hardware turnstile will reject unlock commands until ESP32 firmware is updated with matching HMAC secret.
- **Procedure**:
  1. Generate new 32-character hex secret.
  2. Flash or OTA update ESP32 firmware config with new `LOCK_DEVICE_SECRET`.
  3. Update Render environment variable `LOCK_DEVICE_SECRET`.
  4. Test physical door unlock command via kiosk admin panel.

---

## 5. Incident Response & Emergency Procedures

### 5.1 Severity Levels
- **SEV-1 (Critical)**: Turnstile door lock failure (trapping users or locking out members), complete API outage, or active data breach.
- **SEV-2 (Major)**: AI chatbot failing, lead reservation failing, or admin dashboard unreachable.
- **SEV-3 (Minor)**: Slow response times (> 2s), non-critical frontend visual defect.

### 5.2 SEV-1 Hardware Lockout Emergency Procedure (Physical Fail-Safe)
> [!IMPORTANT]
> The physical turnstile/maglock MUST ALWAYS be wired **Fail-Safe (Normally Closed)**.
> In the event of a power outage, software crash, network partition, or emergency:
> 1. Actuate the mechanical **Break-Glass Emergency Release** located next to the rooftop entrance door.
> 2. This physically cuts the 12V DC power circuit to the maglock, dropping holding force instantly without software dependency.
> 3. An emergency NC push-to-exit crash bar is wired in series on the interior egress path.

---

## 6. Kill-Switch & Feature Flag Operator Guide

ROAR EXTREME includes runtime and environment-level kill-switches to isolate degrading subsystems without taking down the core gym portal.

| Flag / Env Variable | Default (Prod) | Purpose | Operational Action |
| :--- | :--- | :--- | :--- |
| `ENABLE_DOOR_CONTROL` | `false` | Protects physical turnstile from unverified automation. | Set `true` only after on-site physical commissioning is complete. |
| `ENABLE_FACE_ACCESS` | `false` | Disables biometric facial scanning endpoints. | Set `true` only after DPDP biometric consent legal review and audit sign-off. |
| `ENABLE_CHATBOT` | `true` | Controls AI conversational fitness coach (`/api/chat`). | Set `false` if Gemini/OpenAI API costs spike or provider suffers major outage. Returns HTTP 503 with friendly fallback. |
| `ENABLE_PLAN_ENGINE` | `true` | Controls AI workout & diet plan generator (`/api/fitness-plans`). | Set `false` during AI quota limits. Returns HTTP 503 directing members to certified trainer on deck. |

To toggle any kill-switch:
1. Render Dashboard -> Environment.
2. Toggle variable value (e.g., `ENABLE_CHATBOT=false`).
3. Save changes. Container automatically restarts within 30 seconds with feature safely isolated.

---

## 7. Backup and Disaster Recovery Runbook

### 7.1 Recovery Point Objective (RPO) and Recovery Time Objective (RTO)
- **RPO**: < 1 hour (Atlas Continuous Backups & Oplog Point-in-Time recovery).
- **RTO**: < 30 minutes to spin up replica backend on alternative cloud container or restore database snapshot.

### 7.2 MongoDB Atlas Restore Procedure
> [!NOTE]
> Testing a live production restore drill against MongoDB Atlas requires a separate staging cluster to avoid wiping active member records.
> **Status:** Local dump/restore verification PROVEN; Atlas Cloud restore drill PARTIAL / BLOCKED pending dedicated restoration staging cluster.

**Local / Self-Hosted Dump & Restore Commands**:
```bash
# Backup production database
mongodump --uri="mongodb+srv://<user>:<password>@cluster.mongodb.net/roar_extreme" --out="./backup_$(date +%Y%m%d)"

# Restore to local or disaster recovery cluster
mongorestore --uri="mongodb://localhost:27017/roar_extreme_dr" "./backup_$(date +%Y%m%d)/roar_extreme"
```

### 7.3 Disaster Scenario Checklist
1. **Render Outage**:
   - Docker image is standard Node.js LTS. Run container on AWS ECS, DigitalOcean App Platform, or Railway using the same environment variables.
2. **MongoDB Atlas Outage**:
   - Atlas multi-region failover handles node loss automatically. In catastrophic region failure, restore point-in-time snapshot to standby region cluster and update `MONGO_URI`.
3. **Gemini / OpenAI Total Outage**:
   - System automatically degrades gracefully to Deterministic Grounded Rules Engine (17 core intents handled without LLM).
   - If required, toggle `ENABLE_CHATBOT=false` until upstream LLM service recovers.
