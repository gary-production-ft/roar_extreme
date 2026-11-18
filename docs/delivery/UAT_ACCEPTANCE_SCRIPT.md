# ROAR EXTREME — User Acceptance Testing (UAT) Script & Handoff Guide

**Release Candidate:** v1.0.0  
**Date:** 18 November 2026  
**Audience:** Gym Owners, Stakeholders, QA Auditors, Project Delivery Leads  
**Classification:** Client Acceptance Protocol  

---

## 1. User Acceptance Testing (UAT) Execution Script

Execute each test case in sequence on the staging environment (`https://staging.roarextreme.in` or local staging container). Check off each step upon successful completion.

### Scenario 1: Visitor Trial Booking & Reference Verification
- [ ] **1.1**: Open home page in desktop and mobile viewports. Confirm rooftop aesthetic, hero banner, and video/images load smoothly.
- [ ] **1.2**: Click **Book Free Trial**. Form opens with fields for Name, Phone, Email, Fitness Goal, and Preferred Slot.
- [ ] **1.3**: Enter invalid phone number (e.g., `12345`). Click Submit. Verify validation error appears preventing submission.
- [ ] **1.4**: Enter valid details (e.g., `Rahul Sharma`, `9876543210`, `Weight Loss`, `Morning Sunset`).
- [ ] **1.5**: Click Submit. Verify immediate success modal displays with unique Reference Code (e.g., `ROAR-TRIAL-89412`) and **Copy Code** button.

### Scenario 2: Admin Portal Login & Lead Management
- [ ] **2.1**: Navigate to `/login`.
- [ ] **2.2**: Log in with authorized admin credentials. Verify secure redirection to Admin Dashboard.
- [ ] **2.3**: Check browser cookie jar: confirm session cookie is set with `httpOnly: true` and `SameSite: Lax`.
- [ ] **2.4**: Navigate to the **Leads** tab. Verify Rahul Sharma's reservation appears at the top of the list with status `Pending`.
- [ ] **2.5**: Click **Convert to Member**. Select membership tier (e.g., `Quarterly Rooftop Pass`).
- [ ] **2.6**: Verify lead is moved to the **Members** tab and assigned an active membership status.

### Scenario 3: AI Conversational Coach & Intent Router
- [ ] **3.1**: Open AI Chatbot widget on the bottom right of the screen.
- [ ] **3.2**: Send query: *"What are your gym timings?"*.
- [ ] **3.3**: Verify response is instantaneous (< 100ms) with studio hours (05:00 AM – 10:00 PM IST) handled by the regex router.
- [ ] **3.4**: Send fitness advisory query: *"I want to build shoulder strength without straining my rotator cuff"*.
- [ ] **3.5**: Verify AI provides accurate, injury-safe exercises with proper warm-up instructions.
- [ ] **3.6**: Send clinical emergency query: *"I have acute chest pain during workouts"*.
- [ ] **3.7**: Verify safety redirect triggers immediately: advises stopping exercise and consulting a physician immediately.

### Scenario 4: Personalized Workout & Diet Engine
- [ ] **4.1**: Navigate to Member Fitness Plan tab.
- [ ] **4.2**: Generate plan for member with `Hypertension` and `Vegetarian`.
- [ ] **4.3**: Verify workout excludes high-risk inverted moves or heavy 1RM testing.
- [ ] **4.4**: Verify nutrition plan has balanced macros, adequate protein, and zero meat/fish options.

### Scenario 5: Attendance & Security Verification
- [ ] **5.1**: From the admin panel, perform manual check-in for an active member. Confirm attendance counter increments in real time.
- [ ] **5.2**: Test check-in for an expired or non-existent member. Verify access denial with reason `Membership Expired`.
- [ ] **5.3**: Verify door bulkhead isolation: ensure door verification API responds in sub-35ms even while generating fitness plans.

---

## 2. Account & Infrastructure Transfer Checklist

All accounts, repositories, and cloud dashboards must be transferred to the client upon final payment and contract acceptance:

| Asset / Service | Current Owner | Handoff Action | Client Action Required |
| :--- | :--- | :--- | :--- |
| **GitHub Repository** | `gary-production-ft` | Invite client GitHub username as Admin; transfer ownership. | Accept repo invitation in GitHub settings. |
| **Vercel Account** | Development Team | Add client email to Vercel Team as Owner. | Add production domain `roarextreme.in` to Vercel DNS. |
| **Render Web Service** | Development Team | Transfer workspace / add client billing card. | Provide corporate billing card for Render service. |
| **MongoDB Atlas** | Development Team | Invite client to Atlas Organization as Project Owner. | Configure production IP access list and update billing. |
| **Resend Email API** | Staging Dev Account | Create production Resend team with client email. | Add DNS SPF/DKIM TXT records for `roarextreme.in`. |
| **Google Gemini API** | Dev Cloud Console | Transfer Google Cloud Project with Billing Account. | Link client payment method to Google Cloud console. |

---

## 3. Support Scope & Maintenance Boundaries

### 3.1 Included in Delivery Package (Warranty Period: 60 Days)
- Bug fixes for any reproducible deviation from the accepted specification.
- Deployment assistance during staging and live launch cutover.
- Environment variable configuration review.
- High-priority security patching for reported zero-day vulnerabilities in dependencies.

### 3.2 Excluded from Standard Scope (Requires Maintenance Retainer)
- Physical hardware cabling, mounting, and structural fabrication on the rooftop.
- Ongoing legal representation or defense under the DPDP Act.
- New feature development or major UI redesigns outside v1.0.0 scope.
- Cloud hosting bills, SMS gateway fees, or LLM token consumption fees payable to third-party vendors.

---

## 4. Known Limitations & Technical Constraints

1. **Biometric Lighting Conditions**:
   - Webcams operating on the 6th-floor rooftop during direct sunset glare or deep night require adequate diffused LED lighting for high facial recognition confidence.
2. **ESP32 Rooftop Weatherproofing**:
   - The hardware controller enclosure must be rated IP65/IP66 to withstand Nashik monsoon rainfall and extreme seasonal heat.
3. **External LLM Latency & Availability**:
   - While the local regex router deflects ~40% of queries with 0ms LLM latency, complex open-ended fitness queries depend on upstream Google Gemini API network response times (typically 800ms – 1800ms).
4. **Legal Approval for Face Biometrics**:
   - The biometric scanning feature flag (`ENABLE_FACE_ACCESS`) must remain disabled until Indian legal counsel completes the DPDP Act review.

---

## 5. Release Notes — v1.0.0

- **Frontend**: Full responsive React 19 SPA, zero horizontal overflow across 320px–1440px viewports, strict CSP with Google Maps iframe support.
- **Backend**: Stateless Node.js 24 LTS Express API, atomic sliding-window rate limiting, Joi schema validation, bcrypt 12-round passwords, httpOnly cookies.
- **AI Engine**: 3-tier fallback architecture (Regex Router -> Gemini 1.5 Flash -> OpenAI -> Deterministic Rules Engine). 40/40 clinical evaluations passed.
- **Access Control**: Replay-protected HMAC-SHA256 ESP32 turnstile unlock protocol with isolated bulkhead routing.
- **Data Protection**: AES-256-GCM encrypted facial embeddings; zero raw image storage; instant atomic consent revocation.
