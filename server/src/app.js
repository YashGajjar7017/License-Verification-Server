/**
 * Express Application Entry Point
 * Configures: CORS, Helmet, compression, rate limiting, morgan, passport, routes
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const { seedDummyData } = require('./utils/seed');
const { generalLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth.routes');
const licenseRoutes = require('./routes/license.routes');
const vaultRoutes = require('./routes/vault.routes');

const app = express();

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
  })
);

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  })
);

// ---------------------------------------------------------------------------
// Body parsing & utilities
// ---------------------------------------------------------------------------
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// ---------------------------------------------------------------------------
// Logging (skip in test environment)
// ---------------------------------------------------------------------------
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
    })
  );
}

// ---------------------------------------------------------------------------
// Passport (needed for Google OAuth strategy)
// ---------------------------------------------------------------------------
app.use(passport.initialize());

// ---------------------------------------------------------------------------
// Apply general rate limiter to all /api routes
// ---------------------------------------------------------------------------
app.use('/api', generalLimiter);

// ---------------------------------------------------------------------------
// Health check (no auth, no rate limit)
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'license-vault-server',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/vault', vaultRoutes);

// ---------------------------------------------------------------------------
// Error handlers (must be last)
// ---------------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = parseInt(process.env.PORT || '5000', 10);

async function start() {
  await connectDB();
  try {
    await seedDummyData();
  } catch (seedErr) {
    logger.warn('Seed execution notice:', { message: seedErr.message });
  }
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

start().catch((err) => {
  logger.error('Fatal startup error:', { error: err.message });
  process.exit(1);
});

module.exports = app; // For testing
