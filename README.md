# OrderPilot AI

AI-assisted delivery management system that helps small businesses manage orders, complaints, and delivery partner tasks.

This repository is split into two independent folders for easy local development and separate deployment.

## Repository Structure

```text
orderPilot/
  ├── frontend/      # React + Vite Frontend
  └── backend/       # Node.js + Express Backend
```

---

## 🚀 Getting Started

### 1. Run the Frontend

Navigate to the `frontend` folder, install dependencies, and run the development server:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run at `http://localhost:5173`.

### 2. Run the Backend

Navigate to the `backend` folder, configure your environment details, seed the database, and run the server:

```bash
cd backend
cp .env.example .env     # Copy & configure your database / Gemini credentials
npm install
npm run seed             # Initialize PostgreSQL schema and seed sample data
npm run dev              # Run server with nodemon
```

The backend server will run at `http://localhost:5000`.

---

## 📖 Component Highlights

- **Frontend (`/frontend`)**: Clean dashboard with UI paths for Public Order Tracking, Business Owners, and Delivery Partners. Configured with Tailwind CSS, React Router, and Lucide React.
- **Backend (`/backend`)**: Robust Express APIs, JWT security middleware, PostgreSQL database connectivity, and automated complaints categorization powered by the **Google Gemini AI** pilot.
