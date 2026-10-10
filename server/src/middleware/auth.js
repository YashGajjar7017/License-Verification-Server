/**
 * Auth Middleware
 * Validates JWT access tokens from Authorization header.
 * Attaches decoded user info to req.user.
 */

const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Require valid JWT access token.
 * Sets req.user = { id, email, role, iat, exp }
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.slice(7);
    const decoded = verifyAccessToken(token);

    // Attach lightweight user info (avoid DB round-trip on every request)
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    logger.error('Auth middleware error:', { error: err.message });
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
}

/**
 * Require a specific role or higher.
 * Must be used AFTER `authenticate`.
 *
 * @param {...string} roles - Allowed roles (e.g., 'admin', 'superadmin')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }
    next();
  };
}

/**
 * Optional authentication — populates req.user if token present, 
 * but does not reject unauthenticated requests.
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      req.user = verifyAccessToken(token);
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
}

module.exports = { authenticate, requireRole, optionalAuth };
