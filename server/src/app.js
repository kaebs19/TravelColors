const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

// Database connection
const connectDB = require('./config/db');

// Google Sheets
const { initGoogleAuth } = require('./config/google');
const googleSheetsService = require('./services/googleSheetsService');

// Import routes
const routes = require('./routes');

// Import error handler
const { errorHandler } = require('./middlewares');

// Initialize express
const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Security headers
app.use(helmet());

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Travel Colors API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      trips: '/api/trips',
      bookings: '/api/bookings',
      customers: '/api/customers'
    }
  });
});

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود'
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    await connectDB();

    // Initialize Google Sheets if enabled
    if (process.env.GOOGLE_SHEETS_ENABLED === 'true') {
      const sheetsApi = await initGoogleAuth();
      if (sheetsApi) {
        await googleSheetsService.initializeSheet();
        console.log('Google Sheets sync enabled');
      }
    }

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`API: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
