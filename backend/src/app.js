const express = require('express');
const cors = require('cors');
require('dotenv').config();

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
const PORT = process.env.PORT || 5000;

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/ai', aiRoutes);

// Root route check
app.get('/', (req, res) => {
  res.json({ status: 'active', message: 'OrderPilot AI Enterprise Multi-Agent Backend Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start server and Periodic Monitoring Agent (every 5 minutes)
app.listen(PORT, () => {
  console.log(`OrderPilot AI Backend running on port ${PORT}`);
  
  // Run background monitoring task periodically
  setInterval(() => {
    checkAndEscalateOverdue();
  }, 5 * 60 * 1000);
});

module.exports = app;
