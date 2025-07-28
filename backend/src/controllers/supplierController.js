const asyncHandler = require('express-async-handler');
const Supplier = require('../models/supplierModel');

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private
const createSupplier = asyncHandler(async (req, res) => {
  const { name, contactPerson, phone, email, address } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Por favor ingrese un nombre para el proveedor');
  }

  // Check if supplier already exists
  const supplierExists = await Supplier.findOne({ name });

  if (supplierExists) {
    res.status(400);
    throw new Error('Ya existe un proveedor con ese nombre');
  }

  const supplier = await Supplier.create({
    name,
    contactPerson,
    phone,
    email,
    address
  });

  if (supplier) {
    res.status(201).json(supplier);
  } else {
    res.status(400);
    throw new Error('Datos de proveedor inválidos');
  }
});

// @desc    Get all suppliers
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({});
  res.json(suppliers);
});

// @desc    Get supplier by ID
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplierById = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (supplier) {
    res.json(supplier);
  } else {
    res.status(404);
    throw new Error('Proveedor no encontrado');
  }
});

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private
const updateSupplier = asyncHandler(async (req, res) => {
  const { name, contactPerson, phone, email, address, isActive } = req.body;
  
  const supplier = await Supplier.findById(req.params.id);

  if (supplier) {
    // If name is being changed, check for uniqueness
    if (name && name !== supplier.name) {
      const nameExists = await Supplier.findOne({ name });
      if (nameExists) {
        res.status(400);
        throw new Error('Ya existe un proveedor con ese nombre');
      }
    }

    supplier.name = name || supplier.name;
    supplier.contactPerson = contactPerson !== undefined ? contactPerson : supplier.contactPerson;
    supplier.phone = phone !== undefined ? phone : supplier.phone;
    supplier.email = email !== undefined ? email : supplier.email;
    supplier.address = address !== undefined ? address : supplier.address;
    supplier.isActive = isActive !== undefined ? isActive : supplier.isActive;
    supplier.updatedAt = Date.now();

    const updatedSupplier = await supplier.save();
    res.json(updatedSupplier);
  } else {
    res.status(404);
    throw new Error('Proveedor no encontrado');
  }
});

// @desc    Delete supplier
// @route   DELETE /api/suppliers/:id
// @access  Private/Admin
const deleteSupplier = asyncHandler(async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);

  if (supplier) {
    // Instead of hard deleting, set to inactive
    supplier.isActive = false;
    supplier.updatedAt = Date.now();
    await supplier.save();
    res.json({ message: 'Proveedor desactivado' });
  } else {
    res.status(404);
    throw new Error('Proveedor no encontrado');
  }
});

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier
};