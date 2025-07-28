const express = require('express');
const router = express.Router();
const { 
  createMovement, 
  getMovements, 
  getMovementById, 
  cancelMovement
} = require('../controllers/movementController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getMovements)
  .post(protect, createMovement);

router.route('/:id')
  .get(protect, getMovementById);

router.route('/:id/cancel')
  .put(protect, admin, cancelMovement);

module.exports = router;