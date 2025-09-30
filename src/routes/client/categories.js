// src/routes/client/categories.js
const express = require('express');
const router = express.Router();
const { 
  getCategories, 
  getCategory, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} = require('../../controllers/client/categoriesController');

// GET /client/categories
router.get('/', getCategories);

// GET /client/categories/:id
router.get('/:id', getCategory);

// POST /client/categories
router.post('/', createCategory);

// PUT /client/categories/:id
router.put('/:id', updateCategory);

// DELETE /client/categories/:id
router.delete('/:id', deleteCategory);

module.exports = router;