# Urgent Credential & Secret Rotation Procedure (ROTATE_NOW.md)

> **CRITICAL SECURITY NOTICE**
> The default admin password (`RoarAdmin#2026`) and development secrets were previously present in source code and historical git commits. The application code has now been secured to reject these credentials, but existing deployed environments must execute the following rotation steps immediately.

---

## 1. Immediate Admin Password Rotation

If an administrator account was created with the default password, update it immediately via the production CLI or the database:

### Option A: Using the CLI Provisioning Script on Render
Run the following in the Render Shell or your production server terminal:

```bash
# Set a strong, unique 16+ character password in the environment
export ADMIN_EMAIL="admin@roarextreme.com"
export ADMIN_PASSWORD="<NEW_HIGH_ENTROPY_PASSWORD_MIN_16_CHARS>"

# Execute provisioning script to reset password hash
node backend/src/scripts/createAdmin.js "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "owner" "Roar Gym Owner"
```

### Option B: Using the Password Rotation Script
```bash
npm --prefix backend run rotate-password -- "admin@roarextreme.com" "<NEW_HIGH_ENTROPY_PASSWORD>"
```

---

## 2. Environment Secrets Rotation (Render & Vercel)

Log into your **Render Dashboard** and **Vercel Project Settings**, then replace the following variables with cryptographically random strings:

| Variable | Required Strength | Generation Command |
| :--- | :--- | :--- |
| `JWT_SECRET` | 64+ hex characters (min 32 chars) | `openssl rand -hex 32` |
| `INITIAL_ADMIN_PASSWORD` | 16+ random characters | `openssl rand -base64 16` |
| `FACE_ENCRYPTION_KEY` | Exact 32 bytes (AES-256-GCM) | `node -e "console.log(crypto.randomBytes(16).toString('hex'))"` |
| `LOCK_DEVICE_SECRET` | 32+ hex characters | `openssl rand -hex 24` |
| `DEVICE_API_KEY` | 32+ hex characters | `openssl rand -hex 20` |

> **IMPORTANT:** Restart the Render Web Service after updating environment variables so that the new `JWT_SECRET` immediately invalidates all existing active admin tokens.

---

## 3. Git History Sanitization (BFG / git-filter-repo)

To permanently scrub historical occurrences of `RoarAdmin#2026` from the repository history before making the repository public or sharing it externally:

### Using `git-filter-repo` (Recommended by Git)
```bash
# 1. Install git-filter-repo (Python required)
pip install git-filter-repo

# 2. Clone a fresh bare mirror of the repository to prevent working copy loss
git clone --mirror https://github.com/gary-production-ft/roar_extreme.git repo-cleanup
cd repo-cleanup

# 3. Create expressions replacement file
echo "RoarAdmin#2026==>REDACTED_HISTORICAL_PASSWORD" > replace.txt

# 4. Scrub the password across all commits, tags, and branches
git filter-repo --replace-text replace.txt

# 5. Verify no references remain
git log -p -S "RoarAdmin#2026"

# 6. Force-push the cleaned history back to GitHub
git push origin --force --all
git push origin --force --tags
```

---

## 4. Verification Check
After performing the above rotations, verify by attempting to log in at `/admin/login` using `RoarAdmin#2026` — the backend will reject the login with `401 Unauthorized`.
