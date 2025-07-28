const express = require('express');
const router = express.Router();
const { 
  getInventoryReport,
  getMovementReport,
  getConsumptionReport,
  getDashboardStats,
  getRotationReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.route('/inventory')
  .get(protect, getInventoryReport);

router.route('/movements')
  .get(protect, getMovementReport);

router.route('/consumption')
  .get(protect, getConsumptionReport);

router.route('/rotation')
  .get(protect, getRotationReport);

router.route('/dashboard')
  .get(protect, getDashboardStats);

module.exports = router;