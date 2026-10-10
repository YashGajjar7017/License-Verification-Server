/**
 * Database Seed Utility
 * Ensures default dummy account: admin@example.com / admin
 * Seeds realistic dummy licenses and AES-256-GCM encrypted vault items.
 */

const User = require('../models/User');
const License = require('../models/License');
const Vault = require('../models/Vault');
const { encrypt, sha256, generateLicenseKey } = require('./crypto');
const logger = require('./logger');

async function seedDummyData() {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin';

    let admin = await User.findOne({ email: adminEmail }).select('+password');

    if (!admin) {
      admin = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
        isEmailVerified: true,
      });
      await admin.save();
      logger.info('✅ Default admin account created: admin@example.com / admin');
    } else {
      // Verify password matches 'admin', if not update it
      const isValid = await admin.comparePassword(adminPassword);
      if (!isValid) {
        admin.password = adminPassword;
        admin.role = 'admin';
        await admin.save();
        logger.info('🔄 Admin account password re-synchronized to "admin"');
      }
    }

    // Seed dummy licenses if none exist for this admin
    const existingLicenses = await License.countDocuments({ userId: admin._id });
    if (existingLicenses === 0) {
      const dummyLicenses = [
        {
          productName: 'VaultKey Enterprise Shield 2026',
          tier: 'enterprise',
          status: 'active',
          maxActivations: 10,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          notes: 'High-throughput hardware-enforced enterprise master node',
          recoveryHint: 'Registered to admin@example.com (Order #VK-99482)',
          activations: [
            {
              machineId: 'SRV-PROD-US-EAST-01',
              machineLabel: 'Production Primary Gateway',
              activatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
              ip: '198.51.100.24',
            },
            {
              machineId: 'SRV-PROD-EU-CENTRAL-02',
              machineLabel: 'Failover Gateway Frankfurt',
              activatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              ip: '203.0.113.88',
            },
          ],
        },
        {
          productName: 'Quantum Cryptographic SDK Pro',
          tier: 'pro',
          status: 'active',
          maxActivations: 3,
          expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
          notes: 'Sub-millisecond AES-GCM & HS512 validation client',
          recoveryHint: 'Issued for developer integration environment',
          activations: [
            {
              machineId: 'DEV-WORKSTATION-MBP16',
              machineLabel: 'Dev Core Rig (M3 Max)',
              activatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              ip: '10.0.0.15',
            },
          ],
        },
        {
          productName: 'Cloud Microservice Mesh License',
          tier: 'lifetime',
          status: 'active',
          maxActivations: 50,
          expiresAt: null, // Lifetime
          notes: 'Perpetual internal company infrastructure entitlement',
          recoveryHint: 'Lifetime internal entitlement key',
          activations: [],
        },
      ];

      for (const lic of dummyLicenses) {
        const rawKey = generateLicenseKey();
        const keyEncrypted = encrypt(rawKey);
        const keyHash = sha256(rawKey);

        await License.create({
          userId: admin._id,
          keyEncrypted,
          keyHash,
          ...lic,
        });
      }
      logger.info('✅ Dummy licenses seeded for admin account');
    }

    // Seed dummy vault credentials if none exist for this admin
    const existingVault = await Vault.countDocuments({ userId: admin._id });
    if (existingVault === 0) {
      const dummyVaultItems = [
        {
          label: 'AWS Production KMS Master Key',
          category: 'api_key',
          description: 'Key Management Service root ARN key for serverless compute',
          website: 'https://aws.amazon.com/kms',
          username: 'arn:aws:kms:us-east-1:123456789012:key/vaultkey-master',
          secretPlain: 'kms-live-098f6bcd4621d373cade4e832627b4f6-us-east-1-prod',
          tags: ['aws', 'production', 'kms', 'security'],
        },
        {
          label: 'Stripe Live Webhook Signing Secret',
          category: 'token',
          description: 'Validates automated license billing webhooks',
          website: 'https://dashboard.stripe.com/webhooks',
          username: 'billing@example.com',
          secretPlain: 'whsec_9b6574f28c46132d731e84770e5a842189d0cfb4396b4ef8',
          tags: ['stripe', 'payments', 'webhook'],
        },
        {
          label: 'PostgreSQL Distributed Shard Password',
          category: 'password',
          description: 'Primary database cluster superuser credentials',
          website: 'postgres://db-cluster.internal:5432/vault_prod',
          username: 'postgres_admin_root',
          secretPlain: 'SuperSecretDBPass!2026#VaultKeySecureString',
          tags: ['database', 'postgres', 'production'],
        },
        {
          label: 'HS512 JWT Master Authority Certificate',
          category: 'certificate',
          description: '512-byte root cryptographic verification token',
          website: 'https://vaultkey.internal/auth/tokens',
          username: 'admin@example.com',
          secretPlain: 'HS512-TOKEN-ROOT-SIGNER-AUTHORITY-LEVEL-0-512-BYTES-ENCRYPTION',
          tags: ['jwt', 'hs512', 'crypto'],
        },
      ];

      for (const item of dummyVaultItems) {
        const { secretPlain, ...rest } = item;
        const encryptedData = encrypt(secretPlain);

        await Vault.create({
          userId: admin._id,
          encryptedData,
          ...rest,
        });
      }
      logger.info('✅ Dummy encrypted vault secrets seeded for admin account');
    }

    return { success: true, email: adminEmail, adminId: admin._id };
  } catch (err) {
    logger.error('Error during dummy data seed:', { error: err.message });
    throw err;
  }
}

// Standalone execution if run via `node src/utils/seed.js`
if (require.main === module) {
  require('dotenv').config();
  const { connectDB } = require('../config/database');

  connectDB()
    .then(async () => {
      await seedDummyData();
      logger.info('🌱 Database seeding completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Database seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seedDummyData };
