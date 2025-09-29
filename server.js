// server.js - Updated with better error handling and diagnostics
require('dotenv').config();
const express = require('express');
const { initializeDatabase } = require('./src/config/database');
const { configureCORS } = require('./src/config/cors');
const { requestLogger } = require('./src/middleware/logger');
const { errorHandler } = require('./src/middleware/errorHandler');
const routes = require('./src/routes');
const { ensureDemoData } = require('./src/services/demoDataService');
const uploadRoutes = require('./src/routes/client/upload');


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(configureCORS());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use('/api/client/upload', uploadRoutes);

// Add diagnostic route (only in development or with special header)
app.get('/diagnostic', (req, res) => {
  if (process.env.NODE_ENV !== 'production' || req.headers['x-diagnostic-key'] === process.env.JWT_SECRET) {
    const diagnostic = require('./src/routes/diagnostic');
    return diagnostic(req, res);
  }
  res.status(404).json({ error: 'Not found' });
});

// Mount all routes
app.use('/', routes);

// Error Handler
app.use(errorHandler);

// 404 Handler - More detailed in development
app.use('*', (req, res) => {
  const response = { 
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  };
  
  if (process.env.NODE_ENV !== 'production') {
    response.availableEndpoints = {
      health: 'GET /health',
      auth: [
        'POST /auth/login',
        'POST /auth/super-admin/login',
        'POST /auth/register-company',
        'GET /auth/verify',
        'POST /auth/logout'
      ],
      admin: [
        'GET /admin/companies',
        'GET /admin/users',
        'GET /admin/stats/users',
        'GET /admin/stats/subscriptions'
      ]
    };
  }
  
  res.status(404).json(response);
});

// Initialize and Start Server
async function startServer() {
  console.log('🚀 Starting POS System API Server...');
  console.log(`🔍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Port: ${PORT}`);
  
  // Initialize Database
  const dbInitialized = await initializeDatabase();
  
  if (dbInitialized) {
    // Ensure demo data exists
    await ensureDemoData();
  } else {
    console.error('❌ Failed to initialize database. Server running in degraded mode.');
  }
  
  const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📱 API Base: ${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${PORT}`}`);
    console.log(`🔍 Health check: ${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${PORT}`}/health`);
    console.log('');
    console.log('📋 Available Endpoints:');
    console.log('   Auth: /auth/login, /auth/super-admin/login, /auth/register-company');
    console.log('   Admin: /admin/companies, /admin/users, /admin/stats/*');
    console.log('');
    console.log('📋 Demo Credentials:');
    console.log('   Business User: manager@demobakery.com / password123');
    console.log('   Super Admin: admin@system.com / superadmin123');
    console.log('✅ Server ready to accept connections');
  });

  process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('✅ Process terminated');
    });
  });
}

startServer();

module.exports = app;