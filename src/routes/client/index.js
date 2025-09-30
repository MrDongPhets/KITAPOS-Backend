const express = require('express');
const router = express.Router();
const { authenticateToken, requireClient } = require('../../middleware/auth');

const dashboardRoutes = require('./dashboard');
const productsRoutes = require('./products');
const categoriesRoutes = require('./categories');
const uploadRoutes = require('./upload');
const storesRoutes = require('./stores');

// Apply authentication to all client routes
router.use(authenticateToken);
router.use(requireClient);

// Mount client routes
router.use('/dashboard', dashboardRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/upload', uploadRoutes);
router.use('/stores', storesRoutes);


module.exports = router;