const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const Movement = require('../models/movementModel');
const Kardex = require('../models/kardexModel');

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private
const getInventoryReport = asyncHandler(async (req, res) => {
  const products = await Product.find({}).populate('category', 'name');
  
  const report = products.map(product => ({
    productId: product._id,
    productCode: product.code,
    productName: product.name,
    category: product.category ? product.category.name : 'Sin categoría',
    unit: product.unit,
    totalStock: product.currentStock
  }));
  
  res.json(report);
});

// @desc    Get movement report
// @route   GET /api/reports/movements
// @access  Private
const getMovementReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, warehouseId, productId } = req.query;
  
  // Build filter
  const filter = {};
  
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (startDate) {
    filter.date = { $gte: new Date(startDate) };
  } else if (endDate) {
    filter.date = { $lte: new Date(endDate) };
  }
  
  if (type) {
    filter.type = type;
  }
  
  if (warehouseId) {
    filter.warehouseId = warehouseId;
  }

  // Get all movements that match the filter
  let movements = await Movement.find(filter)
    .populate('warehouseId', 'name')
    .populate('lines.productId', 'name code')
    .sort({ date: -1 });
  
  // If productId filter is applied, filter the lines array
  if (productId) {
    movements = movements.map(movement => {
      return {
        ...movement._doc,
        lines: movement.lines.filter(line => line.productId._id.toString() === productId)
      };
    }).filter(movement => movement.lines.length > 0);
  }
  
  // Format the report
  const report = [];
  
  movements.forEach(movement => {
    movement.lines.forEach(line => {
      report.push({
        date: movement.date.toISOString(),
        type: movement.type,
        movementId: movement._id,
        warehouseName: movement.warehouseId.name,
        productName: line.productId.name,
        productCode: line.productId.code,
        quantity: line.quantity,
        status: movement.status,
        createdBy: movement.createdBy
      });
    });
  });
  
  res.json(report);
});

// @desc    Get consumption report
// @route   GET /api/reports/consumption
// @access  Private
const getConsumptionReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;
  
  // Build filter for outgoing movements only
  const filter = {
    type: 'egreso', // Only count outgoing items as consumption
    status: 'active' // Only count active movements (not cancelled)
  };
  
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (startDate) {
    filter.date = { $gte: new Date(startDate) };
  } else if (endDate) {
    filter.date = { $lte: new Date(endDate) };
  }
  
  // Get all outgoing movements
  const movements = await Movement.find(filter)
    .populate('warehouseId', 'name')
    .populate('lines.productId', 'name code category')
    .sort({ date: -1 });
  
  // Group consumption data
  let consumptionData = {};
  
  // Default group by product
  if (!groupBy || groupBy === 'product') {
    movements.forEach(movement => {
      movement.lines.forEach(line => {
        const productId = line.productId._id.toString();
        const productName = line.productId.name;
        const productCode = line.productId.code;
        
        if (!consumptionData[productId]) {
          consumptionData[productId] = {
            productId,
            productName,
            productCode,
            totalQuantity: 0,
            movementCount: 0
          };
        }
        
        consumptionData[productId].totalQuantity += line.quantity;
        consumptionData[productId].movementCount += 1;
      });
    });
  } 
  // Group by category
  else if (groupBy === 'category') {
    movements.forEach(movement => {
      movement.lines.forEach(line => {
        const category = line.productId.category ? line.productId.category.toString() : 'uncategorized';
        const categoryName = line.productId.category ? line.productId.category.name : 'Sin categoría';
        
        if (!consumptionData[category]) {
          consumptionData[category] = {
            categoryId: category,
            categoryName: categoryName,
            totalQuantity: 0,
            movementCount: 0,
            products: {}
          };
        }
        
        const productId = line.productId._id.toString();
        
        if (!consumptionData[category].products[productId]) {
          consumptionData[category].products[productId] = {
            productId,
            productName: line.productId.name,
            productCode: line.productId.code,
            quantity: 0
          };
        }
        
        consumptionData[category].totalQuantity += line.quantity;
        consumptionData[category].products[productId].quantity += line.quantity;
        consumptionData[category].movementCount += 1;
      });
    });
    
    // Convert products object to array for each category
    Object.keys(consumptionData).forEach(categoryId => {
      consumptionData[categoryId].products = Object.values(consumptionData[categoryId].products)
        .sort((a, b) => b.quantity - a.quantity); // Sort by highest consumption
    });
  }
  // Group by date (month)
  else if (groupBy === 'month') {
    movements.forEach(movement => {
      const monthYear = movement.date.toISOString().substring(0, 7); // YYYY-MM
      const dateObj = new Date(movement.date);
      const month = dateObj.toLocaleString('default', { month: 'long' });
      const year = dateObj.getFullYear();
      const label = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
      
      if (!consumptionData[monthYear]) {
        consumptionData[monthYear] = {
          monthYear,
          label,
          totalQuantity: 0,
          movementCount: 0,
          products: {}
        };
      }
      
      movement.lines.forEach(line => {
        const productId = line.productId._id.toString();
        
        if (!consumptionData[monthYear].products[productId]) {
          consumptionData[monthYear].products[productId] = {
            productId,
            productName: line.productId.name,
            productCode: line.productId.code,
            quantity: 0
          };
        }
        
        consumptionData[monthYear].totalQuantity += line.quantity;
        consumptionData[monthYear].products[productId].quantity += line.quantity;
        consumptionData[monthYear].movementCount += 1;
      });
    });
    
    // Convert products object to array for each month
    Object.keys(consumptionData).forEach(monthYear => {
      consumptionData[monthYear].products = Object.values(consumptionData[monthYear].products)
        .sort((a, b) => b.quantity - a.quantity); // Sort by highest consumption
    });
  }
  
  // Convert object to array and sort by highest consumption
  const consumptionReport = Object.values(consumptionData)
    .sort((a, b) => b.totalQuantity - a.totalQuantity);
  
  res.json(consumptionReport);
});

