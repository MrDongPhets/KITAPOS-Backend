const express = require('express');
const router = express.Router();
const { authenticateToken, requireClient } = require('../../middleware/auth');

const dashboardRoutes = require('./dashboard');

// Apply authentication to all client routes
router.use(authenticateToken);
router.use(requireClient);

// Mount client routes
router.use('/dashboard', dashboardRoutes);

module.exports = router;