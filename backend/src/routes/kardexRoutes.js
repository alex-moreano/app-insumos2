const express = require('express');
const router = express.Router();
const { 
  getKardexEntries,
  getKardexById,
  getProductBalance
} = require('../controllers/kardexController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getKardexEntries);

router.route('/:id')
  .get(protect, getKardexById);

router.route('/balance/:productId')
  .get(protect, getProductBalance);

module.exports = router;