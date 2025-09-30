// src/routes/index.js - Fixed to show all correct endpoints
const express = require('express');
const router = express.Router();
const { API_VERSION, DEMO_CREDENTIALS } = require('../config/constants');

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const healthRoute = require('./health');
const clientRoutes = require('./client');





// Root endpoint - FIXED to show actual available endpoints
router.get('/', (req, res) => {
  res.json({ 
    message: 'POS System API - Modular Version',
    status: 'active',
    timestamp: new Date().toISOString(),
    version: API_VERSION,
    environment: process.env.NODE_ENV || 'production',
    endpoints: {
      health: 'GET /health',
      auth: {
        login: 'POST /auth/login',
        superAdminLogin: 'POST /auth/super-admin/login',
        verify: 'GET /auth/verify',
        registerCompany: 'POST /auth/register-company',
        logout: 'POST /auth/logout'
      },
      admin: {
        companies: 'GET /admin/companies',
        users: 'GET /admin/users',
        userStats: 'GET /admin/stats/users',
        subscriptionStats: 'GET /admin/stats/subscriptions'
      }
    },
    demo_credentials: process.env.NODE_ENV !== 'production' ? DEMO_CREDENTIALS : 'Hidden in production'
  });
});

// Mount routes - ensure these are all properly mounted
router.use('/health', healthRoute);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/client', clientRoutes);


module.exports = router;