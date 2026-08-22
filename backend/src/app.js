const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
// Load .env relative to this file's location so Vercel (CWD = project root) also finds it
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('./db');

const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const complaintRoutes = require('./routes/complaints');
const taskRoutes = require('./routes/tasks');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');
const activityLogRoutes = require('./routes/activityLogs');
const aiRoutes = require('./routes/ai');
const errorHandler = require('./middleware/errorHandler');
const { checkAndEscalateOverdue } = require('./agents/MonitoringAgent');

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (origin === allowedOrigin || origin.includes('localhost') || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Body parsing
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint for API
app.get('/api/health', (req, res) => {
  res.json({ status: 'active', message: 'OrderPilot AI Backend API is running on single-port mode' });
});

// Serve frontend static build files if available
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  // SPA Catch-all Route: serve index.html for non-API routes to support React Router refresh
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ status: 'active', message: 'OrderPilot AI Backend Server is running. (Build frontend to enable single-port React app)' });
  });
}

// Error handling middleware
app.use(errorHandler);

// Start server and Periodic Monitoring Agent (every 5 minutes)
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` OrderPilot AI Single-Port App running on Port ${PORT} `);
  console.log(` Web Application: http://localhost:${PORT}`);
  console.log(` API Endpoints:   http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
  
  // Run a one-time database cleanup for duplicates on startup
  (async () => {
    try {
      console.log('Running startup database cleanup...');
      const notifRes = await db.query(`
        DELETE FROM notifications 
        WHERE id NOT IN (
          SELECT MAX(id) 
          FROM notifications 
          GROUP BY receiver, message, type
        )
      `);
      const activityRes = await db.query(`
        DELETE FROM activity_logs 
        WHERE id NOT IN (
          SELECT MAX(id) 
          FROM activity_logs 
          GROUP BY action, performed_by, (details->>'taskId'), (details->>'orderId'), (details->>'complaintId')
        )
      `);
      console.log(`Startup database cleanup completed: Deleted ${notifRes.rowCount || 0} notifications, ${activityRes.rowCount || 0} activity logs.`);
    } catch (err) {
      console.error('Error during startup database cleanup:', err.message);
    }
  })();

  // Run background monitoring task periodically
  setInterval(() => {
    checkAndEscalateOverdue();
  }, 5 * 60 * 1000);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`\n❌ ERROR: Port ${PORT} is already in use.`);
    console.error(`❌ Please check if another backend instance is running, or change the PORT in your .env file.\n`);
    process.exit(1);
  } else {
    console.error('Server error:', e);
  }
});

module.exports = app;
