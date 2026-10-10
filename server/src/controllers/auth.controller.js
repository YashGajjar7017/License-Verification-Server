/**
 * Auth Controller
 * Handles: Register, Login, Refresh Token, Logout, Google OAuth, Me
 */

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { sha256 } = require('../utils/crypto');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTokenPair(user) {
  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: user._id });
  return { accessToken, refreshToken };
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh',
  });
}

// ---------------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role: 'user' });
    const { accessToken, refreshToken } = buildTokenPair(user);

    // Store hashed refresh token for rotation validation
    user.refreshTokenHash = sha256(refreshToken);
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save();

    setRefreshCookie(res, refreshToken);

    logger.info('New user registered', { email, userId: user._id });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      accessToken,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Retrieve user including password (select: false by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokenHash');

    if (!user) {
      // Constant-time: don't reveal which field is wrong
      await bcrypt.hash('dummy', 10);
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Check account lock
    if (user.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked. Please try again later.',
        code: 'ACCOUNT_LOCKED',
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please login with Google.',
      });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      await user.incrementLoginAttempts();
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    await user.resetLoginAttempts();
    const { accessToken, refreshToken } = buildTokenPair(user);

    user.refreshTokenHash = sha256(refreshToken);
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save();

    setRefreshCookie(res, refreshToken);

    logger.info('User logged in', { email, userId: user._id });

    return res.json({
      success: true,
      accessToken,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Refresh Token
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/refresh
 * Cookie: refreshToken
 */
async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token not provided' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const user = await User.findById(decoded.id).select('+refreshTokenHash');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // Token rotation: verify stored hash matches
    const incomingHash = sha256(token);
    if (user.refreshTokenHash !== incomingHash) {
      // Possible token theft — invalidate all sessions
      user.refreshTokenHash = null;
      await user.save();
      logger.warn('Refresh token reuse detected — potential token theft', { userId: user._id });
      return res.status(401).json({ success: false, message: 'Token reuse detected. Please login again.' });
    }

    const { accessToken, refreshToken: newRefreshToken } = buildTokenPair(user);
    user.refreshTokenHash = sha256(newRefreshToken);
    await user.save();

    setRefreshCookie(res, newRefreshToken);

    return res.json({ success: true, accessToken });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

/**
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
  try {
    const userId = req.user?.id;
    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    }

    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Get Current User
// ---------------------------------------------------------------------------

/**
 * GET /api/auth/me
 * Requires: authenticate middleware
 */
async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Google OAuth Callback
// ---------------------------------------------------------------------------

/**
 * GET /api/auth/google/callback
 * Called by Passport after Google OAuth flow.
 * Redirects to frontend with tokens.
 */
async function googleCallback(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
    }

    const { accessToken, refreshToken } = buildTokenPair(user);

    // Store refresh token hash
    user.refreshTokenHash = sha256(refreshToken);
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;
    await user.save();

    setRefreshCookie(res, refreshToken);

    // Redirect to frontend with access token in query (frontend should exchange immediately)
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    return res.redirect(`${clientUrl}/auth/callback?token=${accessToken}`);
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, logout, me, googleCallback };
