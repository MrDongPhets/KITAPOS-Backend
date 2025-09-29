const express = require('express');
const router = express.Router();
const { authenticateToken, requireClient } = require('../../middleware/auth');

const dashboardRoutes = require('./dashboard');
const productsRoutes = require('./products');
const uploadRoutes = require('./upload');

// Apply authentication to all client routes
router.use(authenticateToken);
router.use(requireClient);

// Mount client routes
router.use('/dashboard', dashboardRoutes);
router.use('/products', productsRoutes);
router.use('/upload', uploadRoutes);


module.exports = router;