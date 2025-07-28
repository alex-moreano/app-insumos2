const express = require('express');
const router = express.Router();
const { 
  createSupplier, 
  getSuppliers, 
  getSupplierById, 
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getSuppliers)
  .post(protect, createSupplier);

router.route('/:id')
  .get(protect, getSupplierById)
  .put(protect, updateSupplier)
  .delete(protect, admin, deleteSupplier);

module.exports = router;