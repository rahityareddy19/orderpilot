// Vercel serverless function entry point
// This file bridges Vercel's /api/* serverless routing to the Express app
const app = require('../backend/src/app');

module.exports = app;
