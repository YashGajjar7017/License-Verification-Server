/**
 * License Routes
 * POST   /api/licenses                  — Create license (auth required)
 * GET    /api/licenses                  — List licenses (auth required)
 * GET    /api/licenses/:id              — Get license details (auth required)
 * GET    /api/licenses/:id/reveal       — Reveal decrypted key (auth required)
 * POST   /api/licenses/verify           — Public verification endpoint
 * POST   /api/licenses/:id/activate     — Activate on machine (auth required)
 * POST   /api/licenses/:id/revoke       — Revoke license (auth required)
 * DELETE /api/licenses/:id              — Delete license (auth required)
 */

const express = require('express');
const { body, param } = require('express-validator');
const {
  createLicense,
  listLicenses,
  getLicense,
  revealLicenseKey,
  verifyLicense,
  activateLicense,
  revokeLicense,
  deleteLicense,
} = require('../controllers/license.controller');
const { authenticate } = require('../middleware/auth');
const { licenseVerifyLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// Validation
const createValidation = [
  body('productName').trim().notEmpty().withMessage('Product name is required').isLength({ max: 150 }),
  body('tier').optional().isIn(['free', 'basic', 'pro', 'enterprise', 'lifetime']),
  body('maxActivations').optional().isInt({ min: 1, max: 1000 }),
  body('expiresAt').optional().isISO8601().withMessage('expiresAt must be ISO 8601 date'),
];

const idParam = [param('id').isMongoId().withMessage('Invalid license ID')];

// Public route (no auth — rate limited)
router.post('/verify', licenseVerifyLimiter, verifyLicense);

// Protected routes
router.use(authenticate);

router.post('/', createValidation, createLicense);
router.get('/', listLicenses);
router.get('/:id', idParam, getLicense);
router.get('/:id/reveal', idParam, revealLicenseKey);
router.post('/:id/activate', idParam, activateLicense);
router.post('/:id/revoke', idParam, revokeLicense);
router.delete('/:id', idParam, deleteLicense);

module.exports = router;
