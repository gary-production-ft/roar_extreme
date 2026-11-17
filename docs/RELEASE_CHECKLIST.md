# 🚀 ROAR EXTREME — Production Release Checklist

Every commercial production release must satisfy all 10 verification gates prior to deployment:

---

## 1. Pre-Deployment Verification Gates

- [ ] **Gate 1: Static Code Quality**
  - Run: `npm run lint` (`oxlint`).
  - Standard: **0 errors, 0 warnings**.
- [ ] **Gate 2: Type Checking & Production Build**
  - Run: `npm run build` (`tsc -b && vite build`).
  - Standard: Zero TypeScript compilation errors; chunk bundles under limits.
- [ ] **Gate 3: Automated Unit & Integration Tests**
  - Run: `npm run backend:test`.
  - Standard: **143 / 143 tests passing (100%)**.
- [ ] **Gate 4: Clinical Diet & Workout Evals**
  - Run: `npm run test:eval`.
  - Standard: **40 / 40 profiles passing (100%)** with zero allergen or medical safety leaks.
- [ ] **Gate 5: Mobile Viewport QA**
  - Run: `node scripts/mobileQa.js`.
  - Standard: Responsive across 320px–1280px with zero horizontal layout overflow.
- [ ] **Gate 6: Secret Scanning Check**
  - Ensure `.env` is omitted from version control.
  - Verify that `JWT_SECRET`, `FACE_ENCRYPTION_KEY`, and `LOCK_DEVICE_SECRET` have been freshly generated and stored in host environment variables.
- [ ] **Gate 7: Database Migration & Index Verification**
  - Run: `node backend/scripts/verifyQueryIndexes.js`.
  - Standard: All 5 hot collection query paths confirm `IXSCAN` usage (zero `COLLSCAN`s).
- [ ] **Gate 8: Staging Load & Concurrency Check**
  - Run: `node backend/scripts/loadTestSimulation.js` (or `k6 run docs/performance/load-test-k6.js`).
  - Standard: Error rate `< 0.1%` under concurrent load; door bulkhead intact.
- [ ] **Gate 9: Health Probe Verification**
  - Verify `GET /health/live` returns HTTP 200.
  - Verify `GET /health/ready` returns HTTP 200 with database connected.
- [ ] **Gate 10: Rollback Readiness**
  - Previous stable container tag or commit hash recorded and verified ready for instant redeploy.

---

## 2. Emergency Rollback Procedure

If severe post-deployment anomalies arise (e.g. door lock failure, elevated 5xx error rate > 1%):

1. **Revert Git Commit / Deployment:**
   - In Render Dashboard: Click **Deploys** ➔ Select previous passing deploy ➔ Click **Rollback**.
   - In Vercel Dashboard: Select previous production deployment ➔ Click **Promote to Production**.
2. **Engage Studio Manual Access:**
   - If turnstiles fail to actuate, front desk must use physical mechanical brass key override or engage push-to-exit bypass.
3. **Notify SRE Lead & Review Runbook:**
   - Follow triage procedures documented in [`docs/SRE-RUNBOOK.md`](file:///d:/projects%20webdeveloper/roar%20fitness/docs/SRE-RUNBOOK.md).
