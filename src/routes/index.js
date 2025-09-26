const express = require('express');
const router = express.Router();
const { API_VERSION, DEMO_CREDENTIALS } = require('../config/constants');

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const healthRoute = require('./health');

// Root endpoint
router.get('/', (req, res) => {
  res.json({ 
    message: 'POS System API - Modular Version',
    status: 'active',
    timestamp: new Date().toISOString(),
    version: API_VERSION,
    port: process.env.PORT || 3001,
    demo_credentials: DEMO_CREDENTIALS,
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
        userStats: 'GET /admin/stats/users',
        subscriptionStats: 'GET /admin/stats/subscriptions'
      }
    }
  });
});

// Mount routes
router.use('/health', healthRoute);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

module.exports = router;