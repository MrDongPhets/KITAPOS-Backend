// src/routes/auth/index.js - Ensure all routes are properly mounted
const express = require('express');
const router = express.Router();

// Import route handlers
const { 
  clientLogin, 
  superAdminLogin, 
  logout 
} = require('../../controllers/auth/loginController');
const { registerCompany } = require('../../controllers/auth/registerController');
const { authenticateToken } = require('../../middleware/auth');
const { verifyToken, cleanup } = require('../../controllers/auth/verifyController');

// Login routes
router.post('/login', clientLogin);
router.post('/super-admin/login', superAdminLogin);
router.post('/logout', logout);

// Registration route
router.post('/register-company', registerCompany);

// Verification routes
router.get('/verify', authenticateToken, verifyToken);
router.post('/cleanup', authenticateToken, cleanup);



module.exports = router;