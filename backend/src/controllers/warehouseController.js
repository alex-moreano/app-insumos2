const asyncHandler = require('express-async-handler');
const Warehouse = require('../models/warehouseModel');

// @desc    Create new warehouse
// @route   POST /api/warehouses
// @access  Private/Admin
const createWarehouse = asyncHandler(async (req, res) => {
  const { name, location, description } = req.body;

  if (!name || !location) {
    res.status(400);
    throw new Error('Por favor ingrese nombre y ubicación');
  }

  // Check if warehouse already exists
  const warehouseExists = await Warehouse.findOne({ name });

  if (warehouseExists) {
    res.status(400);
    throw new Error('Ya existe un almacén con ese nombre');
  }

  const warehouse = await Warehouse.create({
    name,
    location,
    description
  });

  if (warehouse) {
    res.status(201).json(warehouse);
  } else {
    res.status(400);
    throw new Error('Datos de almacén inválidos');
  }
});

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
const getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await Warehouse.find({});
  res.json(warehouses);
});

// @desc    Get warehouse by ID
// @route   GET /api/warehouses/:id
// @access  Private
const getWarehouseById = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);

  if (warehouse) {
    res.json(warehouse);
  } else {
    res.status(404);
    throw new Error('Almacén no encontrado');
  }
});

// @desc    Update warehouse
// @route   PUT /api/warehouses/:id
// @access  Private/Admin
const updateWarehouse = asyncHandler(async (req, res) => {
  const { name, location, description, isActive } = req.body;
  
  const warehouse = await Warehouse.findById(req.params.id);

  if (warehouse) {
    // If name is being changed, check for uniqueness
    if (name && name !== warehouse.name) {
      const nameExists = await Warehouse.findOne({ name });
      if (nameExists) {
        res.status(400);
        throw new Error('Ya existe un almacén con ese nombre');
      }
    }

    warehouse.name = name || warehouse.name;
    warehouse.location = location || warehouse.location;
    warehouse.description = description !== undefined ? description : warehouse.description;
    warehouse.isActive = isActive !== undefined ? isActive : warehouse.isActive;
    warehouse.updatedAt = Date.now();

    const updatedWarehouse = await warehouse.save();
    res.json(updatedWarehouse);
  } else {
    res.status(404);
    throw new Error('Almacén no encontrado');
  }
});

// @desc    Delete warehouse
// @route   DELETE /api/warehouses/:id
// @access  Private/Admin
const deleteWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findById(req.params.id);

  if (warehouse) {
    // Instead of hard deleting, set to inactive
    warehouse.isActive = false;
    warehouse.updatedAt = Date.now();
    await warehouse.save();
    res.json({ message: 'Almacén desactivado' });
  } else {
    res.status(404);
    throw new Error('Almacén no encontrado');
  }
});

module.exports = {
  createWarehouse,
  getWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse
};