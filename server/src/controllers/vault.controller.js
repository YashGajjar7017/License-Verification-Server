/**
 * Vault Controller
 * Handles encrypted credential CRUD operations.
 * Plaintext values are encrypted server-side before storage.
 */

const { validationResult } = require('express-validator');
const Vault = require('../models/Vault');
const { encrypt, decrypt } = require('../utils/crypto');
const logger = require('../utils/logger');

// ---------------------------------------------------------------------------
// Create Vault Item
// ---------------------------------------------------------------------------

/**
 * POST /api/vault
 * Body: { label, category, secretValue, description?, website?, username?, tags?, expiresAt? }
 */
async function createVaultItem(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { label, category, secretValue, description, website, username, tags, expiresAt } = req.body;

    if (!secretValue) {
      return res.status(400).json({ success: false, message: 'secretValue is required' });
    }

    // Encrypt the secret value — plaintext never persisted
    const encryptedData = encrypt(secretValue);

    const item = await Vault.create({
      userId: req.user.id,
      label,
      category: category || 'other',
      encryptedData,
      description,
      website,
      username,
      tags: tags || [],
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    logger.info('Vault item created', { itemId: item._id, userId: req.user.id, category: item.category });

    return res.status(201).json({
      success: true,
      message: 'Secret stored securely',
      data: {
        id: item._id,
        label: item.label,
        category: item.category,
        description: item.description,
        website: item.website,
        username: item.username,
        tags: item.tags,
        expiresAt: item.expiresAt,
        createdAt: item.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// List Vault Items
// ---------------------------------------------------------------------------

/**
 * GET /api/vault
 * Query: ?category=license_key&search=github&page=1&limit=20&archived=false
 */
async function listVaultItems(req, res, next) {
  try {
    const { category, search, page = 1, limit = 20, archived = 'false' } = req.query;

    const query = {
      userId: req.user.id,
      isArchived: archived === 'true',
    };

    if (category) query.category = category;

    if (search) {
      query.$text = { $search: search };
    }

    const [items, total] = await Promise.all([
      Vault.find(query)
        .select('-encryptedData') // Never return encrypted payload in list
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .lean(),
      Vault.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: items,
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
// Get Vault Item (metadata only)
// ---------------------------------------------------------------------------

/**
 * GET /api/vault/:id
 */
async function getVaultItem(req, res, next) {
  try {
    const item = await Vault.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).select('-encryptedData');

    if (!item) {
      return res.status(404).json({ success: false, message: 'Vault item not found' });
    }

    return res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Decrypt & Reveal Secret
// ---------------------------------------------------------------------------

/**
 * GET /api/vault/:id/decrypt
 * Returns the decrypted secret value. Records access audit.
 */
async function decryptVaultItem(req, res, next) {
  try {
    const item = await Vault.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Vault item not found' });
    }

    // Check expiry
    if (item.expiresAt && item.expiresAt < new Date()) {
      return res.status(410).json({
        success: false,
        message: 'This vault item has expired',
        code: 'ITEM_EXPIRED',
      });
    }

    const secretValue = decrypt(item.encryptedData);

    // Audit log — fire and forget
    item.recordAccess().catch((e) =>
      logger.error('Failed to record vault access', { error: e.message })
    );

    logger.info('Vault item decrypted', { itemId: item._id, userId: req.user.id });

    return res.json({
      success: true,
      data: {
        id: item._id,
        label: item.label,
        category: item.category,
        username: item.username,
        secretValue, // ⚠️  Only returned on explicit decrypt request
        accessCount: item.accessCount + 1,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Update Vault Item
// ---------------------------------------------------------------------------

/**
 * PUT /api/vault/:id
 * Body: { label?, category?, secretValue?, description?, website?, username?, tags? }
 */
async function updateVaultItem(req, res, next) {
  try {
    const item = await Vault.findOne({ _id: req.params.id, userId: req.user.id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Vault item not found' });
    }

    const { label, category, secretValue, description, website, username, tags, expiresAt } = req.body;

    if (label !== undefined) item.label = label;
    if (category !== undefined) item.category = category;
    if (description !== undefined) item.description = description;
    if (website !== undefined) item.website = website;
    if (username !== undefined) item.username = username;
    if (tags !== undefined) item.tags = tags;
    if (expiresAt !== undefined) item.expiresAt = expiresAt ? new Date(expiresAt) : null;

    // Re-encrypt if secret value is being updated
    if (secretValue) {
      item.encryptedData = encrypt(secretValue);
    }

    await item.save();

    logger.info('Vault item updated', { itemId: item._id, userId: req.user.id });

    return res.json({
      success: true,
      message: 'Vault item updated',
      data: {
        id: item._id,
        label: item.label,
        category: item.category,
        description: item.description,
        updatedAt: item.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Archive / Restore Vault Item
// ---------------------------------------------------------------------------

/**
 * PATCH /api/vault/:id/archive
 */
async function toggleArchive(req, res, next) {
  try {
    const item = await Vault.findOne({ _id: req.params.id, userId: req.user.id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Vault item not found' });
    }

    item.isArchived = !item.isArchived;
    await item.save();

    return res.json({
      success: true,
      message: item.isArchived ? 'Item archived' : 'Item restored',
      isArchived: item.isArchived,
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// Delete Vault Item
// ---------------------------------------------------------------------------

/**
 * DELETE /api/vault/:id
 */
async function deleteVaultItem(req, res, next) {
  try {
    const item = await Vault.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Vault item not found' });
    }

    logger.info('Vault item deleted', { itemId: req.params.id, userId: req.user.id });
    return res.json({ success: true, message: 'Vault item deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createVaultItem,
  listVaultItems,
  getVaultItem,
  decryptVaultItem,
  updateVaultItem,
  toggleArchive,
  deleteVaultItem,
};
