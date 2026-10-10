/**
 * Vault Model
 * Stores encrypted user credentials/secrets using AES-256-GCM.
 * The plaintext value is NEVER persisted — only the encrypted payload.
 *
 * Encrypted payload format (stored in `encryptedData`):
 *   "salt:iv:authTag:ciphertext"  — all hex-encoded
 */

const mongoose = require('mongoose');

const VAULT_CATEGORIES = [
  'license_key',
  'api_key',
  'password',
  'secret_note',
  'ssh_key',
  'certificate',
  'token',
  'other',
];

const vaultSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Display metadata (plaintext — not sensitive)
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    category: {
      type: String,
      enum: VAULT_CATEGORIES,
      default: 'other',
    },
    description: {
      type: String,
      maxlength: 500,
    },
    website: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    username: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    // Encrypted secret value
    encryptedData: {
      type: String,
      required: true,
      // Format: "salt:iv:authTag:ciphertext" (AES-256-GCM output)
    },

    // Tags for filtering
    tags: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],

    // Soft-delete / archive support
    isArchived: {
      type: Boolean,
      default: false,
    },

    // Expiry for temporary secrets (e.g., trial keys)
    expiresAt: {
      type: Date,
    },

    // Audit
    lastAccessedAt: {
      type: Date,
    },
    accessCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound index for user-scoped queries
vaultSchema.index({ userId: 1, category: 1, isArchived: 1 });
vaultSchema.index({ userId: 1, label: 'text', description: 'text', tags: 'text' });

/**
 * Record access for audit purposes (call this when decrypting)
 */
vaultSchema.methods.recordAccess = async function () {
  this.lastAccessedAt = new Date();
  this.accessCount += 1;
  await this.save();
};

const Vault = mongoose.model('Vault', vaultSchema);
module.exports = Vault;
