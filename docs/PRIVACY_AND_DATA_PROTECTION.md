# 📜 ROAR EXTREME — Privacy & India Data Protection Assessment

**Legislative Framework:** Digital Personal Data Protection (DPDP) Act, 2023 & Draft DPDP Rules, 2025  
**Accessibility Standard:** WCAG 2.2 Level AA  
**Data Fiduciary:** ROAR EXTREME Performance Studio (Nashik, Maharashtra)  
**Status:** Technical Safeguards Implemented; Legal & Physical Review Documented  

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

## 3. WCAG 2.2 Level AA Accessibility Gap Assessment

| WCAG Criteria | Level | Implementation in ROAR EXTREME | Audit Status |
| :--- | :---: | :--- | :---: |
| **1.4.3 Contrast (Minimum)** | AA | Brand orange (`#FF5A1F`) on dark `#080808` achieves 4.7:1 contrast ratio; white text achieves 18.5:1 ratio. | **VERIFIED** |
| **2.1.1 Keyboard Accessible** | A | All modal dialogs, lead booking inputs, and navbar links navigable via Tab / Shift+Tab keys. | **VERIFIED** |
| **2.4.7 Focus Visible** | AA | Standard Tailwind ring focus indicators preserved on all interactive form inputs and buttons. | **VERIFIED** |
| **2.5.8 Target Size (Minimum)** | AA | All interactive touch elements (close buttons, voice mic button, chips) enforce minimum 44×44px bounding boxes. | **VERIFIED** |
| **1.3.1 Info and Relationships** | A | Form inputs paired with semantic `<label>` elements and descriptive validation error containers. | **VERIFIED** |
| **1.4.12 Text Spacing** | AA | Tested across mobile viewports (320px–430px) with zero text truncation or overlapping headers. | **VERIFIED** |
| **Screen Reader Announcement** | AA | Dynamic chat messages and live attendance states use ARIA live regions for assistive technologies. | **PARTIALLY VERIFIED** |

---

## 4. DPDP Act & Rules Operational Gap Assessment

| Regulatory Dimension | Requirement Under DPDP 2023 | Current Implementation | Action Required by Gym Management |
| :--- | :--- | :--- | :--- |
| **Notice in 22 Languages** | Section 5(1): Privacy notice available in English and 22 Eighth Schedule languages | English, Hindi (हिंदी), and Marathi (मराठी) supported in AI Coach and notices | **LEGAL REVIEW**: Approve regional Marathi & Hindi text translations. |
| **Grievance Redressal** | Section 12: Contact mechanism for personal data complaints | Contact form and studio phone number provided | **OPERATIONAL ACTION**: Officially designate and publish the Data Protection Officer (DPO) name and email. |
| **Parental Consent** | Section 9: Verifiable consent of parent/guardian for processing minors (<18 years) | Automated clinical plans completely disable caloric restriction targets for users under 18 | **LEGAL REVIEW**: Establish physical paper parental consent process for minor gym memberships. |
| **Non-Biometric Alternative** | Section 6: Biometric consent cannot be conditioned as sole access method | Receptionist manual check-in endpoint (`POST /api/admin/attendance/manual`) exists | **OPERATIONAL ACTION**: Standard Operating Procedure (SOP) providing keycard or manual sign-in for members opting out of face scans. |
