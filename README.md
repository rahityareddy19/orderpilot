# OrderPilot AI – Agentic AI Delivery Operations Platform

OrderPilot AI is an enterprise-grade **Agentic AI SaaS application** designed to autonomously manage delivery operations, customer complaints, partner dispatching, and resolution workflows.

Instead of acting as a simple chatbot, OrderPilot AI functions as an **autonomous operations manager** powered by a multi-agent system coordinated by a central orchestrator.

---

## 🤖 Multi-Agent Architecture & Orchestration

The core intelligence of OrderPilot AI is powered by **7 specialized AI agents** that reason, collaborate, and execute multi-step workflows with minimal human intervention.

```mermaid
graph TD
    A[Customer Complaint / System Event] --> B[WorkflowOrchestrator]
    
    subgraph Multi-Agent Autonomous Pipeline
        B --> C[1. ComplaintAnalysisAgent]
        C -->|Category & Sentiment| D[2. PriorityAgent]
        D -->|Urgency & SLA Level| E[3. PlanningAgent]
        E -->|Action Plan & Recommendation| F[4. TaskAssignmentAgent]
        F -->|Task Allocation| G[5. NotificationAgent]
        
        C & D & E & F & G --> H[6. ActivityAgent]
    end

    subgraph Autonomous Background Engine
        I[7. MonitoringAgent] -->|Periodic SLA Checks & Auto-Escalation| B
    end

    E -->|Requires Approval| J[Owner Dashboard - Human-in-the-Loop]
    J -->|Approve Action Plan| K[Task Dispatch & Resolution]
    G --> L[Customer & Partner Portals]
```

---

## 🛠️ Specialized AI Agent Roles

| Agent | Module | Primary Responsibility | Output |
| :--- | :--- | :--- | :--- |
| **`ComplaintAnalysisAgent`** | `ComplaintAnalysisAgent.js` | Parses unstructured customer text using Gemini AI to extract category, sentiment, and key issue summaries. | Category (`Delivery Delay`, `Damaged Package`, `Missing Item`), Sentiment (`frustrated`, `calm`), Summary |
| **`PriorityAgent`** | `PriorityAgent.js` | Evaluates order monetary value, SLA breach duration, and customer sentiment to compute urgency levels. | Urgency (`critical`, `high`, `medium`, `low`), Priority Reasoning |
| **`PlanningAgent`** | `PlanningAgent.js` | Generates a structured multi-step resolution plan, estimated resolution window, and Human-in-the-Loop owner recommendation. | Execution Steps, Estimated Resolution Time, Recommended Action Plan |
| **`TaskAssignmentAgent`** | `TaskAssignmentAgent.js` | Evaluates delivery partner workloads, location hubs, and assigned orders to allocate tasks. | Assigned Partner ID, Due Time, Task Instructions |
| **`NotificationAgent`** | `NotificationAgent.js` | Dispatches targeted notifications across customer, partner, and owner channels. | In-App Alerts, SMS/Email Payloads |
| **`ActivityAgent`** | `ActivityAgent.js` | Records an immutable audit log of all agent steps, confidence scores (0.0 to 1.0), and system events. | Immutable Audit Trail & `ai_decisions` Records |
| **`MonitoringAgent`** | `MonitoringAgent.js` | Runs continuous background checks every 5 minutes to detect delayed orders and auto-escalate stale complaints. | Automatic Escalations & SLA Breaches |

---

## 🔄 Agent Execution & Orchestration Flow

1. **Trigger**: A customer files a complaint or an order exceeds its estimated delivery time.
2. **Analysis**: `ComplaintAnalysisAgent` categorizes the issue and gauges sentiment using Google Gemini AI.
3. **Priority Matrix**: `PriorityAgent` checks SLA breach thresholds and assigns priority (`critical`, `high`, `medium`).
4. **Action Plan Generation**: `PlanningAgent` formulates a multi-step resolution plan.
5. **Human-in-the-Loop Review**: High-urgency plans are flagged for owner approval on the `/owner/dashboard`.
6. **Task Allocation**: Upon approval (or auto-approval for low-risk items), `TaskAssignmentAgent` assigns the task to the optimal delivery partner.
7. **Audit & Notification**: `NotificationAgent` alerts all stakeholders, and `ActivityAgent` writes the complete reasoning chain to `ai_decisions`.

---

## 🏗️ Project Architecture

OrderPilot AI supports two deployment modes:
- **Single-Port Architecture** (Default): Express serves built React static assets on port `5000`.
- **Distributed Cloud Architecture**: React frontend hosted on Netlify / Vercel, Express API backend hosted on Render, and database hosted on Supabase PostgreSQL.

```text
orderPilot/
├── schema.sql                 # PostgreSQL Master Schema for Supabase
├── netlify.toml               # Netlify Single-Page Application (SPA) Routing
├── package.json               # Root scripts (build, start, dev)
├── backend/
│   ├── seed.js                # Database Seeding Script (Demo Accounts & Orders)
│   ├── src/
│   │   ├── app.js             # Express Application & Static Asset Server
│   │   ├── db/index.js        # Zero-Downtime Resilient Query Engine
│   │   ├── agents/            # Multi-Agent Operations System (7 Agents)
│   │   ├── middleware/        # JWT Auth, RBAC, and Global Error Handlers
│   │   └── routes/            # REST API endpoints (/auth, /orders, /complaints, /tasks, /activity-logs)
└── frontend/
    ├── public/_redirects      # Netlify SPA 200 Rewrite Rules
    └── src/
        ├── api/index.js       # Axios Instance with JWT Interceptor
        ├── context/           # React Context (Auth State & Resilient Fallbacks)
        ├── components/        # Reusable UI (ProtectedRoutes, Header, StatusBadge)
        └── pages/             # Role-Based Views (Owner, Partner, Customer)
```

---

## 🔑 Default Seed Credentials

All pre-seeded demo accounts use the standard password: **`Password123`**

| Role | Email | Accessible Dashboard |
| :--- | :--- | :--- |
| **Business Owner** | `owner@orderpilot.ai` | `/owner/dashboard` (Stats, Approvals, AI Insights, Audit Logs) |
| **Delivery Partner** | `partner@orderpilot.ai` | `/partner/dashboard` (Assigned Tasks, Status Updates) |
| **Customer** | `customer@orderpilot.ai` | `/customer/dashboard` (Order Tracking, Complaint Filing) |

---

## 🚀 Local Development Setup

### 1. Configure Environment Variables
Create `backend/.env`:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=postgresql://postgres:your_db_password@db.your-project-ref.supabase.co:5432/postgres
JWT_SECRET=545390e273ba3b81185d22fcab460773ddb024cac23555e91c18251fdaaf7ec5
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

### 2. Install & Start Application
```bash
# Install root dependencies
npm install

# Build frontend and start single-port server
npm run build --prefix frontend
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

---

## 🌐 Production Cloud Deployments

- **Netlify Deployment**: Push repository to GitHub. Netlify reads `netlify.toml` and builds the frontend from `frontend/` with full SPA client-side routing.
- **Supabase PostgreSQL**: Import `schema.sql` into Supabase SQL Editor and execute `npm run seed` in `backend/`.
