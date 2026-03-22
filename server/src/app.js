const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
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

// Rate limiting
const { generalLimiter } = require('./middlewares/rateLimiter');

// Initialize express
const app = express();

// Trust proxy — مطلوب خلف Nginx لكي يعمل rate-limit بشكل صحيح
app.set('trust proxy', 1);

// Gzip compression — يقلل حجم الاستجابات ~60-70%
app.use(compression());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(url => url.trim());

app.use(cors({
  origin: function(origin, callback) {
    // السماح بالطلبات بدون origin (مثل curl أو mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }
    return callback(null, false);
  },
  credentials: true
}));

// Static files — served BEFORE helmet to avoid CORP blocking
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 يوم
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting — حماية عامة
app.use('/api', generalLimiter);

// API routes
app.use('/api', routes);

// Meta tags — خدمة صفحات SPA مع meta tags ديناميكية
const { serveWithMeta } = require('./middlewares/metaTags');
app.get('/', serveWithMeta);
app.get('/us-visa', serveWithMeta);
app.get('/visas', serveWithMeta);
app.get('/visas/:slug', serveWithMeta);
app.get('/international-license', serveWithMeta);
app.get('/ContactUs', serveWithMeta);
app.get('/privacy', serveWithMeta);
app.get('/terms', serveWithMeta);

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
