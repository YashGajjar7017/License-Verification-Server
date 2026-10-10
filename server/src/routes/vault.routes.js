/**
 * Vault Routes
 * POST   /api/vault                     — Store encrypted secret
 * GET    /api/vault                     — List vault items (no secrets)
 * GET    /api/vault/:id                 — Get item metadata
 * GET    /api/vault/:id/decrypt         — Decrypt & reveal secret
 * PUT    /api/vault/:id                 — Update vault item
 * PATCH  /api/vault/:id/archive         — Toggle archive status
 * DELETE /api/vault/:id                 — Delete vault item
 */

const express = require('express');
const { body, param } = require('express-validator');
const {
  createVaultItem,
  listVaultItems,
  getVaultItem,
  decryptVaultItem,
  updateVaultItem,
  toggleArchive,
  deleteVaultItem,
} = require('../controllers/vault.controller');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All vault routes require authentication
router.use(authenticate);

const idParam = [param('id').isMongoId().withMessage('Invalid vault item ID')];

const createValidation = [
  body('label').trim().notEmpty().withMessage('Label is required').isLength({ max: 150 }),
  body('secretValue').notEmpty().withMessage('secretValue is required'),
  body('category')
    .optional()
    .isIn(['license_key', 'api_key', 'password', 'secret_note', 'ssh_key', 'certificate', 'token', 'other']),
];

router.post('/', createValidation, createVaultItem);
router.get('/', listVaultItems);
router.get('/:id', idParam, getVaultItem);
router.get('/:id/decrypt', idParam, decryptVaultItem);
router.put('/:id', idParam, updateVaultItem);
router.patch('/:id/archive', idParam, toggleArchive);
router.delete('/:id', idParam, deleteVaultItem);

module.exports = router;
