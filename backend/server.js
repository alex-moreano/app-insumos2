const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

// Route imports
const userRoutes = require('./src/routes/userRoutes');
const warehouseRoutes = require('./src/routes/warehouseRoutes');
const productRoutes = require('./src/routes/productRoutes');
const supplierRoutes = require('./src/routes/supplierRoutes');
const movementRoutes = require('./src/routes/movementRoutes');
const intakeRoutes = require('./src/routes/intakeRoutes');
const kardexRoutes = require('./src/routes/kardexRoutes');
const reportRoutes = require('./src/routes/reportRoutes');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/products', productRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/movements', movementRoutes);
//app.use('/api/intakes', intakeRoutes);
app.use('/api/kardex', kardexRoutes);
app.use('/api/reports', reportRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});