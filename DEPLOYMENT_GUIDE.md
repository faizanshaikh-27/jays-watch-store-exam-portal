# 🚀 Hosting Guide — Jay's Watch Store Exam Portal
## Deploy FREE using MongoDB Atlas + Render + GitHub

---

## Overview

| Service | What it does | Cost |
|---------|-------------|------|
| **GitHub** | Stores your code | Free |
| **MongoDB Atlas** | Cloud database | Free (512MB) |
| **Render** | Hosts your Node.js server | Free |

Total cost: **$0/month** ✅

---

## PART 1 — Set Up MongoDB Atlas (Free Cloud Database)

### Step 1: Create Atlas Account
1. Go to → **https://www.mongodb.com/atlas**
2. Click **"Try Free"**
3. Sign up with your email (or use Google)
4. Verify your email

### Step 2: Create a Free Cluster
1. After login, click **"Build a Database"**
2. Choose **M0 FREE** tier (the free one)
3. Choose any Cloud Provider (AWS is fine) and Region (closest to you)
4. Name your cluster: `jays-exam-portal`
5. Click **"Create"**
6. Wait 1-2 minutes for cluster to be ready

### Step 3: Create a Database User
1. On the left sidebar → Click **"Database Access"**
2. Click **"Add New Database User"**
3. Set:
   - **Username:** `jaysadmin`
   - **Password:** (click "Autogenerate" and COPY it — you'll need it)
   - **Role:** "Atlas admin"
4. Click **"Add User"**

### Step 4: Allow All IP Addresses
1. On left sidebar → Click **"Network Access"**
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** → this sets `0.0.0.0/0`
4. Click **"Confirm"**

### Step 5: Get Your Connection String
1. On left sidebar → Click **"Database"**
2. Click **"Connect"** on your cluster
3. Choose **"Drivers"**
4. Select **Driver: Node.js**, Version: **6.7 or later**
5. Copy the connection string — it looks like:
   ```
   mongodb+srv://jaysadmin:<password>@jays-exam-portal.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password from Step 3
7. Add your database name before the `?`:
   ```
   mongodb+srv://jaysadmin:YOURPASSWORD@jays-exam-portal.xxxxx.mongodb.net/jays-exam-portal?retryWrites=true&w=majority
   ```
8. **Save this full string** — you'll need it in Part 3

---

## PART 2 — Upload Code to GitHub

### Step 1: Create GitHub Account
1. Go to → **https://github.com**
2. Click **"Sign up"** → create free account
3. Verify your email

### Step 2: Create a New Repository
1. Click the **"+"** button → **"New repository"**
2. Name it: `jays-exam-portal`
3. Set to **Public** (required for free Render hosting)
4. Do NOT check "Initialize with README"
5. Click **"Create repository"**

### Step 3: Upload Your Project Files
**Option A — Using GitHub Website (No terminal needed):**
1. On your new repo page, click **"uploading an existing file"**
2. Drag and drop ALL files from inside the `jays-exam-portal` folder
   - Upload: `backend/`, `frontend/`, `package.json`, `render.yaml`, `.gitignore`
   - ⚠️ Do NOT upload `node_modules` folder or `.env` file
3. Scroll down → Click **"Commit changes"**

**Option B — Using Git (Terminal):**
```bash
# Inside the jays-exam-portal folder:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOURUSERNAME/jays-exam-portal.git
git push -u origin main
```

---

## PART 3 — Deploy on Render (Free Hosting)

### Step 1: Create Render Account
1. Go to → **https://render.com**
2. Click **"Get Started for Free"**
3. Sign up with your **GitHub account** (easiest!)

### Step 2: Create a New Web Service
1. On the Render dashboard → Click **"New +"**
2. Click **"Web Service"**
3. Connect your GitHub account if not already done
4. Find and select your **`jays-exam-portal`** repository
5. Click **"Connect"**

### Step 3: Configure the Service
Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `jays-exam-portal` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | *(leave empty)* |
| **Runtime** | `Node` |
| **Build Command** | `cd backend && npm install` |
| **Start Command** | `node backend/server.js` |
| **Instance Type** | **Free** |

### Step 4: Add Environment Variables
1. Scroll down to **"Environment Variables"** section
2. Click **"Add Environment Variable"** and add these one by one:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your full Atlas connection string from Part 1 Step 5 |
| `JWT_SECRET` | Any random string e.g. `jays-watch-super-secret-xyz-2024` |
| `NODE_ENV` | `production` |

### Step 5: Deploy!
1. Scroll down → Click **"Create Web Service"**
2. Render will now:
   - Download your code from GitHub
   - Run `cd backend && npm install`
   - Start your server
3. Watch the logs — after 2-3 minutes you'll see:
   ```
   ✅ MongoDB connected
   🚀 Running at http://localhost:10000
   ✅ Default users created.
   ```
4. At the top of the page, Render shows your live URL:
   ```
   https://jays-exam-portal.onrender.com
   ```

### Step 6: Open Your Live App! 🎉
Click your Render URL → your exam portal is now live!

**Login with:**
- Admin: `admin` / `admin123`
- Staff: `alice` / `staff123`

---

## ⚠️ Important Notes

**Free Render tier goes to sleep** after 15 minutes of inactivity.
The first visit after sleeping takes ~30 seconds to wake up.
This is normal for the free tier. Paid plans ($7/month) keep it always awake.

**To keep it awake for free**, use UptimeRobot:
1. Go to → https://uptimerobot.com → Sign up free
2. Add a monitor: HTTP(s), your Render URL + `/api/health`, every 5 minutes
3. This pings your app regularly so it never sleeps!

---

## 🔄 Updating Your App Later

Whenever you change code:
1. Upload new files to GitHub (or use `git push`)
2. Render **automatically redeploys** — no manual steps needed!

---

## ❓ Troubleshooting

| Problem | Fix |
|---------|-----|
| "MongoDB connection failed" | Check your MONGODB_URI is correct in Render env vars |
| App shows blank page | Check Render logs for errors |
| Can't login | Make sure DB seeded — check logs for "Default users created" |
| Build failed | Make sure Build Command is exactly `cd backend && npm install` |
