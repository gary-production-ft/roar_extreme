# ☁️ ROAR EXTREME — Deployment & Operations Guide

**Recommended Target Topography:**
* **Frontend:** Vercel (Edge CDN Static Hosting)
* **Backend:** Render (Web Service Node.js LTS)
* **Database:** MongoDB Atlas (M10 Replica Set)
* **Cache:** Upstash Redis / Render Redis

---

## 1. Environment Topology

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     Vercel (Frontend CDN)       │       │    Render (Backend Web Service) │
│  - React 19 SPA static assets   │ ────> │  - Express 4.21 API Gateway     │
│  - Global Edge CDN distribution │ HTTPS │  - SSE Relay & Intent Router    │
└─────────────────────────────────┘       └────────────────┬────────────────┘
                                                           │
                                        ┌──────────────────┴──────────────────┐
                                        ▼                                     ▼
                      ┌───────────────────────────────────┐ ┌───────────────────────────────────┐
                      │    MongoDB Atlas (M10 Replica)    │ │      Redis 6 (Shared Cache)       │
                      │  - Primary + Secondary Data Nodes │ │  - Stateless token revocation     │
                      │  - Automated Point-in-Time Backup │ │  - Distributed rate limiting      │
                      └───────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 2. Production Environment Variables Reference

### Backend Web Service (Render)

| Variable | Recommended Production Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production error handling and disables stack traces |
| `PORT` | `5000` | Port listened to by Node server |
| `CLIENT_URL` | `https://roarextreme.com` | Allowed CORS origin for frontend requests |
| `MONGO_URI` | `mongodb+srv://<user>:<pwd>@roar-cluster.mongodb.net/roar_extreme` | MongoDB Atlas Replica Set connection string |
| `JWT_SECRET` | Cryptographically random 32+ characters | Signing secret for administrative Bearer tokens |
| `FACE_ENCRYPTION_KEY` | 32-character hex key (256-bit) | AES-256-GCM encryption key for face templates |
| `LOCK_DEVICE_SECRET` | Cryptographically random 32+ characters | HMAC-SHA256 signing secret for ESP32 turnstile |
| `REDIS_URL` | `redis://default:<pwd>@<host>:<port>` | Redis connection string (or omit for memory fallback) |
| `GEMINI_API_KEY` | Production Google AI Studio Key | Primary AI engine credentials |
| `GEMINI_MODEL` | `gemini-3.5-flash-lite` | Primary AI model |
| `RESEND_API_KEY` | Production Resend API Key | Real transactional email delivery provider |

---

## 3. Deployment Commands

### Backend Deployment (Render)
* **Build Command:** `npm --prefix backend install`
* **Start Command:** `npm run server`
* **Health Check Path:** `/health/ready`

### Frontend Deployment (Vercel)
* **Framework Preset:** `Vite`
* **Build Command:** `npm run build`
* **Output Directory:** `dist`
* **Environment Variables:** `VITE_API_URL=https://api.roarextreme.com`