// @desc    Get dashboard stats
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardStats = asyncHandler(async (req, res) => {
  // Get total number of products
  const totalProducts = await Product.countDocuments();
  
  // Get total stock across all products
  const stockResult = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalStock: { $sum: '$currentStock' }
      }
    }
  ]);
  const totalStock = stockResult.length > 0 ? stockResult[0].totalStock : 0;
  
  // Get recent movements
  const recentMovements = await Movement.find({})
    .populate('warehouseId', 'name')
    .populate('lines.productId', 'name')
    .sort({ date: -1 })
    .limit(5);
  
  const recentMovementsData = recentMovements.map(movement => ({
    id: movement._id,
    type: movement.type,
    date: movement.date.toISOString(),
    warehouseName: movement.warehouseId.name,
    products: movement.lines.slice(0, 2).map(line => ({
      name: line.productId.name,
      quantity: line.quantity
    })),
    totalProducts: movement.lines.length,
    status: movement.status
  }));
  
  // Get monthly stats for incoming/outgoing
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const monthlyMovements = await Movement.aggregate([
    {
      $match: {
        date: { $gte: firstDayOfMonth },
        status: 'active'
      }
    },
    {
      $unwind: '$lines'
    },
    {
      $group: {
        _id: '$type',
        totalQuantity: { $sum: '$lines.quantity' }
      }
    }
  ]);
  
  const monthlyStats = {
    incomingTotal: 0,
    outgoingTotal: 0
  };
  
  monthlyMovements.forEach(item => {
    if (item._id === 'ingreso') {
      monthlyStats.incomingTotal = item.totalQuantity;
    } else if (item._id === 'egreso') {
      monthlyStats.outgoingTotal = item.totalQuantity;
    }
  });
  
  // Get top consumed products this month
  const topConsumed = await Movement.aggregate([
    {
      $match: {
        date: { $gte: firstDayOfMonth },
        type: 'egreso',
        status: 'active'
      }
    },
    {
      $unwind: '$lines'
    },
    {
      $group: {
        _id: '$lines.productId',
        totalQuantity: { $sum: '$lines.quantity' }
      }
    },
    {
      $sort: { totalQuantity: -1 }
    },
    {
      $limit: 5
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    {
      $unwind: '$productInfo'
    },
    {
      $project: {
        productId: '$_id',
        productName: '$productInfo.name',
        quantity: '$totalQuantity'
      }
    }
  ]);
  
  res.json({
    totalProducts,
    totalStock,
    recentMovements: recentMovementsData,
    monthlyStats,
    topConsumed
  });
});

// @desc    Get inventory rotation report
// @route   GET /api/reports/rotation
// @access  Private
const getRotationReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  // Build filter for calculating outgoing quantities
  const filter = {
    type: 'egreso',
    status: 'active'
  };
  
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  } else if (startDate) {
    filter.date = { $gte: new Date(startDate) };
  } else if (endDate) {
    filter.date = { $lte: new Date(endDate) };
  }
  
  // Get all products
  const products = await Product.find({}).populate('category', 'name');
  
  // Get outgoing quantities in the time period
  const outgoingMovements = await Kardex.aggregate([
    {
      $match: {
        ...filter,
        type: 'egreso'
      }
    },
    {
      $group: {
        _id: '$productId',
        outgoingQuantity: { $sum: '$quantity' }
      }
    }
  ]);
  
  // Create a map of product ID to outgoing quantity
  const outgoingMap = {};
  outgoingMovements.forEach(item => {
    outgoingMap[item._id.toString()] = item.outgoingQuantity;
  });
  
  // Build the rotation report
  const rotationReport = products.map(product => {
    const productId = product._id.toString();
    const outgoingQuantity = outgoingMap[productId] || 0;
    const currentStock = product.currentStock || 0.01; // Avoid division by zero
    const rotationIndex = outgoingQuantity / currentStock;
    
    return {
      productId,
      productCode: product.code,
      productName: product.name,
      category: product.category ? product.category.name : 'Sin categoría',
      currentStock,
      outgoingQuantity,
      rotationIndex
    };
  });
  
  // Sort by rotation index (highest first)
  rotationReport.sort((a, b) => b.rotationIndex - a.rotationIndex);
  
  res.json(rotationReport);
});

module.exports = {
  getInventoryReport,
  getMovementReport,
  getConsumptionReport,
  getDashboardStats,
  getRotationReport
};