# 📜 ROAR EXTREME — Privacy & India Data Protection Assessment

**Legislative Framework:** Digital Personal Data Protection (DPDP) Act, 2023 & Draft DPDP Rules, 2025  
**Data Fiduciary:** ROAR EXTREME Performance Studio (Nashik, Maharashtra)  
**Status:** Technical Safeguards Implemented (Requires Formal Legal Sign-Off)  

---

## 1. Personal Data Inventory & Data Mapping

| Data Category | Data Elements Processed | Purpose of Processing | Retention Period | Storage & Encryption |
| :--- | :--- | :--- | :--- | :--- |
| **Member Identity** | Full name, 10-digit mobile number, email | Membership issuance, emergency contact | Active duration + 1 year | MongoDB Atlas (Restricted RBAC) |
| **Biometric Data** | 128-dimensional facial embeddings | Hands-free facility access control | Membership duration (or until consent withdrawal) | AES-256-GCM encrypted in MongoDB |
| **Raw Media** | Live webcam video stream | Local face detection & liveness challenge | **Zero Retention** | Processed in volatile RAM / WebGL; never written to disk |
| **Access Telemetry**| Door scan timestamp, decision, door ID | Security, attendance tracking | 180 days | MongoDB Atlas (Audited) |
| **Chat Memories** | Fitness goals, training preferences | Personalized AI fitness advice | Configurable (default 30–180 days) | MongoDB Atlas (User-erasable) |

---

## 2. Technical Safeguards Implemented

### 2.1 Consent & Purpose Limitation
- **Statutory Enrolment Checkbox:** The face enrolment wizard on `/admin/members` requires explicit digital consent acknowledgment (`1.0-DPDP-2023`) before initializing the webcam.
- **Data Minimization:** No raw images, videos, or photos are ever transmitted across the network or stored in database records. Only the numerical 128-float vector is stored.
- **Third-Party Boundary:** Biometric vectors are **never** shared with or transmitted to Google Gemini, OpenAI, or external analytics services.

### 2.2 Right to Erasure (Data Deletion Workflows)
- **Biometric Erasure:** Studio managers can immediately and permanently delete enrolled facial templates via `DELETE /api/members/:id/face`.
- **Chat & Session Erasure:** Users can erase all stored conversational memory and fitness preferences via `DELETE /api/preferences?sessionId=...`.

### 2.3 PII Log Scrubbing
[`backend/src/utils/logger.js`](file:///d:/projects%20webdeveloper/roar%20fitness/backend/src/utils/logger.js) intercepts all log output and automatically scrubs:
- 10-digit Indian phone numbers (e.g. `+91 98765 43210` ➔ `98******10`).
- Email addresses (e.g. `user@example.com` ➔ `u***@example.com`).
- Biometric float vectors (redacted as `[REDACTED_BIOMETRIC_VECTOR]`).
- JWT and Bearer tokens (redacted as `Bearer [REDACTED_TOKEN]`).

---

## 3. Legal Counsel Advisory & Operational Checklist

> ⚖️ **Important Legal Disclaimer:** While the engineering safeguards described above establish strong data security, a software technical implementation does not constitute formal legal compliance.
>
> Prior to full commercial operation, ROAR EXTREME management must obtain written review from qualified Indian legal counsel regarding:
> 1. Exact wording of the physical studio privacy notice displayed at the 6th-floor rooftop entrance.
> 2. Documented Data Protection Officer (DPO) designation and contact address for member grievance redressal.
> 3. Standard Operating Procedure (SOP) for providing non-biometric physical access (e.g. keycard or manual front desk check-in) upon member request.
