const express = require('express');
const router = express.Router();

const loginRoutes = require('./login');
const registerRoutes = require('./register');
const verifyRoutes = require('./verify');

router.use('/', loginRoutes);
router.use('/', registerRoutes);
router.use('/', verifyRoutes);

module.exports = router;