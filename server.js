require('dotenv').config();
const express = require('express');
const { initializeDatabase } = require('./src/config/database');
const { configureCORS } = require('./src/config/cors');
const { requestLogger } = require('./src/middleware/logger');
const { errorHandler } = require('./src/middleware/errorHandler');
const routes = require('./src/routes');
const { ensureDemoData } = require('./src/services/demoDataService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(configureCORS());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);

// Routes - No /api prefix for Vercel compatibility
app.use('/', routes);

// Error Handler
app.use(errorHandler);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method
  });
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
    console.log(`📱 Local API: http://localhost:${PORT}`);
    console.log(`🔍 Health check: http://localhost:${PORT}/health`);
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