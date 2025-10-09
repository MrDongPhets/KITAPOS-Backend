// src/routes/reports/sales.js
const express = require('express');
const router = express.Router();

// Import controllers
const {
  getSalesReports,
  getSalesReportByPeriod,
  getTopProducts,
  getStaffPerformance,
  getSalesComparison
} = require('../../controllers/reports/salesReportsController');

// GET /reports/sales - Get sales summary
router.get('/', getSalesReports);

// GET /reports/sales/period - Get sales by period (daily/weekly/monthly)
router.get('/period', getSalesReportByPeriod);

// GET /reports/sales/top-products - Get top selling products
router.get('/top-products', getTopProducts);

// GET /reports/sales/staff-performance - Get staff performance
router.get('/staff-performance', getStaffPerformance);

// GET /reports/sales/comparison - Compare sales across periods
router.get('/comparison', getSalesComparison);

module.exports = router;