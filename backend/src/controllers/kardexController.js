const asyncHandler = require('express-async-handler');
const Kardex = require('../models/kardexModel');
const Product = require('../models/productModel');
const Warehouse = require('../models/warehouseModel');

// @desc    Get kardex entries for a product
// @route   GET /api/kardex
// @access  Private
const getKardexEntries = asyncHandler(async (req, res) => {
  const { productId, warehouseId, startDate, endDate } = req.query;

  // Build query filter
  const filter = {};
  
  if (productId) {
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Producto no encontrado');
    }
    filter.productId = productId;
  }
  
  if (warehouseId) {
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      res.status(404);
      throw new Error('Almacén no encontrado');
    }
    filter.warehouseId = warehouseId;
  }

  if (startDate) {
    filter.date = { $gte: new Date(startDate) };
  }
  
  if (endDate) {
    filter.date = { ...filter.date, $lte: new Date(endDate) };
  }

  const kardexEntries = await Kardex.find(filter)
    .populate('productId', 'name code')
    .populate('warehouseId', 'name')
    .populate('createdBy', 'name')
    .sort({ date: -1 });

  res.json(kardexEntries);
});

// @desc    Get kardex entry by ID
// @route   GET /api/kardex/:id
// @access  Private
const getKardexById = asyncHandler(async (req, res) => {
  const kardex = await Kardex.findById(req.params.id)
    .populate('productId', 'name code')
    .populate('warehouseId', 'name')
    .populate('movementId')
    .populate('createdBy', 'name');

  if (kardex) {
    res.json(kardex);
  } else {
    res.status(404);
    throw new Error('Registro de kardex no encontrado');
  }
});

// @desc    Get product balance
// @route   GET /api/kardex/balance/:productId
// @access  Private
const getProductBalance = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { warehouseId } = req.query;

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Producto no encontrado');
  }

  // Build query filter
  const filter = { productId };
  
  if (warehouseId) {
    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      res.status(404);
      throw new Error('Almacén no encontrado');
    }
    filter.warehouseId = warehouseId;
  }

  // Get latest kardex entry
  const latestKardex = await Kardex.findOne(filter)
    .sort({ date: -1 })
    .populate('warehouseId', 'name');

  // Summarize by warehouse if no specific warehouse is requested
  let warehouseSummary = [];
  
  if (!warehouseId) {
    const warehouses = await Warehouse.find({});
    
    // For each warehouse, get the latest kardex entry for this product
    for (const warehouse of warehouses) {
      const latestEntry = await Kardex.findOne({
        productId,
        warehouseId: warehouse._id
      }).sort({ date: -1 });
      
      if (latestEntry) {
        warehouseSummary.push({
          warehouseId: warehouse._id,
          warehouseName: warehouse.name,
          currentStock: latestEntry.currentStock,
          lastUpdate: latestEntry.date
        });
      }
    }
  }

  res.json({
    product: {
      id: product._id,
      code: product.code,
      name: product.name,
      unit: product.unit,
      category: product.category
    },
    currentStock: latestKardex ? latestKardex.currentStock : 0,
    warehouse: latestKardex && warehouseId ? {
      id: latestKardex.warehouseId._id,
      name: latestKardex.warehouseId.name
    } : null,
    lastUpdate: latestKardex ? latestKardex.date : null,
    warehouseSummary: !warehouseId ? warehouseSummary : null
  });
});

module.exports = {
  getKardexEntries,
  getKardexById,
  getProductBalance
};