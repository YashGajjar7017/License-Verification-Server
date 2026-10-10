/**
 * Crypto Utility Module
 * Handles: AES-256-GCM encryption/decryption, SHA-256 hashing,
 *          HMAC-SHA256 signing/verification, and secure key generation.
 *
 * Format of encrypted output: "salt:iv:authTag:ciphertext" (all hex-encoded)
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12;  // 96 bits — recommended for GCM
const SALT_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits (GCM default)
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_DIGEST = 'sha256';

/**
 * Derives a 256-bit key from the master key and a unique salt using PBKDF2.
 * This ensures each encrypted item has a unique derived key.
 *
 * @param {Buffer} masterKey - 32-byte master encryption key from env
 * @param {Buffer} salt      - 16-byte random salt
 * @returns {Buffer}         - 32-byte derived key
 */
function deriveKey(masterKey, salt) {
  return crypto.pbkdf2Sync(masterKey, salt, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST);
}

/**
 * Retrieves and validates the master encryption key from environment variables.
 * @returns {Buffer} - 32-byte master key
 */
function getMasterKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 bytes (64 hex characters)');
  }
  return Buffer.from(keyHex, 'hex');
}

/**
 * Encrypts plaintext using AES-256-GCM with a derived key.
 * Returns: "salt:iv:authTag:ciphertext" (all hex)
 *
 * @param {string} plaintext - The text to encrypt
 * @returns {string}         - Encrypted payload as colon-delimited hex string
 */
function encrypt(plaintext) {
  const masterKey = getMasterKey();
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);
  const derivedKey = deriveKey(masterKey, salt);

  const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    salt.toString('hex'),
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Decrypts a payload produced by `encrypt()`.
 *
 * @param {string} payload - "salt:iv:authTag:ciphertext" (hex)
 * @returns {string}       - Original plaintext
 */
function decrypt(payload) {
  const parts = payload.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted payload format');
  }

  const [saltHex, ivHex, authTagHex, ciphertextHex] = parts;
  const masterKey = getMasterKey();
  const salt = Buffer.from(saltHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');
  const derivedKey = deriveKey(masterKey, salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Computes a SHA-256 hash of the input and returns it as a hex string.
 *
 * @param {string} input - Input string to hash
 * @returns {string}     - Hex-encoded SHA-256 hash
 */
function sha256(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Generates an HMAC-SHA256 signature for the given data.
 * Used to sign license verification response payloads to prevent tampering.
 *
 * @param {string|object} data   - Data to sign (objects are JSON-stringified)
 * @param {string}        secret - HMAC secret (defaults to env HMAC_SECRET)
 * @returns {string}             - Hex-encoded HMAC signature
 */
function hmacSign(data, secret = process.env.HMAC_SECRET) {
  if (!secret) throw new Error('HMAC_SECRET is not configured');
  const payload = typeof data === 'object' ? JSON.stringify(data) : String(data);
  return crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

/**
 * Verifies an HMAC-SHA256 signature using constant-time comparison.
 *
 * @param {string|object} data      - Original data
 * @param {string}        signature - The signature to verify
 * @param {string}        secret    - HMAC secret
 * @returns {boolean}               - True if the signature is valid
 */
function hmacVerify(data, signature, secret = process.env.HMAC_SECRET) {
  const expected = hmacSign(data, secret);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

/**
 * Generates a cryptographically secure random license key in the format:
 * XXXX-XXXX-XXXX-XXXX (uppercase alphanumeric, 4 groups of 6)
 *
 * @returns {string} - License key string
 */
function generateLicenseKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // avoid ambiguous chars (0,O,1,I)
  const groups = 4;
  const groupLen = 6;
  let key = '';

  for (let g = 0; g < groups; g++) {
    for (let i = 0; i < groupLen; i++) {
      const rand = crypto.randomInt(0, chars.length);
      key += chars[rand];
    }
    if (g < groups - 1) key += '-';
  }

  return key;
}

/**
 * Generates a secure random token of specified byte length.
 * @param {number} bytes - Number of bytes (default 32)
 * @returns {string}     - Hex string
 */
function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  sha256,
  hmacSign,
  hmacVerify,
  generateLicenseKey,
  generateSecureToken,
};
