/**
 * JWT Utility Module
 * Enhanced 512-byte (4096-bit) Key Architecture with HS512 (HMAC-SHA512)
 * Provides the highest cryptographic strength for JWT signing, verification, and parsing.
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const KEY_SIZE_BYTES = 512; // 512 bytes (4096 bits)

/**
 * Generates a cryptographically secure 512-byte key.
 * @param {'hex'|'buffer'|'base64'} format - Output format
 * @returns {string|Buffer}
 */
function generate512ByteKey(format = 'hex') {
  const buf = crypto.randomBytes(KEY_SIZE_BYTES);
  if (format === 'buffer') return buf;
  if (format === 'base64') return buf.toString('base64');
  return buf.toString('hex'); // 1024 hex chars
}

/**
 * Converts or derives a guaranteed 512-byte (4096-bit) key buffer from raw input.
 * Supports exact 512-byte buffers, 1024-character hex strings, or PBKDF2-SHA512 derived keys.
 *
 * @param {string|Buffer} secret - Master secret from environment or parameter
 * @param {string} purpose       - Domain separation tag ('access' | 'refresh' | 'custom')
 * @returns {Buffer}             - Exactly 512-byte key buffer
 */
function to512ByteKeyBuffer(secret, purpose = 'access') {
  if (!secret) {
    throw new Error(`JWT secret not provided for purpose: ${purpose}`);
  }

  // Already 512 bytes Buffer
  if (Buffer.isBuffer(secret) && secret.length === KEY_SIZE_BYTES) {
    return secret;
  }

  // 1024 hex characters string (512 bytes)
  if (typeof secret === 'string' && /^[0-9a-fA-F]{1024}$/.test(secret.trim())) {
    return Buffer.from(secret.trim(), 'hex');
  }

  // If already a buffer of different size or regular string:
  // Derive a cryptographically deterministic 512-byte key buffer using PBKDF2 with SHA-512
  const salt = `vaultkey_jwt_512_${purpose}_salt_k9x#`;
  return crypto.pbkdf2Sync(secret, salt, 25000, KEY_SIZE_BYTES, 'sha512');
}

/**
 * Get the 512-byte Access Token Key
 */
const ACCESS_KEY_512 = () => {
  const secret = process.env.JWT_ACCESS_SECRET || 'vaultkey_default_ultra_secure_access_secret_512_bytes_fallback';
  return to512ByteKeyBuffer(secret, 'access');
};

/**
 * Get the 512-byte Refresh Token Key
 */
const REFRESH_KEY_512 = () => {
  const secret = process.env.JWT_REFRESH_SECRET || 'vaultkey_default_ultra_secure_refresh_secret_512_bytes_fallback';
  return to512ByteKeyBuffer(secret, 'refresh');
};

/**
 * Signs a short-lived access token with HS512 and a 512-byte key.
 * @param {object} payload - User payload (id, email, role)
 * @returns {string}       - Signed HS512 JWT
 */
function signAccessToken(payload) {
  return jwt.sign(payload, ACCESS_KEY_512(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
    algorithm: 'HS512',
  });
}

/**
 * Signs a long-lived refresh token with HS512 and a 512-byte key.
 * @param {object} payload - { id } minimal payload
 * @returns {string}       - Signed HS512 JWT
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_KEY_512(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
    algorithm: 'HS512',
  });
}

/**
 * Verifies an access token using HS512 and the 512-byte key.
 * @param {string} token - JWT string
 * @returns {object}     - Decoded payload
 * @throws {Error}       - If token is invalid or expired
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_KEY_512(), {
    algorithms: ['HS512'],
  });
}

/**
 * Verifies a refresh token using HS512 and the 512-byte key.
 * @param {string} token - JWT string
 * @returns {object}     - Decoded payload
 * @throws {Error}       - If token is invalid or expired
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_KEY_512(), {
    algorithms: ['HS512'],
  });
}

/**
 * Generic 512-byte Token Generator
 * Signs any arbitrary payload with a 512-byte key and HS512 algorithm.
 *
 * @param {object} payload - Claims object
 * @param {string|Buffer} [customKey] - Optional custom 512-byte key or seed
 * @param {object} [options] - Additional jwt.sign options
 * @returns {string} - Signed JWT
 */
function signToken512(payload, customKey = null, options = {}) {
  const key = customKey ? to512ByteKeyBuffer(customKey, 'custom') : ACCESS_KEY_512();
  return jwt.sign(payload, key, {
    algorithm: 'HS512',
    expiresIn: '1h',
    ...options,
  });
}

/**
 * Generic 512-byte Token Verifier & Parser
 * Verifies and parses a token signed with HS512 and a 512-byte key.
 *
 * @param {string} token - JWT string
 * @param {string|Buffer} [customKey] - Optional custom 512-byte key
 * @returns {object} - Decoded payload
 */
function verifyToken512(token, customKey = null) {
  const key = customKey ? to512ByteKeyBuffer(customKey, 'custom') : ACCESS_KEY_512();
  return jwt.verify(token, key, {
    algorithms: ['HS512'],
  });
}

/**
 * Complete Token Parser / Inspector
 * Safely parses any JWT token into its header, payload, signature, and metadata.
 *
 * @param {string} token - JWT string
 * @returns {object}     - Parsed JWT structure with verification metadata
 */
function parseToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token string provided to parseToken');
  }

  const decodedComplete = jwt.decode(token, { complete: true });
  if (!decodedComplete) {
    throw new Error('Unable to parse JWT token format');
  }

  const parts = token.split('.');
  return {
    header: decodedComplete.header,
    payload: decodedComplete.payload,
    signature: parts[2] || '',
    algorithm: decodedComplete.header?.alg || 'unknown',
    isHS512: decodedComplete.header?.alg === 'HS512',
    keySizeBytes: KEY_SIZE_BYTES,
    issuedAt: decodedComplete.payload?.iat ? new Date(decodedComplete.payload.iat * 1000) : null,
    expiresAt: decodedComplete.payload?.exp ? new Date(decodedComplete.payload.exp * 1000) : null,
  };
}

module.exports = {
  KEY_SIZE_BYTES,
  generate512ByteKey,
  to512ByteKeyBuffer,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  signToken512,
  verifyToken512,
  parseToken,
};
