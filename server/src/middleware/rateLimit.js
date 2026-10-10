/**
 * Rate Limiting Middleware
 * Provides configurable rate limiters for different endpoint sensitivities.
 */

const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

/** General API rate limiter */
const generalLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    retryAfter: Math.ceil(windowMs / 1000),
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

/** Strict limiter for the public license verification endpoint */
const licenseVerifyLimiter = rateLimit({
  windowMs,
  max: parseInt(process.env.LICENSE_RATE_LIMIT_MAX || '20', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    // Key by IP + API key header to allow higher limits for authenticated apps
    `${req.ip}:${req.headers['x-api-key'] || 'anon'}`,
  message: {
    success: false,
    message: 'License verification rate limit exceeded.',
    code: 'RATE_LIMITED',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

/** Very strict limiter for authentication endpoints (brute-force protection) */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes.',
    code: 'AUTH_RATE_LIMITED',
  },
  skip: (req) => process.env.NODE_ENV === 'test',
});

module.exports = { generalLimiter, licenseVerifyLimiter, authLimiter };
