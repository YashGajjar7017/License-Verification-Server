/**
 * License Controller
 * Handles: Create, List, Get, Verify (public), Activate, Revoke, Delete
 *
 * Security notes:
 * - License keys are stored encrypted (AES-256-GCM)
 * - SHA-256 hash used for O(1) verification lookups
 * - Verification response is HMAC-SHA256 signed to prevent tampering
 * - Machine ID binding prevents license sharing
 */

const { validationResult } = require('express-validator');
const License = require('../models/License');
const Vault = require('../models/Vault');
const {
  encrypt,
  decrypt,
  sha256,
  hmacSign,
  hmacVerify,
  generateLicenseKey,
} = require('../utils/crypto');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Create License
// ---------------------------------------------------------------------------

/**
 * POST /api/licenses
 * Body: { productName, tier, maxActivations, expiresAt, notes, recoveryHint, ...advancedOptions }
 */
async function createLicense(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      productName,
      tier,
      maxActivations,
      expiresAt,
      notes,
      recoveryHint,
      keyPrefix,
      keyChunks,
      keyChunkLen,
      keySeparator,
      licenseeName,
      licenseeEmail,
      orderRef,
      hardwarePolicy,
      ipRestriction,
      domainRestriction,
      features,
      gracePeriodDays,
      autoVault,
    } = req.body;

    // Generate a cryptographically secure license key with custom formatting if specified
    const rawKey = generateLicenseKey({
      prefix: keyPrefix,
      chunks: keyChunks,
      chunkLen: keyChunkLen,
      separator: keySeparator,
    });

    // Encrypt for storage and hash for lookup
    const keyEncrypted = encrypt(rawKey);
    const keyHash = sha256(rawKey);

    const keyFormatDesc = keyPrefix
      ? `${keyPrefix.toUpperCase()}-${keyChunks || 4}x${keyChunkLen || 4}`
      : 'STANDARD-4x6';

    const license = await License.create({
      userId: req.user.id,
      keyEncrypted,
      keyHash,
      productName,
      tier: tier || 'basic',
      maxActivations: maxActivations || 1,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      notes,
      recoveryHint,
      licenseeName,
      licenseeEmail,
      orderRef,
      hardwarePolicy: hardwarePolicy || 'floating',
      ipRestriction,
      domainRestriction,
      features: Array.isArray(features) ? features : [],
      gracePeriodDays: gracePeriodDays ? parseInt(gracePeriodDays, 10) : 0,
      keyFormat: keyFormatDesc,
      status: 'active',
    });

    // Automatically store encrypted backup copy into Credential Vault if requested
    if (autoVault) {
      try {
        await Vault.create({
          userId: req.user.id,
          label: `${productName} (${(tier || 'basic').toUpperCase()}) License`,
          category: 'license_key',
          description: `Auto-stored encrypted license for ${productName}. Stored on ${new Date().toISOString()}`,
          username: licenseeEmail || licenseeName || undefined,
          encryptedData: keyEncrypted,
          tags: ['license', tier || 'basic', productName.toLowerCase().replace(/\s+/g, '-')],
        });
      } catch (vaultErr) {
        logger.warn('Failed to auto-save license to vault', { error: vaultErr.message });
      }
    }

    logger.info('License created', { licenseId: license._id, userId: req.user.id });

    // Return the raw key ONCE — it will never be stored in plaintext again
    return res.status(201).json({
      success: true,
      message: 'License created. Copy this key now — it cannot be shown again.',
      licenseKey: rawKey, // ⚠️  ONLY shown at creation time
      license: {
        id: license._id,
        _id: license._id,
        productName: license.productName,
        tier: license.tier,
        status: license.status,
        maxActivations: license.maxActivations,
        expiresAt: license.expiresAt,
        recoveryHint: license.recoveryHint,
        licenseeName: license.licenseeName,
        licenseeEmail: license.licenseeEmail,
        orderRef: license.orderRef,
        hardwarePolicy: license.hardwarePolicy,
        features: license.features,
        keyFormat: license.keyFormat,
        createdAt: license.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// List Licenses
// ---------------------------------------------------------------------------

/**
 * GET /api/licenses
 * Query: ?status=active&tier=pro&page=1&limit=20
 */
async function listLicenses(req, res, next) {
  try {
    const { status, tier, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user.id };

    if (status) query.status = status;
    if (tier) query.tier = tier;

    const [licenses, total] = await Promise.all([
      License.find(query)
        .select('-keyEncrypted -apiKeyHeader') // Never return encrypted key in list
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .lean(),
      License.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: licenses,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Get Single License
// ---------------------------------------------------------------------------

/**
 * GET /api/licenses/:id
 */
async function getLicense(req, res, next) {
  try {
    const license = await License.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).select('-keyEncrypted -apiKeyHeader');

    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    return res.json({ success: true, data: license });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Reveal License Key (decrypt on demand)
// ---------------------------------------------------------------------------

/**
 * GET /api/licenses/:id/reveal
 * Returns the decrypted license key for the authenticated owner.
 */
async function revealLicenseKey(req, res, next) {
  try {
    const license = await License.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).select('+keyEncrypted');

    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    const rawKey = decrypt(license.keyEncrypted);

    logger.info('License key revealed', { licenseId: license._id, userId: req.user.id });

    return res.json({
      success: true,
      licenseKey: rawKey,
      productName: license.productName,
      tier: license.tier,
      status: license.status,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Verify License (PUBLIC endpoint for external apps)
// ---------------------------------------------------------------------------

/**
 * POST /api/licenses/verify
 * Body: { licenseKey, machineId?, signature? }
 * Headers: x-api-key (optional, allows higher rate limit)
 *
 * Returns a signed response payload that the client app should verify
 * using the HMAC secret to ensure the response wasn't tampered with.
 */
async function verifyLicense(req, res, next) {
  try {
    const { licenseKey, machineId } = req.body;

    if (!licenseKey) {
      return res.status(400).json({ success: false, message: 'licenseKey is required' });
    }

    // Verify incoming request signature if provided (optional extra security layer)
    if (req.body.signature) {
      const isValidSig = hmacVerify(
        { licenseKey, machineId },
        req.body.signature
      );
      if (!isValidSig) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request signature',
          code: 'INVALID_SIGNATURE',
        });
      }
    }

    const keyHash = sha256(licenseKey.trim().toUpperCase());
    const license = await License.findOne({ keyHash });

    const timestamp = new Date().toISOString();

    if (!license) {
      const payload = {
        valid: false,
        status: 'not_found',
        timestamp,
      };
      return res.status(404).json({
        success: false,
        ...payload,
        signature: hmacSign(payload),
      });
    }

    // Check expiry (update status if auto-expired)
    if (license.expiresAt && license.expiresAt < new Date() && license.status === 'active') {
      license.status = 'expired';
      await license.save();
    }

    const isActive = license.status === 'active';
    let machineStatus = null;
    let activationCount = license.activations?.length ?? 0;

    // Machine ID validation (if provided)
    if (machineId && isActive) {
      const existingActivation = license.findActivation(machineId);

      if (existingActivation) {
        // Known machine — update last seen
        existingActivation.lastSeenAt = new Date();
        await license.save();
        machineStatus = 'bound';
      } else if (license.canActivate()) {
        // New machine within limit — auto-activate
        license.activations.push({
          machineId,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          activatedAt: new Date(),
          lastSeenAt: new Date(),
        });
        await license.save();
        activationCount = license.activations.length;
        machineStatus = 'newly_activated';
      } else {
        // Activation limit reached
        machineStatus = 'activation_limit_reached';
      }
    }

    const responsePayload = {
      valid: isActive && machineStatus !== 'activation_limit_reached',
      status: license.status,
      tier: license.tier,
      productName: license.productName,
      expiresAt: license.expiresAt,
      machineStatus,
      activationCount,
      maxActivations: license.maxActivations,
      timestamp,
    };

    // Sign the response so the client can verify authenticity
    responsePayload.signature = hmacSign({
      valid: responsePayload.valid,
      status: responsePayload.status,
      tier: responsePayload.tier,
      timestamp,
    });

    logger.info('License verified', {
      licenseId: license._id,
      status: license.status,
      machineId,
      ip: req.ip,
    });

    return res.json({ success: true, ...responsePayload });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Activate License on Machine
// ---------------------------------------------------------------------------

/**
 * POST /api/licenses/:id/activate
 * Body: { machineId, machineLabel }
 */
async function activateLicense(req, res, next) {
  try {
    const { machineId, machineLabel } = req.body;
    if (!machineId) {
      return res.status(400).json({ success: false, message: 'machineId is required' });
    }

    const license = await License.findOne({ _id: req.params.id, userId: req.user.id });
    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    if (license.findActivation(machineId)) {
      return res.status(200).json({ success: true, message: 'Machine already activated' });
    }

    if (!license.canActivate()) {
      return res.status(409).json({
        success: false,
        message: `Activation limit of ${license.maxActivations} reached`,
        code: 'ACTIVATION_LIMIT_REACHED',
      });
    }

    license.activations.push({ machineId, machineLabel });
    if (!license.activatedAt) license.activatedAt = new Date();
    await license.save();

    return res.json({
      success: true,
      message: 'Machine activated successfully',
      activationCount: license.activations.length,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Revoke License
// ---------------------------------------------------------------------------

/**
 * POST /api/licenses/:id/revoke
 * Body: { reason? }
 */
async function revokeLicense(req, res, next) {
  try {
    const license = await License.findOne({ _id: req.params.id, userId: req.user.id });
    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    license.status = 'revoked';
    license.revokedAt = new Date();
    license.revokedReason = req.body.reason || 'Revoked by user';
    await license.save();

    logger.info('License revoked', { licenseId: license._id, userId: req.user.id });

    return res.json({ success: true, message: 'License revoked' });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Delete License
// ---------------------------------------------------------------------------

/**
 * DELETE /api/licenses/:id
 */
async function deleteLicense(req, res, next) {
  try {
    const license = await License.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!license) {
      return res.status(404).json({ success: false, message: 'License not found' });
    }

    logger.info('License deleted', { licenseId: req.params.id, userId: req.user.id });
    return res.json({ success: true, message: 'License deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createLicense,
  listLicenses,
  getLicense,
  revealLicenseKey,
  verifyLicense,
  activateLicense,
  revokeLicense,
  deleteLicense,
};
