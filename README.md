# 👤 FacePass AI — Fullstack Face Recognition & Attendance System

A modern, fullstack web application for **Real-Time Face Recognition, Biometric Enrollment, and Attendance Logging**.

- **Frontend**: Deployed on **Vercel** (HTML5, Modern Glassmorphism CSS, JavaScript, face-api.js AI)
- **Backend**: Deployed on **Render** (Node.js, Express REST API, CORS)
- **Database**: **MongoDB Atlas** (Cloud Database) with zero-config local fallback for instant testing.

---

## 🌟 Key Features

1. **Live Face Recognition & Attendance (Webcam)**
   - Real-time face detection with green/red bounding box and name tag.
   - Computes 128-dimensional Euclidean distance against registered vectors.
   - Auto-logs attendance with duplicate-prevention cooldown (prevents log spamming).
   - Real-time Web Audio API chime on successful recognition.
2. **Face Enrollment & Registration**
   - Live camera alignment guide with oval target.
   - Captures user info (Name, Email, Role, Department) and biometric descriptors.
   - Saves face thumbnail preview.
3. **Attendance & Scan History**
   - Searchable, filterable log by name and date.
   - Shows user snapshot, timestamp, match accuracy %, and status.
   - One-click **Export to CSV** for audit reports.
4. **Enrolled Faces Directory**
   - Search and view enrolled profiles.
   - Easily remove / delete faces from the system.
5. **Dynamic Backend Configuration**
   - Built-in UI settings modal to switch between `localhost:5000` and your deployed Render URL without changing code.

---

## 📁 Project Structure

```
face-recognition-system/
├── backend/                  # Render Web Service
│   ├── config/
│   │   ├── db.js             # MongoDB Atlas connection
│   │   └── dataStore.js      # Unified storage (MongoDB + Local JSON fallback)
│   ├── models/
│   │   ├── User.js           # Schema for enrolled faces & 128-d vectors
│   │   └── Attendance.js     # Schema for attendance logs
│   ├── routes/
│   │   ├── userRoutes.js     # /api/users
│   │   ├── attendanceRoutes.js # /api/attendance
│   │   └── statsRoutes.js    # /api/stats
│   ├── .env.example          # Environment variables
│   ├── render.yaml           # Render 1-click deployment blueprint
│   ├── package.json
│   └── server.js             # Express API & static frontend server
│
├── frontend/                 # Vercel Static Site
│   ├── index.html            # Live scanner dashboard
│   ├── register.html         # Face enrollment page
│   ├── logs.html             # Attendance logs & CSV export
│   ├── users.html            # Enrolled faces directory
│   ├── css/
│   │   └── style.css         # Modern dark glassmorphic styling
│   ├── js/
│   │   ├── config.js         # API endpoint & toast notifications
│   │   ├── face-utils.js     # face-api.js loader, webcam, descriptor logic
│   │   ├── app.js            # Live scanner recognition loop
│   │   ├── register.js       # Enrollment form logic
│   │   ├── logs.js           # Attendance table & date filter
│   │   └── users.js          # Users grid & delete handler
│   └── vercel.json           # Vercel deployment configuration
│
└── README.md
```

---

## 🚀 Quick Start (Local Testing on Your Computer)

You can run both frontend and backend locally with a single command:

1. Open PowerShell or Terminal and navigate to the `backend` folder:
   ```bash
   cd "c:\Users\sivap\Desktop\face-recognition-system\backend"
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Open your browser and visit:
   ```
   http://localhost:5000
   ```
4. **Allow camera access** when prompted by the browser.
5. Go to **Register Face**, fill in your name and details, align your face in the oval guide, and click **Capture & Save Face**.
6. Return to **Live Scanner** — your face will now be recognized with a green bounding box and attendance will be automatically logged!

---

## ☁️ Deployment Guide (Render + Vercel)

### Step 1: Push Project to GitHub
1. Create a new repository on [GitHub](https://github.com/new), e.g. `face-recognition-system`.
2. In terminal, initialize git and push:
   ```bash
   cd "c:\Users\sivap\Desktop\face-recognition-system"
   git init
   git add .
   git commit -m "Initial commit of Face Recognition System"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/face-recognition-system.git
   git push -u origin main
   ```

---

### Step 2: Deploy Backend on Render (Free)
1. Go to [Render.com](https://render.com) and log in.
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository `face-recognition-system`.
4. Configure the Web Service settings:
   - **Name**: `face-recognition-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. **Environment Variables**:
   - Add `NODE_ENV` = `production`
   - (Optional) Add `MONGO_URI` = your MongoDB Atlas connection string (see MongoDB section below).
6. Click **Deploy Web Service**.
7. Once deployed, copy your Render URL: e.g. `https://face-recognition-backend.onrender.com`.

---

### Step 3: Deploy Frontend on Vercel (Free)
1. Go to [Vercel.com](https://vercel.com) and log in.
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository `face-recognition-system`.
4. In the Project configuration:
   - **Root Directory**: Click "Edit" and choose `frontend`.
   - **Framework Preset**: `Other` (or leave Default).
5. Click **Deploy**.
6. Within 30 seconds, Vercel will give you a live HTTPS URL: e.g. `https://face-recognition-frontend.vercel.app`.

---

### Step 4: Connect Vercel Frontend to Render Backend
1. Open your Vercel website in the browser.
2. Click the **⚙️ Backend API** button in the top navigation bar.
3. Paste your Render backend URL (e.g. `https://face-recognition-backend.onrender.com`).
4. Click **Save & Test Connection**.
5. Done! Your frontend is now fully communicating with your cloud backend API with automatic HTTPS webcam support!

---

## 🍃 MongoDB Atlas Setup (Free Cloud Database)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a **Free Shared Cluster (M0)**.
3. In **Database Access**, create a user (e.g. `admin` and a password).
4. In **Network Access**, click **Add IP Address** -> select **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Click **Connect** -> **Drivers (Node.js)**, and copy the connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/face_db?retryWrites=true&w=majority
   ```
6. Paste this URI into:
   - Local testing: `backend/.env` as `MONGO_URI=...`
   - Render: In your Render service's **Environment** tab as `MONGO_URI`.

---

## 🇮🇳 Tenglish Summary (Telugu lo Step-by-Step)

Mee project ippudu 100% ready ga undi!

1. **Local ga run cheyadaniki:**
   - PowerShell lo `cd "c:\Users\sivap\Desktop\face-recognition-system\backend"` ki velli `npm start` cheyandi.
   - Browser lo `http://localhost:5000` open cheyagane Camera open avuthundi.
   - Mundhu **Register Face** page ki velli mee face & name save cheyyandi.
   - Tharvatha **Live Scanner** ki vasthe automatic ga mee face ni detect chesi Green box tho attendance mark chesthundi!

2. **Render & Vercel ki Deploy cheyadaniki:**
   - Code ni GitHub lo repo ga push cheyyandi.
   - **Render** lo Backend (`backend` folder) deploy cheyyandi.
   - **Vercel** lo Frontend (`frontend` folder) deploy cheyyandi.
   - Website lo paina unna **⚙️ Backend API** button nokki, Render URL paste chesthe rendoo connect aypothayi!
