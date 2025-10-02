const express = require('express');
const router = express.Router();
const { staffLogin, verifyStaffToken } = require('../../controllers/staff/staffAuthController');
const { authenticateToken } = require('../../middleware/auth');

// Staff authentication routes
router.post('/login', staffLogin);
router.get('/verify', authenticateToken, verifyStaffToken);

module.exports = router;