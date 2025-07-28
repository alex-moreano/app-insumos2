const asyncHandler = require('express-async-handler');
const Movement = require('../models/movementModel');
const Product = require('../models/productModel');
const Warehouse = require('../models/warehouseModel');
const Supplier = require('../models/supplierModel');
const Kardex = require('../models/kardexModel');

// @desc    Create new movement (ingreso/egreso)
// @route   POST /api/movements
// @access  Private
const createMovement = asyncHandler(async (req, res) => {
  const { 
    type, 
    date, 
    warehouseId, 
    supplierId, 
    requestedBy, 
    lines 
  } = req.body;

  if (!type || !date || !warehouseId || !lines || lines.length === 0) {
    res.status(400);
    throw new Error('Por favor complete todos los campos obligatorios');
  }

  // Validate warehouse exists
  const warehouse = await Warehouse.findById(warehouseId);
  if (!warehouse) {
    res.status(404);
    throw new Error('Almacén no encontrado');
  }

  // Validate supplier if provided
  let supplier = null;
  if (supplierId) {
    supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      res.status(404);
      throw new Error('Proveedor no encontrado');
    }
  }

  // Validate all products in lines exist
  const productIds = lines.map(line => line.productId);
  const products = await Product.find({ _id: { $in: productIds } });
  
  if (products.length !== productIds.length) {
    res.status(404);
    throw new Error('Uno o más productos no fueron encontrados');
  }

  // Create a map of product IDs to their current stock
  const productMap = {};
  products.forEach(product => {
    productMap[product._id.toString()] = {
      name: product.name,
      currentStock: product.currentStock
    };
  });

  // Process the movement lines
  const processedLines = lines.map(line => ({
    productId: line.productId,
    productName: productMap[line.productId].name,
    quantity: line.quantity,
    lot: line.lot || null,
    expiryDate: line.expiryDate || null,
    unitCost: line.unitCost || null,
    note: line.note || null
  }));

  // Create the movement
  const movement = await Movement.create({
    type,
    date: new Date(date),
    warehouseId,
    warehouseName: warehouse.name,
    supplierId: supplier ? supplier._id : null,
    supplierName: supplier ? supplier.name : null,
    requestedBy,
    lines: processedLines,
    totalItems: processedLines.reduce((sum, line) => sum + line.quantity, 0),
    createdBy: req.user._id
  });

  if (movement) {
    // Update product stock and create kardex entries
    for (const line of processedLines) {
      const product = await Product.findById(line.productId);
      const previousStock = product.currentStock;
      
      // Update product stock
      if (type === 'ingreso') {
        product.currentStock += line.quantity;
      } else if (type === 'egreso') {
        if (product.currentStock < line.quantity) {
          res.status(400);
          throw new Error(`Stock insuficiente para ${product.name}`);
        }
        product.currentStock -= line.quantity;
      }
      
      await product.save();
      
      // Create kardex entry
      await Kardex.create({
        date: new Date(date),
        movementId: movement._id,
        type,
        productId: line.productId,
        warehouseId,
        quantity: line.quantity,
        previousStock,
        currentStock: product.currentStock,
        lot: line.lot || null,
        unitCost: line.unitCost || null,
        createdBy: req.user._id
      });
    }
    
    res.status(201).json(movement);
  } else {
    res.status(400);
    throw new Error('No se pudo crear el movimiento');
  }
});

// @desc    Get all movements
// @route   GET /api/movements
// @access  Private
const getMovements = asyncHandler(async (req, res) => {
  const movements = await Movement.find({})
    .populate('createdBy', 'name')
    .sort({ date: -1 });
  res.json(movements);
});

// @desc    Get movement by ID
// @route   GET /api/movements/:id
// @access  Private
const getMovementById = asyncHandler(async (req, res) => {
  const movement = await Movement.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

  if (movement) {
    res.json(movement);
  } else {
    res.status(404);
    throw new Error('Movimiento no encontrado');
  }
});

// @desc    Cancel movement
// @route   PUT /api/movements/:id/cancel
// @access  Private/Admin
const cancelMovement = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;
  
  if (!cancellationReason) {
    res.status(400);
    throw new Error('Por favor ingrese un motivo de cancelación');
  }

  const movement = await Movement.findById(req.params.id);

  if (!movement) {
    res.status(404);
    throw new Error('Movimiento no encontrado');
  }

  if (movement.status === 'cancelled') {
    res.status(400);
    throw new Error('El movimiento ya está cancelado');
  }

  // Update the movement status
  movement.status = 'cancelled';
  movement.cancellationReason = cancellationReason;
  movement.updatedBy = req.user._id;
  movement.updatedAt = Date.now();

  // Revert the stock changes
  for (const line of movement.lines) {
    const product = await Product.findById(line.productId);
    
    if (movement.type === 'ingreso') {
      product.currentStock -= line.quantity;
    } else if (movement.type === 'egreso') {
      product.currentStock += line.quantity;
    }
    
    await product.save();
    
    // Create a reversal kardex entry
    await Kardex.create({
      date: new Date(),
      movementId: movement._id,
      type: movement.type === 'ingreso' ? 'egreso' : 'ingreso', // Reverse the type
      productId: line.productId,
      warehouseId: movement.warehouseId,
      quantity: line.quantity,
      previousStock: product.currentStock + (movement.type === 'ingreso' ? line.quantity : -line.quantity),
      currentStock: product.currentStock,
      lot: line.lot || null,
      unitCost: line.unitCost || null,
      createdBy: req.user._id
    });
  }

  await movement.save();
  res.json(movement);
});

module.exports = {
  createMovement,
  getMovements,
  getMovementById,
  cancelMovement
};