const express = require('express');
const router = express.Router();
const { authenticateToken, requireSuperAdmin } = require('../../middleware/auth');

const companiesRoutes = require('./companies');
const usersRoutes = require('./users');
const statsRoutes = require('./stats');

// Apply authentication to all admin routes
router.use(authenticateToken);
router.use(requireSuperAdmin);

// Mount admin routes
router.use('/companies', companiesRoutes);
router.use('/users', usersRoutes);
router.use('/stats', statsRoutes);

module.exports = router;