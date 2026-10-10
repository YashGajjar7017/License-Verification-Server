/**
 * License Model
 * Stores encrypted license keys, activation state, hardware binding,
 * and tier information for the license verification system.
 *
 * The raw license key is NEVER stored in plaintext.
 * The `keyEncrypted` field stores AES-256-GCM ciphertext.
 * The `keyHash` (SHA-256) is used for fast lookup by the external client.
 */

const mongoose = require('mongoose');

const activationSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      trim: true,
    },
    machineLabel: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    activatedAt: {
      type: Date,
      default: Date.now,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    ip: String,
    userAgent: String,
  },
  { _id: false }
);

const licenseSchema = new mongoose.Schema(
  {
    // Owner
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Key storage (NEVER plaintext)
    keyEncrypted: {
      type: String,
      required: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      // SHA-256 hash of the raw key — used for O(1) lookup during verification
    },

    // Metadata
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    tier: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise', 'lifetime'],
      default: 'basic',
    },

    // Status lifecycle
    status: {
      type: String,
      enum: ['active', 'expired', 'revoked', 'suspended', 'pending'],
      default: 'active',
      index: true,
    },

    // Activation limits & hardware binding
    maxActivations: {
      type: Number,
      default: 1,
      min: 1,
      max: 1000,
    },
    activations: [activationSchema],

    // Validity window
    expiresAt: {
      type: Date,
      index: true,
      // null = lifetime license
    },
    activatedAt: Date,

    // Notes & recovery hints (stored in plaintext — non-sensitive)
    notes: {
      type: String,
      maxlength: 500,
    },
    recoveryHint: {
      type: String,
      maxlength: 200,
      // e.g. "Registered to orders@acme.com on 2024-01-15"
    },

    // Revocation tracking
    revokedAt: Date,
    revokedReason: String,

    // API key for external verification (optional, rate-limited access)
    apiKeyHeader: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ---------------------------------------------------------------------------
// Virtual: isExpired
// ---------------------------------------------------------------------------
licenseSchema.virtual('isExpired').get(function () {
  return this.expiresAt ? this.expiresAt < new Date() : false;
});

licenseSchema.virtual('activationCount').get(function () {
  return this.activations?.length ?? 0;
});

// ---------------------------------------------------------------------------
// Methods
// ---------------------------------------------------------------------------

/** Returns true if the license can accept another machine activation */
licenseSchema.methods.canActivate = function () {
  if (this.status !== 'active') return false;
  if (this.isExpired) return false;
  return this.activations.length < this.maxActivations;
};

/** Find an existing activation by machine ID */
licenseSchema.methods.findActivation = function (machineId) {
  return this.activations.find((a) => a.machineId === machineId);
};

const License = mongoose.model('License', licenseSchema);
module.exports = License;
