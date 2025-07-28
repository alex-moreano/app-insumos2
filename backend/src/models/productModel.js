const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Por favor ingrese un código para el producto'],
    trim: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Por favor ingrese un nombre para el producto'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Por favor seleccione una categoría'],
    enum: [
      'Electrónica',
      'Oficina',
      'Materiales',
      'Herramientas',
      'Insumos',
      'Otro'
    ]
  },
  unit: {
    type: String,
    required: [true, 'Por favor seleccione una unidad de medida'],
    enum: [
      'Unidad',
      'Kg',
      'Litro',
      'Metro',
      'Caja',
      'Paquete'
    ]
  },
  currentStock: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Product', ProductSchema);