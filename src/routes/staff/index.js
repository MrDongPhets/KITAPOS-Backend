const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');

const authRoutes = require('./auth');
const manageRoutes = require('./manage'); // Make sure this line exists

// Public staff routes (login)
router.use('/auth', authRoutes);

// Protected staff management routes (managers only)
router.use('/manage', manageRoutes); // Make sure this line exists

module.exports = router;