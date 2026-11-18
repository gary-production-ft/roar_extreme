# ROAR EXTREME — System Architecture & API Specification

**Release Version:** v1.0.0  
**Date:** 18 November 2026  
**Status:** PROVEN (Production-Verified Architecture)

---

## 1. System Topology Overview

ROAR EXTREME is built on a modern, decoupled cloud and edge topology designed for sub-second user responsiveness, strict security isolation, and reliable offline-safe hardware access.

```
                              +-----------------------+
                              |   Vercel Edge Network |
                              |   (React 19 SPA)      |
                              +-----------+-----------+
                                          |
                              HTTPS / WSS | Strict CORS
                                          v
                              +-----------------------+
                              |   Render Web Service  |
                              |   (Node.js 24 LTS)    |
                              +-----+-----------+-----+
                                    |           |
            +-----------------------+           +-----------------------+
            |                                                           |
            v                                                           v
  +-------------------+                                       +-------------------+
  |   MongoDB Atlas   |                                       |   Redis Service   |
  |   (Replica Set)   |                                       |   (Atomic Limits, |
  |   Leads, Members, |                                       |    Session Cache) |
  |   Attendance, Enc |                                       +-------------------+
  +-------------------+
            ^
            | HMAC-SHA256 Signed HTTP
            v
  +-------------------+
  |   ESP32 Rooftop   |
  |   Access Module   |
  |   (W5500 Ethernet)|
  +---------+---------+
            | 12V Relay (Fail-Safe)
            v
  +-------------------+
  | 280kg Maglock &   |
  | Break-Glass Egress|
  +-------------------+
```

---

## 2. Core Data Flows

### 2.1 Visitor Lead Reservation Flow
1. Visitor submits trial form on frontend (`POST /api/leads`).
2. Input is validated against Joi schema (strict phone regex, sanitized strings).
3. Lead is saved in MongoDB with unique reference ID (`ROAR-TRIAL-XXXXX`).
4. Backend triggers asynchronous email via Resend API (if configured). If unconfigured, reference ID is still returned gracefully without blocking the visitor.
5. Frontend displays reference code and copy button.

### 2.2 Secure Authentication & Session Flow
1. User submits email and password (`POST /api/auth/login`).
2. Password verified with bcrypt (12 salt rounds).
3. Backend issues JWT signed with HS256 (`JWT_SECRET`).
4. Token is sent as `httpOnly: true, secure: true, sameSite: 'lax'` cookie and in JSON body.
5. Protected endpoints verify token via `authMiddleware.js`.
6. Rate limiting enforced via atomic Redis sliding-window algorithm.

### 2.3 Physical Turnstile Access Flow
1. Member scans face at rooftop kiosk or uses mobile QR code.
2. Frontend extracts 128D mathematical vector embedding using TensorFlow.js (no raw image leaves device).
3. Client submits embedding (`POST /api/access/verify`).
4. Backend checks active membership, compares cosine distance (< 0.45 threshold), and validates rate limits.
5. If valid, backend constructs HMAC-SHA256 signed unlock token with timestamp and nonce.
6. ESP32 receives command, verifies signature and replay window (±30s), de-energizes 12V relay for 5 seconds, and logs entry.

---

## 3. Complete API Route Table

### 3.1 Authentication & Profile (`/api/auth`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Admin | Register new staff or member account. |
| `POST` | `/api/auth/login` | Public | Authenticate user, issue httpOnly cookie and JWT. |
| `POST` | `/api/auth/logout` | Authenticated | Clear session cookie and invalidate token. |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current authenticated user profile. |

### 3.2 Public Leads & Free Trial (`/api/leads`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/leads` | Public (Rate-Limited) | Submit free trial booking request. |
| `GET` | `/api/leads` | Staff / Admin | List all prospective leads with pagination and filters. |
| `PUT` | `/api/leads/:id` | Staff / Admin | Update lead status (e.g., Contacted, Converted, Cancelled). |
| `DELETE` | `/api/leads/:id` | Admin | Permanently purge lead record. |

### 3.3 Members & Subscriptions (`/api/members`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/members` | Staff / Admin | Query member roster, search by name, phone, or status. |
| `POST` | `/api/members` | Staff / Admin | Enroll new gym member with subscription tier. |
| `GET` | `/api/members/:id` | Staff / Admin | Fetch member profile, attendance history, and notes. |
| `PUT` | `/api/members/:id` | Staff / Admin | Update member details or renew subscription. |
| `DELETE` | `/api/members/:id` | Admin | Archive or delete member record. |

### 3.4 Physical Access & Biometrics (`/api/access`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/access/verify` | Device / Member | Verify biometric face embedding or QR token to unlock gate. |
| `POST` | `/api/access/enrol-face` | Staff / Member | Store encrypted 128D facial template for member. |
| `DELETE` | `/api/access/face/:memberId` | Staff / Member | Irreversibly delete stored biometric template. |
| `GET` | `/api/access/logs` | Staff / Admin | Audit door access attempts (granted vs. denied). |

### 3.5 AI Fitness Coach & Conversational Engine (`/api/chat`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/chat/message` | Public (Rate-Limited) | Submit message to AI coach. Multi-tier fallback (Regex -> Gemini -> OpenAI -> Deterministic Rules). |
| `GET` | `/api/chat/history/:sessionId` | Public / Member | Retrieve multi-turn conversation memory. |
| `DELETE` | `/api/chat/history/:sessionId` | Public / Member | Clear conversation history. |

### 3.6 AI Workout & Diet Generation (`/api/fitness-plans`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/fitness-plans/generate` | Authenticated | Generate clinical-grade customized workout and diet plans. |
| `GET` | `/api/fitness-plans/member/:id` | Authenticated | Retrieve member's active plan. |

### 3.7 Public Catalogs & Studio Information (`/api/catalog`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/catalog/memberships` | Public | Retrieve active pricing tiers and rooftop packages. |
| `GET` | `/api/catalog/trainers` | Public | Retrieve verified certified trainer roster and bios. |
| `GET` | `/api/catalog/schedule` | Public | Retrieve rooftop group workout and sunset yoga schedules. |

### 3.8 Health & Telemetry (`/api/health`)
| Method | Endpoint | Access Level | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Deep health check (Database connectivity, uptime, memory). |
