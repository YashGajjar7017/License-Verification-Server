/**
 * JWT Utility Module
 * Manages Access Token (short-lived) + Refresh Token (long-lived) flow.
 */

const jwt = require('jsonwebtoken');

const ACCESS_SECRET = () => {
  if (!process.env.JWT_ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET not set');
  return process.env.JWT_ACCESS_SECRET;
};
const REFRESH_SECRET = () => {
  if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET not set');
  return process.env.JWT_REFRESH_SECRET;
};

/**
 * Signs a short-lived access token.
 * @param {object} payload - User payload (id, email, role)
 * @returns {string}       - Signed JWT
 */
function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    algorithm: 'HS256',
  });
}

/**
 * Signs a long-lived refresh token.
 * @param {object} payload - { id } minimal payload
 * @returns {string}       - Signed JWT
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    algorithm: 'HS256',
  });
}

/**
 * Verifies an access token and returns the decoded payload.
 * @param {string} token - JWT string
 * @returns {object}     - Decoded payload
 * @throws {Error}       - If token is invalid or expired
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET());
}

/**
 * Verifies a refresh token and returns the decoded payload.
 * @param {string} token - JWT string
 * @returns {object}     - Decoded payload
 * @throws {Error}       - If token is invalid or expired
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET());
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
