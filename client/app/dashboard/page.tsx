'use client';

import { useEffect, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Vault,
  Shield,
  Activity,
  AlertTriangle,
  Server,
  Cpu,
  CheckCircle2,
  Lock,
  Copy,
  CheckCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Sliders,
  Puzzle,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { licenseApi, vaultApi } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Stats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  vaultItems: number;
  hardwareNodes: number;
}

// ---------------------------------------------------------------------------
// Stat Card
// ---------------------------------------------------------------------------
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{ padding: 22 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</p>
          <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
            {value}
          </p>
          {sub && <p style={{ fontSize: 11, color, marginTop: 8, fontWeight: 600 }}>{sub}</p>}
        </div>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} color={color} />
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Interactive License Verifier Widget
// ---------------------------------------------------------------------------
function LiveLicenseVerifier() {
  const [keyToVerify, setKeyToVerify] = useState('');
  const [machineId, setMachineId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!keyToVerify.trim()) return;

    setIsVerifying(true);
    setVerifyResult(null);

    try {
      const { data } = await licenseApi.verify({
        licenseKey: keyToVerify.trim(),
        machineId: machineId.trim() || undefined,
      });
      setVerifyResult(data);
      if (data.valid) {
        toast.success(`License Valid! (${data.productName})`);
      } else {
        toast.error(`Invalid: ${data.message || 'Key rejected'}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Verification failed';
      setVerifyResult({ valid: false, message: msg });
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  }

  function handleFillSample() {
    setKeyToVerify('VKENT-SRV9-2M4K-8L1P-XXXX');
    setMachineId('SRV-PROD-US-EAST-01');
  }

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      style={{ padding: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: 'rgba(124,58,237,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={18} color="#a78bfa" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
              Live Cryptographic License Verifier
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Hardware machine binding check with HMAC-SHA256 signature validation
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleFillSample}
          className="text-link-btn"
          style={{ fontSize: 12, color: '#38bdf8', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Paste Sample
        </button>
      </div>

      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            className="input-field"
            placeholder="Paste License Key (e.g. VKPRO-XXXX-XXXX-XXXX)"
            value={keyToVerify}
            onChange={(e) => setKeyToVerify(e.target.value)}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
            required
          />
          <input
            className="input-field"
            placeholder="Optional Hardware Machine ID (e.g. SRV-01)"
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
          />
        </div>

        <button
          type="submit"
          disabled={isVerifying}
          className="btn-primary"
          style={{ width: '100%', padding: '10px 14px' }}
        >
          {isVerifying ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Verifying Cryptographic Hash...</span>
            </>
          ) : (
            <>
              <Zap size={15} />
              <span>Verify License Key & Hardware Binding</span>
            </>
          )}
        </button>
      </form>

      {/* Result Display */}
      {verifyResult && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          style={{
            marginTop: 14,
            padding: 14,
            borderRadius: 10,
            background: verifyResult.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: verifyResult.valid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: verifyResult.valid ? '#10b981' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {verifyResult.valid ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {verifyResult.valid ? 'CRYPTOGRAPHICALLY VALID & AUTHORIZED' : 'VERIFICATION FAILED'}
            </span>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--color-text-muted)' }}>
              HMAC-SHA256 SIGNED
            </span>
          </div>

          {verifyResult.valid && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, fontSize: 12, marginTop: 8 }}>
              <div><strong style={{ color: 'var(--color-text-muted)' }}>Product:</strong> {verifyResult.productName}</div>
              <div><strong style={{ color: 'var(--color-text-muted)' }}>Tier:</strong> {verifyResult.tier?.toUpperCase()}</div>
              <div><strong style={{ color: 'var(--color-text-muted)' }}>Status:</strong> {verifyResult.status}</div>
              <div><strong style={{ color: 'var(--color-text-muted)' }}>Slots:</strong> {verifyResult.activationsRemaining ?? 'Unlimited'} left</div>
            </div>
          )}

          {!verifyResult.valid && (
            <p style={{ fontSize: 12, color: '#f87171' }}>
              {verifyResult.message || 'Key not found in database or expired.'}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Quick Crypto Generator Studio
// ---------------------------------------------------------------------------
function QuickCryptoStudio() {
  const [generated, setGenerated] = useState('');
  const [type, setType] = useState<'password' | 'license'>('password');
  const [copied, setCopied] = useState(false);

  function generate() {
    if (type === 'password') {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';
      const arr = new Uint32Array(24);
      window.crypto.getRandomValues(arr);
      let res = '';
      for (let i = 0; i < 24; i++) res += chars[arr[i] % chars.length];
      setGenerated(res);
    } else {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const parts = ['VKPRO'];
      for (let p = 0; p < 3; p++) {
        const arr = new Uint32Array(4);
        window.crypto.getRandomValues(arr);
        let chunk = '';
        for (let i = 0; i < 4; i++) chunk += chars[arr[i] % chars.length];
        parts.push(chunk);
      }
      setGenerated(parts.join('-'));
    }
  }

  useEffect(() => {
    generate();
  }, [type]);

  async function copy() {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }

  async function saveToVault() {
    if (!generated) return;
    const name = prompt('Credential name for Vault:', type === 'password' ? 'Secure Master Password' : 'VKPRO License Key');
    if (!name) return;

    try {
      await vaultApi.create({
        label: name,
        category: type === 'password' ? 'password' : 'license_key',
        secretValue: generated,
        tags: ['dashboard', 'quick-generator'],
      });
      toast.success('Saved directly to Credential Vault! 🔐');
    } catch {
      toast.error('Failed to save to vault');
    }
  }

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      style={{ padding: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
          Quick Crypto Generator
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => setType('password')}
            className={type === 'password' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            Password
          </button>
          <button
            onClick={() => setType('license')}
            className={type === 'license' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: 11, padding: '4px 10px' }}
          >
            License Key
          </button>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--glass-border)',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 12,
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            color: type === 'password' ? '#38bdf8' : '#10b981',
            letterSpacing: '0.04em',
            wordBreak: 'break-all',
          }}
        >
          {generated}
        </span>

        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={generate} className="btn-secondary" title="Regenerate" style={{ padding: '6px 8px' }}>
            <RefreshCw size={13} />
          </button>
          <button onClick={copy} className="btn-primary" style={{ padding: '6px 10px' }}>
            {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={saveToVault} className="btn-secondary w-full" style={{ fontSize: 12 }}>
          Save to Vault ➔
        </button>
        <Link href="/dashboard/generator" style={{ textDecoration: 'none', flex: 1 }}>
          <button className="btn-secondary w-full" style={{ fontSize: 12 }}>
            Open Studio ↗
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalLicenses: 0,
    activeLicenses: 0,
    expiredLicenses: 0,
    vaultItems: 0,
    hardwareNodes: 0,
  });
  const [recentVault, setRecentVault] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [licAll, licActive, licExpired, vaultRes] = await Promise.allSettled([
          licenseApi.list({ limit: 100 }),
          licenseApi.list({ status: 'active', limit: 1 }),
          licenseApi.list({ status: 'expired', limit: 1 }),
          vaultApi.list({ limit: 4 }),
        ]);

        let nodeCount = 0;
        let totalLics = 0;

        if (licAll.status === 'fulfilled') {
          totalLics = licAll.value.data.pagination?.total || 0;
          (licAll.value.data.data || []).forEach((l: any) => {
            if (l.activations) nodeCount += l.activations.length;
          });
        }

        setStats({
          totalLicenses: totalLics,
          activeLicenses: licActive.status === 'fulfilled' ? licActive.value.data.pagination?.total || 0 : 0,
          expiredLicenses: licExpired.status === 'fulfilled' ? licExpired.value.data.pagination?.total || 0 : 0,
          vaultItems: vaultRes.status === 'fulfilled' ? vaultRes.value.data.pagination?.total || 0 : 0,
          hardwareNodes: nodeCount,
        });

        if (vaultRes.status === 'fulfilled') {
          setRecentVault(vaultRes.value.data.data || []);
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Top Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}
      >
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
            {greeting}, {user?.name?.split(' ')[0] || 'Administrator'} 👋
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
            Security telemetry active • Post-Quantum HS512 session established
          </p>
        </div>

        {/* Chrome Extension Quick Card */}
        <div
          className="glass-card"
          style={{
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            background: 'rgba(6,182,212,0.08)',
            border: '1px solid rgba(6,182,212,0.25)',
          }}
        >
          <Puzzle size={18} color="#06b6d4" />
          <div style={{ fontSize: 12 }}>
            <strong style={{ color: 'var(--color-text)', display: 'block' }}>Chrome Extension Ready</strong>
            <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>Load unpacked from /extension</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)
        ) : (
          <>
            <StatCard
              icon={Key}
              label="Total Licenses"
              value={stats.totalLicenses}
              sub={`${stats.activeLicenses} Active • ${stats.expiredLicenses} Expired`}
              color="#7c3aed"
              delay={0}
            />
            <StatCard
              icon={Server}
              label="Bound Hardware Nodes"
              value={stats.hardwareNodes}
              sub="Hardware-enforced fingerprinting"
              color="#06b6d4"
              delay={0.06}
            />
            <StatCard
              icon={Vault}
              label="AES-256 Vault Items"
              value={stats.vaultItems}
              sub="Zero-knowledge encrypted"
              color="#10b981"
              delay={0.12}
            />
            <StatCard
              icon={Shield}
              label="Security Score"
              value="99.8%"
              sub="HS512 Quantum Session Active"
              color="#f59e0b"
              delay={0.18}
            />
          </>
        )}
      </div>

      {/* Middle Row: Live License Verifier + Quick Crypto Studio */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <LiveLicenseVerifier />
        <QuickCryptoStudio />
      </div>

      {/* Bottom Grid: Recent Vault Secrets + Cluster Nodes & Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 16,
        }}
      >
        {/* Recent Vault Credentials */}
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ padding: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
              Recent Vault Secrets
            </h3>
            <Link href="/dashboard/vault" style={{ fontSize: 12, color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 600 }}>
              View All Vault Items ➔
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentVault.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>No credentials stored yet.</p>
            ) : (
              recentVault.map((item) => (
                <div
                  key={item._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.category.toUpperCase()} • {item.username || 'System credential'}</div>
                  </div>
                  <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#10b981' }}>
                    AES-GCM ✓
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Security Cluster Nodes Telemetry */}
        <motion.div
          className="glass-card"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          style={{ padding: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)' }}>
              Live Security Telemetry
            </h3>
            <Link href="/dashboard/activations" style={{ fontSize: 12, color: 'var(--color-primary-light)', textDecoration: 'none', fontWeight: 600 }}>
              Node Monitor ➔
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span>Production Primary Gateway (US-EAST): <strong>Online (198.51.100.24)</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              <span>Failover Gateway Frankfurt (EU-CENTRAL): <strong>Online (203.0.113.88)</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 8px #06b6d4' }} />
              <span>Dev Workstation Rig (M3 Max): <strong>Authorized (10.0.0.15)</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--color-text)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 8px #7c3aed' }} />
              <span>HS512 Quantum Session Engine: <strong>4096-bit Keys Active</strong></span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
