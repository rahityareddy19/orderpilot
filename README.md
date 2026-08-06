# OrderPilot AI

AI-assisted delivery management SaaS application that helps small businesses manage orders, customer complaints, and delivery partner tasks.

This repository is structured into two separate directories for simple local execution and independent cloud deployments (e.g. Vercel for Frontend and Render for Backend):

```text
orderPilot/
  ├── frontend/      # React.js + Vite + Tailwind CSS Frontend
  └── backend/       # Node.js + Express + Supabase (PostgreSQL) + Gemini AI Backend
```

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup (`/backend`)

```bash
cd backend

# Copy environment variables
cp .env.example .env

# Configure your backend/.env variables (PostgreSQL connection string & Gemini API key)
# DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
# GEMINI_API_KEY=your_gemini_api_key
# JWT_SECRET=your_jwt_secret_key
# CLIENT_URL=http://localhost:5173
# PORT=5000

# Install dependencies
npm install

# Seed Supabase / PostgreSQL database with initial tables and demo accounts
npm run seed

# Start backend server with auto-restart
npm run dev
```

The backend server runs on `http://localhost:5000`.

### 2. Frontend Setup (`/frontend`)

```bash
cd frontend

# Copy environment variables
cp .env.example .env

# VITE_API_BASE_URL=http://localhost:5000/api

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The frontend application runs on `http://localhost:5173`.

---

## 🔐 Credentials & Default Demo Accounts

Default accounts seeded into the database:

| Role | Email | Password | Access Rights |
|---|---|---|---|
| **Business Owner** | `owner@orderpilot.ai` | `Password123` | Full access to stats, order management, AI action approvals, and delivery partner account creation |
| **Delivery Partner** | `partner@orderpilot.ai` | `Password123` | Assigned task tracking and status progression (`Pending` → `In Progress` → `Completed`) |
| **Customer** | *No login required* | N/A | Public order tracking (`/track-order/ORD-1024`) and complaint submission (`/report-issue`) |

---

## ☁️ Deployment Environment Variables Guide

### 1. Supabase (PostgreSQL Database)
- Go to **Project Settings** > **Database** in your Supabase dashboard.
- Copy your **Connection URI** (Connection String) under *Direct connection* or *Connection pooling*.

### 2. Render (Backend Deployment)
Deploy the `/backend` directory as a **Web Service** on Render:
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `DATABASE_URL`: Your Supabase connection string.
  - `JWT_SECRET`: Secret key for JWT signing.
  - `GEMINI_API_KEY`: Your Google Gemini API Key.
  - `CLIENT_URL`: URL of your deployed Vercel frontend (e.g. `https://orderpilot.vercel.app`).
  - `PORT`: `5000` (or set automatically by Render).

### 3. Vercel (Frontend Deployment)
Deploy the `/frontend` directory as a **Vite Application** on Vercel:
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_BASE_URL`: URL of your deployed Render backend API (e.g. `https://orderpilot-api.onrender.com/api`).
