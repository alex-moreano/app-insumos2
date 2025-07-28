const asyncHandler = require('express-async-handler');
//const Intake = require('../models/intakeModel');
const Product = require('../models/productModel');
const Supplier = require('../models/supplierModel');
const Warehouse = require('../models/warehouseModel');
const Movement = require('../models/movementModel');

// @desc    Create new intake
// @route   POST /api/intakes
// @access  Private
const createIntake = asyncHandler(async (req, res) => {
  const { 
    date, 
    warehouseId, 
    supplierId, 
    invoiceNumber,
    items 
  } = req.body;

  if (!date || !warehouseId || !supplierId || !items || items.length === 0) {
    res.status(400);
    throw new Error('Por favor complete todos los campos obligatorios');
  }

  // Validate warehouse exists
  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) {
    res.status(404);
    throw new Error('Almacén no encontrado');
  }

  // Validate supplier exists
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    res.status(404);
    throw new Error('Proveedor no encontrado');
  }

  // Validate all products in items exist
  const productIds = items.map(item => item.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  
  if (products.length !== productIds.length) {
    res.status(404);
    throw new Error('Uno o más productos no fueron encontrados');
  }

  // Create a map of product IDs to their names
  const productMap = {};
  products.forEach(product => {
    productMap[product._id.toString()] = product.name;
  });

  // Process the intake items
  const processedItems = items.map(item => ({
    productId: item.productId,
    productName: productMap[item.productId],
    quantity: item.quantity,
    unitCost: item.unitCost,
    lot: item.lot || null,
    expiryDate: item.expiryDate || null
  }));

  // Create the intake
  const intake = await Intake.create({
    date: new Date(date),
    warehouseId,
    warehouseName: warehouse.name,
    supplierId,
    supplierName: supplier.name,
    invoiceNumber,
    items: processedItems,
    totalItems: processedItems.reduce((sum, item) => sum + item.quantity, 0),
    totalCost: processedItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0),
    createdBy: req.user._id
  });

  if (intake) {
    // Create corresponding movement
    const movementLines = processedItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      lot: item.lot,
      expiryDate: item.expiryDate,
      unitCost: item.unitCost
    }));

    const movement = await Movement.create({
      type: 'ingreso',
      date: new Date(date),
      warehouseId,
      warehouseName: warehouse.name,
      supplierId,
      supplierName: supplier.name,
      reference: `Ingreso - Factura ${invoiceNumber || 'S/N'}`,
      lines: movementLines,
      totalItems: intake.totalItems,
      createdBy: req.user._id,
      intakeId: intake._id
    });

    // Update intake with movement reference
    intake.movementId = movement._id;
    await intake.save();
    
    res.status(201).json(intake);
  } else {
    res.status(400);
    throw new Error('No se pudo crear el ingreso');
  }
});

// @desc    Get all intakes
// @route   GET /api/intakes
// @access  Private
const getIntakes = asyncHandler(async (req, res) => {
  const intakes = await Intake.find({})
    .populate('createdBy', 'name')
    .sort({ date: -1 });
  res.json(intakes);
});

// @desc    Get intake by ID
// @route   GET /api/intakes/:id
// @access  Private
const getIntakeById = asyncHandler(async (req, res) => {
  const intake = await Intake.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

  if (intake) {
    res.json(intake);
  } else {
    res.status(404);
    throw new Error('Ingreso no encontrado');
  }
});

// @desc    Cancel intake
// @route   PUT /api/intakes/:id/cancel
// @access  Private/Admin
const cancelIntake = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;
  
  if (!cancellationReason) {
    res.status(400);
    throw new Error('Por favor ingrese un motivo de cancelación');
  }

  const intake = await Intake.findById(req.params.id);

  if (!intake) {
    res.status(404);
    throw new Error('Ingreso no encontrado');
  }

  if (intake.status === 'cancelled') {
    res.status(400);
    throw new Error('El ingreso ya está cancelado');
  }

  // Update the intake status
  intake.status = 'cancelled';
  intake.cancellationReason = cancellationReason;
  intake.updatedBy = req.user._id;
  intake.updatedAt = Date.now();

  // If there's an associated movement, cancel that as well
  if (intake.movementId) {
    const movement = await Movement.findById(intake.movementId);
    if (movement) {
      movement.status = 'cancelled';
      movement.cancellationReason = `Cancelación de ingreso: ${cancellationReason}`;
      movement.updatedBy = req.user._id;
      movement.updatedAt = Date.now();
      await movement.save();
    }
  }

  await intake.save();
  res.json(intake);
});

module.exports = {
  createIntake,
  getIntakes,
  getIntakeById,
  cancelIntake
};