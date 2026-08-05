# OrderPilot AI

AI-powered delivery management dashboard for small businesses.

## Features

- **Landing Page** — Product overview with Track Order and Login CTAs
- **Order Tracking** — Customers can track orders by ID (demo: `ORD-1024`)
- **Issue Reporting** — Complaint form with validation and success state
- **Owner Dashboard** — Stats, urgent issues, AI activity timeline, orders table
- **Orders Page** — Searchable/filterable orders table with status and priority badges
- **Complaints Page** — Customer complaints with AI analysis and suggested actions
- **Partner Dashboard** — Assigned deliveries with task-status progression

## Tech Stack

- React.js + Vite
- JavaScript (no TypeScript)
- React Router DOM
- Tailwind CSS v4
- Lucide React icons
- Axios (available, not used — no backend)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install

```bash
npm install
```

### Run (Development)

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Demo Credentials

No real authentication. On the Login page, select a role:

| Role             | Dashboard Path       |
|------------------|----------------------|
| Business Owner   | `/owner/dashboard`   |
| Delivery Partner | `/partner/dashboard` |

## Demo Order

Use order ID **ORD-1024** on the Track Order page to see a full delivery timeline.

## Folder Structure

```
src/
  components/    # Reusable UI components
  pages/         # Route pages
    owner/       # Owner dashboard pages
    partner/     # Partner dashboard pages
  data/          # Mock data
  context/       # React Context (role + complaints)
  App.jsx        # Routes
  main.jsx       # Entry point
  index.css      # Tailwind CSS
```

## License

Demo project — not licensed for production use.
