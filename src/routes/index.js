// src/routes/index.js
const express = require('express');
const router = express.Router();
const { API_VERSION, DEMO_CREDENTIALS } = require('../config/constants');

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const healthRoute = require('./health');
const clientRoutes = require('./client');
const posRoutes = require('./pos');
const staffRoutes = require('./staff'); // ✅ ADD THIS LINE

// Root endpoint
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
      },
      client: {
        dashboard: 'GET /client/dashboard/*',
        products: 'GET /client/products',
        categories: 'GET /client/categories',
        stores: 'GET /client/stores'
      },
      pos: {
        products: 'GET /pos/products/category',
        search: 'GET /pos/products/search',
        sales: 'POST /pos/sales',
        todaySales: 'GET /pos/sales/today'
      },
      staff: { // ✅ ADD THIS
        login: 'POST /staff/auth/login',
        verify: 'GET /staff/auth/verify'
      }
    },
    demo_credentials: process.env.NODE_ENV !== 'production' ? DEMO_CREDENTIALS : 'Hidden in production'
  });
});

// Mount routes
router.use('/health', healthRoute);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/client', clientRoutes);
router.use('/pos', posRoutes);
router.use('/staff', staffRoutes); // ✅ ADD THIS LINE

module.exports = router;