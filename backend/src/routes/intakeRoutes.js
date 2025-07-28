const express = require('express');
const router = express.Router();
const { 
  createIntake, 
  getIntakes, 
  getIntakeById, 
  cancelIntake
} = require('../controllers/intakeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getIntakes)
  .post(protect, createIntake);

router.route('/:id')
  .get(protect, getIntakeById);

router.route('/:id/cancel')
  .put(protect, admin, cancelIntake);

module.exports = router;