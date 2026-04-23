# ⌚ Jay's Watch Store — Exam Portal

A full-stack staff examination portal built with **Node.js + Express + MongoDB + Mongoose**.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16+ → https://nodejs.org
- **MongoDB** (choose one):
  - **Local:** Install MongoDB Community → https://www.mongodb.com/try/download/community
  - **Cloud (Free):** MongoDB Atlas → https://www.mongodb.com/atlas

---

### 1. Configure Environment

Copy `.env.example` to `.env` inside the `backend` folder:

```bash
cd jays-exam-portal/backend
cp .env.example .env
```

Edit `.env` with your MongoDB connection:

```env
# Local MongoDB (default — works if MongoDB is installed locally)
MONGODB_URI=mongodb://localhost:27017/jays-exam-portal

# OR MongoDB Atlas (cloud):
MONGODB_URI=mongodb+srv://yourUser:yourPassword@cluster0.xxxxx.mongodb.net/jays-exam-portal

JWT_SECRET=change-this-to-something-secret
PORT=3001
```

---

### 2. Install & Run

```bash
cd jays-exam-portal/backend
npm install
npm start
```

Open browser → **http://localhost:3001**

> **Windows users:** Double-click `start.bat` (it will prompt you to set up `.env` first)

---

## 🔐 Default Login Credentials

These are auto-created on first run if the database is empty:

| Role  | Username | Password   |
|-------|----------|------------|
| Admin | `admin`  | `admin123` |
| Staff | `alice`  | `staff123` |
| Staff | `bob`    | `staff123` |

---

## ☁️ MongoDB Atlas Setup (Free Cloud DB)

1. Go to https://www.mongodb.com/atlas → Create free account
2. Create a **free M0 cluster**
3. Go to **Database Access** → Add a user with password
4. Go to **Network Access** → Add IP `0.0.0.0/0` (allow all) or your specific IP
5. Go to **Clusters** → Click **Connect** → **Drivers** → Copy the connection string
6. Paste it into your `.env` as `MONGODB_URI`

---

## ✨ Features

### Admin
- Dashboard with stats and submission overview
- **Exam Builder** — 5 question types: MCQ, Fill in the Blank, True/False, Match the Column, Guess
- Dynamic marks per question, time limit, passing marks
- Full result review per staff member
- Per-exam and overall Leaderboard
- Staff account management
- PDF download for any result

### Staff
- Personal dashboard with score history
- Exam taking with shuffled questions & options (anti-cheat)
- Live countdown timer (auto-submits at 0)
- Full answer review after submission
- PDF download of own results
- Team leaderboard

---

## 📁 Project Structure

```
jays-exam-portal/
├── backend/
│   ├── server.js              # Express + MongoDB connection + seeding
│   ├── .env.example           # Copy to .env and fill in your values
│   ├── models/
│   │   ├── User.js            # Mongoose User schema
│   │   ├── Exam.js            # Mongoose Exam + Question schema
│   │   └── Result.js          # Mongoose Result schema
│   ├── routes/
│   │   ├── auth.js            # Login, user management
│   │   ├── exams.js           # Exam CRUD
│   │   └── results.js         # Submit, grade, leaderboard
│   ├── middleware/
│   │   └── auth.js            # JWT verification
│   └── package.json
└── frontend/
    ├── index.html
    ├── css/style.css
    └── js/
        ├── api.js, auth.js, app.js
        ├── admin.js, staff.js
        ├── exam-builder.js, exam-take.js
        └── pdf.js, utils.js
```

---

## 🛡️ Security Notes
- Passwords hashed with **bcrypt** (salt rounds: 10)
- Auth via **JWT tokens** (8h expiry)
- Answer keys never sent to staff — grading is 100% server-side
- One submission per staff per exam (enforced by MongoDB unique index)
