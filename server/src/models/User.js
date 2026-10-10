/**
 * User Model
 * Supports both email/password and Google OAuth authentication.
 * Passwords are hashed with bcrypt before saving.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const BCRYPT_COST = 12;

const userSchema = new mongoose.Schema(
  {
    // Core identity
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Authentication
    password: {
      type: String,
      select: false, // Never returned by default in queries
      minlength: 4,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values (for non-Google users)
      index: true,
    },

    // Profile
    avatar: {
      type: String, // URL
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // Refresh token storage (hashed) — supports token rotation
    refreshTokenHash: {
      type: String,
      select: false,
    },

    // Security
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    lastLoginIp: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/** Hash password before saving if it was modified */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, BCRYPT_COST);
  next();
});

// ---------------------------------------------------------------------------
// Instance Methods
// ---------------------------------------------------------------------------

/** Compare a candidate password against the stored hash */
userSchema.methods.comparePassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

/** Check if account is currently locked due to too many failed logins */
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

/** Increment failed login counter; lock after 5 attempts for 15 minutes */
userSchema.methods.incrementLoginAttempts = async function () {
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION_MS = 15 * 60 * 1000;

  if (this.lockUntil && this.lockUntil < new Date()) {
    // Lock expired — reset counter
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= MAX_ATTEMPTS && !this.isLocked()) {
      this.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    }
  }
  await this.save();
};

/** Reset login attempts after successful login */
userSchema.methods.resetLoginAttempts = async function () {
  if (this.loginAttempts > 0 || this.lockUntil) {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    await this.save();
  }
};

// ---------------------------------------------------------------------------
// Sanitized Output
// ---------------------------------------------------------------------------

/** Returns a safe public representation (no sensitive fields) */
userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    isEmailVerified: this.isEmailVerified,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt,
  };
};

const User = mongoose.model('User', userSchema);
module.exports = User;
