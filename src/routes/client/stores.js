// src/routes/client/stores.js
const express = require('express');
const router = express.Router();
const { getStores, requestStore } = require('../../controllers/client/storesController');

// GET /client/stores
router.get('/', getStores);

// POST /client/stores/request
router.post('/request', requestStore);

module.exports = router;