const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');

// @desc    Create new product
// @route   POST /api/products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
  const { code, name, category, unit } = req.body;

  if (!code || !name || !category || !unit) {
    res.status(400);
    throw new Error('Por favor complete todos los campos obligatorios');
  }

  // Check if product code already exists
  const productExists = await Product.findOne({ code });

  if (productExists) {
    res.status(400);
    throw new Error('Ya existe un producto con ese código');
  }

  const product = await Product.create({
    code,
    name,
    category,
    unit,
    createdBy: req.user._id
  });

  if (product) {
    res.status(201).json(product);
  } else {
    res.status(400);
    throw new Error('Datos de producto inválidos');
  }
});

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({})
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');
  res.json(products);
});

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate('createdBy', 'name')
    .populate('updatedBy', 'name');

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Producto no encontrado');
  }
});

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  const { code, name, category, unit } = req.body;
  
  const product = await Product.findById(req.params.id);

  if (product) {
    // If code is being changed, check for uniqueness
    if (code && code !== product.code) {
      const codeExists = await Product.findOne({ code });
      if (codeExists) {
        res.status(400);
        throw new Error('Ya existe un producto con ese código');
      }
    }

    product.code = code || product.code;
    product.name = name || product.name;
    product.category = category || product.category;
    product.unit = unit || product.unit;
    product.updatedBy = req.user._id;
    product.updatedAt = Date.now();

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error('Producto no encontrado');
  }
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Check if product has movements before allowing delete
    // This would require checking the Kardex or Movement models
    // For now, we'll just proceed with deletion
    
    await product.deleteOne();
    res.json({ message: 'Producto eliminado' });
  } else {
    res.status(404);
    throw new Error('Producto no encontrado');
  }
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};