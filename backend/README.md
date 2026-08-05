# OrderPilot AI Backend Server

This is the Node.js/Express backend for **OrderPilot AI**, featuring secure JWT authentication, input validation via Zod, Google Gemini AI complaint analysis, and integration with Supabase PostgreSQL.

## Technologies Used

- **Node.js** & **Express**
- **Supabase PostgreSQL** (`pg` connection pool)
- **JWT** (JSON Web Tokens) & **bcrypt**
- **Zod** (Schema validation)
- **Google Gemini API** (`@google/generative-ai`)

---

## Supabase PostgreSQL Setup

1. Create a free project at [Supabase](https://supabase.com/).
2. Go to **Project Settings** > **Database** and copy your **Connection string** (URI format, transaction mode or direct connection pool).
3. Ensure you have the database credentials ready to add to your `.env` file.

---

## Installation & Configuration

1. In the `/backend` folder, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Populate the `.env` file:
   - `DATABASE_URL`: Your Supabase connection string.
   - `JWT_SECRET`: A secure key for generating tokens.
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `CLIENT_URL`: URL of the React frontend (`http://localhost:5173`).
   - `PORT`: Port to run the server (`5000`).

3. Install dependencies:
   ```bash
   npm install
   ```

---

## Seeding the Database

Run the seeding command to automatically deploy the schema tables (`schema.sql`) and fill them with default demo accounts and orders:

```bash
npm run seed
```

This generates:
- **Business Owner**: `owner@orderpilot.ai` / password: `Password123`
- **Delivery Partner**: `partner@orderpilot.ai` / password: `Password123`
- Mapped demo order: `ORD-1024` with timeline details.

---

## Run Server

### Development Mode (with Nodemon auto-restart)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new account.
- `POST /api/auth/login` — Login and receive JWT token.
- `GET /api/auth/me` — Protected (All) get active user profile.

### Orders
- `GET /api/orders` — Protected (All). Owners see all orders; delivery partners see only their assigned orders.
- `GET /api/orders/:id` — Public/Protected view of a single order and its delivery timeline.
- `POST /api/orders` — Protected (Owner only). Create a new order.
- `PATCH /api/orders/:id/status` — Protected (All). Update order status and append a timestamped timeline event.

### Complaints (AI Pilot)
- `POST /api/complaints` — Public complaint submission. Automatically uses Gemini to classify issue type, determine urgency, write timeline summaries, update order priority/timeline, and trigger a delivery task.
- `GET /api/complaints` — Protected (Owner only). List of complaints and AI suggested resolutions.

### Delivery Partner Tasks
- `GET /api/tasks` — Protected (All). List tasks. Delivery partners see only their assigned tasks.
- `PATCH /api/tasks/:id/status` — Protected (All). Update delivery status (Pending → In Progress → Completed) and syncs changes to order timelines.

### Dashboard Analytics
- `GET /api/dashboard/stats` — Protected (Owner only). Total orders, delays, open complaints, and AI actions count.
- `GET /api/dashboard/urgent-issues` — Protected (Owner only). List of priority warning logs.
- `GET /api/dashboard/ai-activity` — Protected (Owner only). AI pilot automation action logs.
