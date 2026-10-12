'use client';

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  Trash2,
  ShieldX,
  Search,
  Filter,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  MonitorSmartphone,
  Calendar,
  MoreVertical,
  Clock,
  Database,
  Download,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Shield,
  Globe,
  Building,
  Mail,
  FileText,
  Sparkles,
  Vault,
  Cpu,
  Zap,
} from 'lucide-react';
import { licenseApi, vaultApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface License {
  _id: string;
  productName: string;
  tier: string;
  status: 'active' | 'expired' | 'revoked' | 'suspended' | 'pending';
  maxActivations: number;
  activations: { machineId: string; machineLabel?: string; activatedAt: string }[];
  expiresAt?: string;
  recoveryHint?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  keyFormat?: string;
  licenseeName?: string;
  licenseeEmail?: string;
  orderRef?: string;
  hardwarePolicy?: string;
  ipRestriction?: string;
  domainRestriction?: string;
  features?: string[];
  gracePeriodDays?: number;
}

// ---------------------------------------------------------------------------
// Helper: Format actual date & time
// ---------------------------------------------------------------------------
function formatActualDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return dateStr;
  }
}

// ---------------------------------------------------------------------------
// Modal: Detailed Database Record Inspector
// ---------------------------------------------------------------------------
function LicenseDetailsModal({
  license,
  onClose,
}: {
  license: License;
  onClose: () => void;
}) {
  const [copiedId, setCopiedId] = useState(false);

  function copyDbId() {
    navigator.clipboard.writeText(license._id);
    setCopiedId(true);
    toast.success('Database ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  }

  function downloadJson() {
    const exportData = {
      databaseRecord: {
        _id: license._id,
        createdAt: license.createdAt,
        updatedAt: license.updatedAt,
      },
      product: {
        name: license.productName,
        tier: license.tier,
        status: license.status,
      },
      activations: {
        current: license.activations?.length || 0,
        max: license.maxActivations,
        devices: license.activations || [],
      },
      policy: {
        hardwarePolicy: license.hardwarePolicy || 'floating',
        expiresAt: license.expiresAt || null,
        gracePeriodDays: license.gracePeriodDays || 0,
        keyFormat: license.keyFormat || 'STANDARD-4x6',
        features: license.features || [],
        ipRestriction: license.ipRestriction || null,
        domainRestriction: license.domainRestriction || null,
      },
      licensee: {
        name: license.licenseeName || null,
        email: license.licenseeEmail || null,
        orderRef: license.orderRef || null,
      },
      metadata: {
        recoveryHint: license.recoveryHint || null,
        notes: license.notes || null,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-${license.productName.toLowerCase().replace(/\s+/g, '-')}-${license._id.slice(-6)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported license JSON record');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        className="glass-card w-full max-w-2xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{ padding: 28 }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: 16,
            borderBottom: '1px solid var(--glass-border)',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(124,58,237,0.15)',
                border: '1px solid rgba(124,58,237,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b5cf6',
              }}
            >
              <Database size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                Database Record Details
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                Live schema properties stored in MongoDB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* DB Storage Timestamps (Highlight) */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.1))',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 12,
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Clock size={16} color="#8b5cf6" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                Actual Database Storage Timestamp
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>
                  Exact Date & Time Stored to DB
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#38bdf8',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  {formatActualDateTime(license.createdAt)}
                </span>
              </div>

              <div>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>
                  Database ISO 8601 Timestamp
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-muted)',
                    fontFamily: 'JetBrains Mono, monospace',
                    wordBreak: 'break-all',
                  }}
                >
                  {license.createdAt}
                </span>
              </div>
            </div>

            {license.updatedAt && license.updatedAt !== license.createdAt && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  Last Modified: {formatActualDateTime(license.updatedAt)}
                </span>
              </div>
            )}
          </div>

          {/* Database Object ID */}
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--glass-border)',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>
                MongoDB Document ID (_id)
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13,
                  color: 'var(--color-text)',
                }}
              >
                {license._id}
              </span>
            </div>
            <button
              onClick={copyDbId}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              {copiedId ? <CheckCheck size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copiedId ? 'Copied' : 'Copy ID'}</span>
            </button>
          </div>

          {/* License Properties Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Product Name</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>{license.productName}</span>
            </div>

            <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Tier & Status</span>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <span className="badge" style={{ textTransform: 'uppercase', fontSize: 10 }}>{license.tier}</span>
                <span className={`badge badge-${license.status}`} style={{ textTransform: 'capitalize', fontSize: 10 }}>
                  {license.status}
                </span>
              </div>
            </div>

            <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Hardware Policy</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)', textTransform: 'capitalize' }}>
                {(license.hardwarePolicy || 'floating').replace('_', ' ')}
              </span>
            </div>

            <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Key Format Architecture</span>
              <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono, monospace', color: '#10b981' }}>
                {license.keyFormat || 'STANDARD-4x6'}
              </span>
            </div>

            <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Activation Limit</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                {license.activations?.length || 0} / {license.maxActivations} nodes
              </span>
            </div>

            <div style={{ background: 'var(--glass-bg)', padding: '12px', borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Expiry Window</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: license.expiresAt ? '#f59e0b' : '#10b981' }}>
                {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Lifetime Perpetual'}
              </span>
            </div>
          </div>

          {/* Licensee Info */}
          {(license.licenseeName || license.licenseeEmail || license.orderRef) && (
            <div style={{ background: 'var(--glass-bg)', padding: '14px', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 8 }}>
                Licensee / Customer Profile
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                {license.licenseeName && (
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Company / Client</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{license.licenseeName}</span>
                  </div>
                )}
                {license.licenseeEmail && (
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Contact Email</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text)' }}>{license.licenseeEmail}</span>
                  </div>
                )}
                {license.orderRef && (
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Order Reference</span>
                    <span style={{ fontSize: 13, fontFamily: 'monospace', color: 'var(--color-text)' }}>{license.orderRef}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Features Granted */}
          {license.features && license.features.length > 0 && (
            <div style={{ background: 'var(--glass-bg)', padding: '14px', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 8 }}>
                Granted Feature Entitlements
              </span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {license.features.map((feat, idx) => (
                  <span
                    key={idx}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: 'rgba(16,185,129,0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.3)',
                    }}
                  >
                    ✓ {feat.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Machine Activations List */}
          <div style={{ background: 'var(--glass-bg)', padding: '14px', borderRadius: 10, border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 8 }}>
              Active Hardware Nodes ({license.activations?.length || 0})
            </span>
            {(!license.activations || license.activations.length === 0) ? (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>No hardware devices activated yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {license.activations.map((act, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 6,
                      background: 'rgba(0,0,0,0.25)',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa' }}>
                      {act.machineId}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
                      {formatActualDateTime(act.activatedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 16,
            marginTop: 16,
            borderTop: '1px solid var(--glass-border)',
          }}
        >
          <button onClick={downloadJson} className="btn-secondary" style={{ fontSize: 13 }}>
            <Download size={14} /> Export JSON Certificate
          </button>
          <button onClick={onClose} className="btn-primary" style={{ fontSize: 13, minWidth: 100 }}>
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create License Modal (With Advanced Features & Options)
// ---------------------------------------------------------------------------
function CreateLicenseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (key: string) => void;
}) {
  const [form, setForm] = useState({
    productName: '',
    tier: 'basic',
    maxActivations: '1',
    expiresAt: '',
    notes: '',
    recoveryHint: '',
    // Advanced options
    keyPrefix: 'VKPRO',
    keyChunks: 4,
    keyChunkLen: 4,
    keySeparator: '-',
    licenseeName: '',
    licenseeEmail: '',
    orderRef: '',
    hardwarePolicy: 'floating',
    ipRestriction: '',
    domainRestriction: '',
    gracePeriodDays: '0',
    autoVault: true,
  });

  const [features, setFeatures] = useState<string[]>([
    'api_access',
    'offline_validation',
  ]);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Expiry preset helper
  function applyExpiryPreset(days: number | null) {
    if (days === null) {
      setForm((f) => ({ ...f, expiresAt: '' }));
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + days);
    setForm((f) => ({ ...f, expiresAt: d.toISOString().split('T')[0] }));
  }

  // Toggle feature entitlement
  function toggleFeature(featKey: string) {
    setFeatures((prev) =>
      prev.includes(featKey) ? prev.filter((k) => k !== featKey) : [...prev, featKey]
    );
  }

  // Live dynamic key preview
  const keyPreview = (() => {
    const pfx = form.keyPrefix ? form.keyPrefix.trim().toUpperCase() : '';
    const parts = pfx ? [pfx] : [];
    const chunks = Math.min(Math.max(form.keyChunks, 2), 6);
    const len = Math.min(Math.max(form.keyChunkLen, 3), 6);
    for (let i = 0; i < chunks; i++) {
      parts.push('X'.repeat(len));
    }
    return parts.join(form.keySeparator || '-');
  })();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await licenseApi.create({
        ...form,
        maxActivations: parseInt(form.maxActivations, 10),
        gracePeriodDays: parseInt(form.gracePeriodDays, 10) || 0,
        expiresAt: form.expiresAt || undefined,
        features,
      });
      onCreated(data.licenseKey);
      toast.success(
        form.autoVault
          ? 'License generated and encrypted in Credential Vault! 🔐'
          : 'License generated successfully!'
      );
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Failed to create license');
      setIsLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        className="glass-card w-full max-w-xl max-h-[92vh] flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{ padding: 28 }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Key size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                Store & Generate License Key
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                AES-256-GCM cipher encryption with MongoDB persistence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Product Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
              Product / Application Name *
            </label>
            <input
              className="input-field"
              value={form.productName}
              onChange={(e) => setForm((f) => ({ ...f, productName: e.target.value }))}
              placeholder="e.g. Acme Studio Pro Desktop"
              required
            />
          </div>

          {/* Tier & Activations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
                License Tier
              </label>
              <select
                className="input-field"
                value={form.tier}
                onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
              >
                {['free', 'basic', 'pro', 'enterprise', 'lifetime'].map((t) => (
                  <option key={t} value={t} style={{ background: '#18181c' }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
                Max Hardware Nodes
              </label>
              <input
                className="input-field"
                type="number"
                min="1"
                max="1000"
                value={form.maxActivations}
                onChange={(e) => setForm((f) => ({ ...f, maxActivations: e.target.value }))}
              />
            </div>
          </div>

          {/* Expiry Presets & Date */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
                Validity Window / Expiry Date
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => applyExpiryPreset(30)}
                  style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer' }}
                >
                  30 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyExpiryPreset(365)}
                  style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--color-text-muted)', border: 'none', cursor: 'pointer' }}
                >
                  1 Year
                </button>
                <button
                  type="button"
                  onClick={() => applyExpiryPreset(null)}
                  style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}
                >
                  Lifetime
                </button>
              </div>
            </div>
            <input
              className="input-field"
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            />
          </div>

          {/* Key Format Pattern Preview */}
          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid var(--glass-border)',
              borderRadius: 10,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>
                Key Architecture Pattern
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 13,
                  color: '#10b981',
                  fontWeight: 600,
                }}
              >
                {keyPreview}
              </span>
            </div>
            <span
              style={{
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                background: 'rgba(16,185,129,0.15)',
                color: '#10b981',
              }}
            >
              Hardware-Random
            </span>
          </div>

          {/* ADVANCED FEATURES TOGGLE */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              color: 'var(--color-primary-light)',
              fontWeight: 600,
              fontSize: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sliders size={14} />
              <span>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Features & Security Policies'}</span>
            </div>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* EXPANDED ADVANCED OPTIONS */}
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* Key Formatting Engine */}
              <div
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 10 }}>
                  1. Key Formatting & Prefix
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                      Prefix
                    </label>
                    <select
                      className="input-field"
                      value={form.keyPrefix}
                      onChange={(e) => setForm((f) => ({ ...f, keyPrefix: e.target.value }))}
                      style={{ fontSize: 12 }}
                    >
                      <option value="VKPRO">VKPRO (Pro)</option>
                      <option value="VKENT">VKENT (Enterprise)</option>
                      <option value="VKLIF">VKLIF (Lifetime)</option>
                      <option value="VKDEV">VKDEV (Developer)</option>
                      <option value="">None (Standard)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                      Chunk Count
                    </label>
                    <select
                      className="input-field"
                      value={form.keyChunks}
                      onChange={(e) => setForm((f) => ({ ...f, keyChunks: parseInt(e.target.value, 10) }))}
                      style={{ fontSize: 12 }}
                    >
                      <option value={3}>3 Chunks</option>
                      <option value={4}>4 Chunks</option>
                      <option value={5}>5 Chunks</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                      Separator
                    </label>
                    <select
                      className="input-field"
                      value={form.keySeparator}
                      onChange={(e) => setForm((f) => ({ ...f, keySeparator: e.target.value }))}
                      style={{ fontSize: 12 }}
                    >
                      <option value="-">Hyphen (-)</option>
                      <option value=".">Dot (.)</option>
                      <option value="_">Underscore (_)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Hardware Lock Policy & Grace Period */}
              <div
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 10 }}>
                  2. Hardware Lock & Grace Period
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                      Hardware Binding Mode
                    </label>
                    <select
                      className="input-field"
                      value={form.hardwarePolicy}
                      onChange={(e) => setForm((f) => ({ ...f, hardwarePolicy: e.target.value }))}
                      style={{ fontSize: 12 }}
                    >
                      <option value="floating">Floating Seats (Roaming)</option>
                      <option value="strict_fingerprint">Strict Machine Fingerprint</option>
                      <option value="single_machine">Single Machine Lock</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                      Grace Period (Days)
                    </label>
                    <select
                      className="input-field"
                      value={form.gracePeriodDays}
                      onChange={(e) => setForm((f) => ({ ...f, gracePeriodDays: e.target.value }))}
                      style={{ fontSize: 12 }}
                    >
                      <option value="0">None (Strict Expire)</option>
                      <option value="7">7 Days Grace</option>
                      <option value="14">14 Days Grace</option>
                      <option value="30">30 Days Grace</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feature Entitlements Checkboxes */}
              <div
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 10 }}>
                  3. Feature Entitlements Granted
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    { id: 'api_access', label: 'API & SDK Access' },
                    { id: 'offline_validation', label: 'Offline Air-gapped Nodes' },
                    { id: 'export_reports', label: 'Analytics & Audit Export' },
                    { id: 'team_seats', label: 'Multi-Seat Team Sharing' },
                    { id: 'quantum_vault', label: 'Quantum Vault Sync' },
                    { id: 'beta_access', label: 'Beta / Early Access' },
                  ].map((feat) => {
                    const isChecked = features.includes(feat.id);
                    return (
                      <label
                        key={feat.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 12,
                          color: isChecked ? 'var(--color-text)' : 'var(--color-text-muted)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFeature(feat.id)}
                          style={{ accentColor: '#7c3aed' }}
                        />
                        {feat.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Licensee & Network Metadata */}
              <div
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)', display: 'block', marginBottom: 10 }}>
                  4. Customer & Network Policy
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                      Licensee / Organization
                    </label>
                    <input
                      className="input-field"
                      value={form.licenseeName}
                      onChange={(e) => setForm((f) => ({ ...f, licenseeName: e.target.value }))}
                      placeholder="Acme Global Inc."
                      style={{ fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                      Customer Email
                    </label>
                    <input
                      className="input-field"
                      value={form.licenseeEmail}
                      onChange={(e) => setForm((f) => ({ ...f, licenseeEmail: e.target.value }))}
                      placeholder="licenses@acme.com"
                      style={{ fontSize: 12 }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                      Order / Invoice Reference
                    </label>
                    <input
                      className="input-field"
                      value={form.orderRef}
                      onChange={(e) => setForm((f) => ({ ...f, orderRef: e.target.value }))}
                      placeholder="INV-2026-904"
                      style={{ fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                      IP / CIDR Whitelist
                    </label>
                    <input
                      className="input-field"
                      value={form.ipRestriction}
                      onChange={(e) => setForm((f) => ({ ...f, ipRestriction: e.target.value }))}
                      placeholder="192.168.1.0/24"
                      style={{ fontSize: 12 }}
                    />
                  </div>
                </div>
              </div>

              {/* Automatic Vault Storing Option */}
              <div
                style={{
                  background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <input
                  type="checkbox"
                  id="autoVaultCheck"
                  checked={form.autoVault}
                  onChange={(e) => setForm((f) => ({ ...f, autoVault: e.target.checked }))}
                  style={{ accentColor: '#7c3aed', width: 16, height: 16 }}
                />
                <label htmlFor="autoVaultCheck" style={{ fontSize: 12, color: 'var(--color-text)', cursor: 'pointer' }}>
                  <strong>Auto-store in Credential Vault:</strong> Save an encrypted AES-256 backup into your Vault immediately
                </label>
              </div>
            </motion.div>
          )}

          {/* Recovery Hint & Notes */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
              Recovery Hint (Optional)
            </label>
            <input
              className="input-field"
              value={form.recoveryHint}
              onChange={(e) => setForm((f) => ({ ...f, recoveryHint: e.target.value }))}
              placeholder="e.g. Registered to billing@acme.com"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>
              Internal Notes (Optional)
            </label>
            <textarea
              className="input-field"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Private administrative notes..."
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex: 1 }}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Storing & Encrypting...
                </>
              ) : (
                <>
                  <Key size={15} /> Store to Database
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// License Key Reveal Modal (shown ONCE after creation)
// ---------------------------------------------------------------------------
function NewKeyModal({ licenseKey, onClose }: { licenseKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copyKey() {
    navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    toast.success('Key copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        className="glass-card w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ padding: 32, textAlign: 'center' }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            margin: '0 auto 20px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Key size={24} color="#10b981" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Your License Key
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          ⚠️ Copy this key now — it is encrypted with AES-256-GCM in the database.
        </p>
        <div
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 16,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 18,
            letterSpacing: '0.08em',
            color: '#10b981',
            wordBreak: 'break-all',
          }}
        >
          {licenseKey}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copyKey} className="btn-primary" style={{ flex: 1 }}>
            {copied ? (
              <>
                <CheckCheck size={15} /> Copied!
              </>
            ) : (
              <>
                <Copy size={15} /> Copy Key
              </>
            )}
          </button>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// License Card with Actual DB Date & Time and 3-Dots More Options
// ---------------------------------------------------------------------------
function LicenseCard({ license, onRefresh }: { license: License; onRefresh: () => void }) {
  const [revealing, setRevealing] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 3-dots dropdown menu and details modal state
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const statusColors: Record<string, string> = {
    active: '#10b981',
    expired: '#f59e0b',
    revoked: '#ef4444',
    suspended: '#a1a1aa',
    pending: '#7c3aed',
  };

  const tierColors: Record<string, string> = {
    free: '#71717a',
    basic: '#7c3aed',
    pro: '#06b6d4',
    enterprise: '#f59e0b',
    lifetime: '#10b981',
  };

  async function revealKey(): Promise<string | null> {
    if (revealedKey) {
      setRevealedKey(null);
      return null;
    }
    setRevealing(true);
    try {
      const { data } = await licenseApi.reveal(license._id);
      setRevealedKey(data.licenseKey);
      return data.licenseKey;
    } catch {
      toast.error('Failed to reveal key');
      return null;
    } finally {
      setRevealing(false);
    }
  }

  async function copyKey() {
    let keyToCopy = revealedKey;
    if (!keyToCopy) {
      keyToCopy = await revealKey();
    }
    if (keyToCopy) {
      navigator.clipboard.writeText(keyToCopy);
      setCopied(true);
      toast.success('License key copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function copyDbId() {
    navigator.clipboard.writeText(license._id);
    toast.success('Database ID copied to clipboard!');
    setMenuOpen(false);
  }

  async function handleQuickVerify() {
    setMenuOpen(false);
    toast.loading('Verifying license against cryptographic authority...', { id: 'verify-toast' });
    try {
      let key = revealedKey;
      if (!key) {
        const { data } = await licenseApi.reveal(license._id);
        key = data.licenseKey;
      }
      const { data: verifyData } = await licenseApi.verify({ licenseKey: key! });
      if (verifyData.valid) {
        toast.success(`License Verified! Valid for ${verifyData.productName}`, { id: 'verify-toast' });
      } else {
        toast.error(`Verification returned invalid: ${verifyData.message || 'Key rejected'}`, { id: 'verify-toast' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification check failed', { id: 'verify-toast' });
    }
  }

  async function handleStoreToVault() {
    setMenuOpen(false);
    try {
      let key = revealedKey;
      if (!key) {
        const { data } = await licenseApi.reveal(license._id);
        key = data.licenseKey;
      }
      await vaultApi.create({
        label: `${license.productName} License`,
        category: 'license_key',
        secretValue: key,
        description: `Stored license key for ${license.productName} (${license.tier}). Stored to DB: ${license.createdAt}`,
        tags: ['license', license.tier, 'db-export'],
      });
      toast.success('Stored encrypted in Credential Vault! 🔐');
    } catch {
      toast.error('Failed to save to vault');
    }
  }

  function handleExportJson() {
    setMenuOpen(false);
    const exportData = {
      _id: license._id,
      productName: license.productName,
      tier: license.tier,
      status: license.status,
      maxActivations: license.maxActivations,
      activationsCount: license.activations?.length || 0,
      createdAt: license.createdAt,
      expiresAt: license.expiresAt || 'Lifetime',
      recoveryHint: license.recoveryHint,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `license-${license._id.slice(-6)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded license certificate JSON');
  }

  async function revoke() {
    setMenuOpen(false);
    if (!confirm('Revoke this license? This action cannot be undone.')) return;
    setRevoking(true);
    try {
      await licenseApi.revoke(license._id, 'Revoked via dashboard');
      toast.success('License revoked');
      onRefresh();
    } catch {
      toast.error('Failed to revoke license');
      setRevoking(false);
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!confirm(`Permanently delete license for "${license.productName}" from the database?`)) return;
    setDeleting(true);
    try {
      await licenseApi.delete(license._id);
      toast.success('License deleted from database');
      onRefresh();
    } catch {
      toast.error('Failed to delete license');
      setDeleting(false);
    }
  }

  const expiryDate = license.expiresAt ? new Date(license.expiresAt) : null;
  const isExpiringSoon =
    expiryDate &&
    expiryDate > new Date() &&
    expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const formattedActualDateTime = formatActualDateTime(license.createdAt);

  return (
    <>
      <motion.div
        className="glass-card"
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 20, position: 'relative' }}
      >
        {/* Top Header: Title, Status, Tier & 3-Dots Button */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>
                {license.productName}
              </h3>
              <span className={`badge badge-${license.status}`}>
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: statusColors[license.status],
                    display: 'inline-block',
                  }}
                />
                {license.status}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: `${tierColors[license.tier] || '#7c3aed'}20`,
                  color: tierColors[license.tier] || '#7c3aed',
                  border: `1px solid ${tierColors[license.tier] || '#7c3aed'}30`,
                }}
              >
                {license.tier.toUpperCase()}
              </span>
            </div>
          </div>

          {/* THREE-DOTS MENU TRIGGER */}
          <div style={{ position: 'relative' }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="btn-secondary"
              style={{
                width: 32,
                height: 32,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
              }}
              title="More actions & options"
            >
              <MoreVertical size={16} />
            </button>

            {/* THREE-DOTS POPUP DROPDOWN */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 6,
                    width: 220,
                    background: 'var(--color-surface)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                    borderRadius: 12,
                    padding: 6,
                    zIndex: 40,
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <button
                    onClick={() => { setMenuOpen(false); revealKey(); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    {revealedKey ? <EyeOff size={14} color="#f59e0b" /> : <Eye size={14} color="#38bdf8" />}
                    <span>{revealedKey ? 'Hide Secret Key' : 'Reveal Secret Key'}</span>
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); copyKey(); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Copy size={14} color="#10b981" />
                    <span>Copy License Key</span>
                  </button>

                  <button
                    onClick={copyDbId}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Database size={14} color="#8b5cf6" />
                    <span>Copy Database ID</span>
                  </button>

                  <button
                    onClick={handleQuickVerify}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Shield size={14} color="#06b6d4" />
                    <span>Verify Status Live</span>
                  </button>

                  <button
                    onClick={handleStoreToVault}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Vault size={14} color="#ec4899" />
                    <span>Save to Vault</span>
                  </button>

                  <button
                    onClick={handleExportJson}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Download size={14} color="#eab308" />
                    <span>Export JSON Certificate</span>
                  </button>

                  <button
                    onClick={() => { setMenuOpen(false); setShowDetails(true); }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <FileText size={14} color="#a855f7" />
                    <span>View DB Inspector</span>
                  </button>

                  <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />

                  {license.status === 'active' && (
                    <button
                      onClick={revoke}
                      disabled={revoking}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 10px',
                        background: 'none',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 12,
                        color: '#f87171',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <ShieldX size={14} />
                      <span>Revoke License</span>
                    </button>
                  )}

                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      color: '#ef4444',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Trash2 size={14} />
                    <span>Delete from DB</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Key display */}
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              letterSpacing: '0.06em',
              color: revealedKey ? '#a78bfa' : 'var(--color-text-muted)',
              wordBreak: 'break-all',
            }}
          >
            {revealedKey || '••••-••••-••••-••••'}
          </span>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {revealedKey && (
              <button
                onClick={copyKey}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: 4,
                }}
                title="Copy Key"
              >
                {copied ? <CheckCheck size={14} color="#10b981" /> : <Copy size={14} />}
              </button>
            )}
            <button
              onClick={revealKey}
              disabled={revealing}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                padding: 4,
              }}
              title={revealedKey ? 'Hide Key' : 'Reveal AES Encrypted Key'}
            >
              {revealing ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : revealedKey ? (
                <EyeOff size={14} />
              ) : (
                <Eye size={14} />
              )}
            </button>
          </div>
        </div>

        {/* Metadata: Activations & Expiration */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-muted)' }}>
            <MonitorSmartphone size={12} />
            {license.activations?.length || 0}/{license.maxActivations} nodes
          </div>
          {expiryDate && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 12,
                color: isExpiringSoon ? '#f59e0b' : 'var(--color-text-muted)',
              }}
            >
              {isExpiringSoon && <AlertTriangle size={12} />}
              <Calendar size={12} />
              Expires {expiryDate.toLocaleDateString()}
            </div>
          )}
          {!expiryDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#10b981' }}>
              <Lock size={12} /> Lifetime
            </div>
          )}
          {license.licenseeName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#38bdf8' }}>
              <Building size={12} /> {license.licenseeName}
            </div>
          )}
        </div>

        {license.recoveryHint && (
          <div
            style={{
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 12,
              color: 'var(--color-text-muted)',
              marginBottom: 12,
            }}
          >
            💡 {license.recoveryHint}
          </div>
        )}

        {/* ACTUAL DATE & TIME STORED TO DB (PRIMARY HIGHLIGHT) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTop: '1px solid var(--glass-border)',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--color-primary-light)',
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.22)',
              padding: '4px 9px',
              borderRadius: 6,
            }}
            title={`MongoDB createdAt: ${license.createdAt}`}
          >
            <Clock size={12} className="text-violet-400" />
            <span>
              <strong>Stored in DB:</strong> {formattedActualDateTime}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => setShowDetails(true)}
              className="btn-secondary"
              style={{ fontSize: 11, padding: '4px 8px' }}
              title="Inspect full database record"
            >
              Details
            </button>
            {license.status === 'active' && (
              <button
                onClick={revoke}
                disabled={revoking}
                className="btn-danger"
                style={{ fontSize: 11, padding: '4px 8px' }}
                title="Revoke license"
              >
                {revoking ? (
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldX size={12} />
                )}
                Revoke
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Inspector Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <LicenseDetailsModal license={license} onClose={() => setShowDetails(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  const fetchLicenses = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await licenseApi.list({ status: statusFilter || undefined });
      setLicenses(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load licenses');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  function handleCreated(key: string) {
    setShowCreate(false);
    setNewKey(key);
    fetchLicenses();
  }

  const filtered = licenses.filter(
    (l) =>
      !search ||
      l.productName.toLowerCase().includes(search.toLowerCase()) ||
      l.licenseeName?.toLowerCase().includes(search.toLowerCase()) ||
      l.licenseeEmail?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)' }}>License Keys</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
            {total} total license{total !== 1 ? 's' : ''} stored in database with exact timestamps
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> New License
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="relative" style={{ flex: '1 1 200px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          />
          <input
            className="input-field"
            placeholder="Search licenses by product or licensee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
        <select
          className="input-field"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 130 }}
        >
          <option value="">All statuses</option>
          {['active', 'expired', 'revoked', 'suspended', 'pending'].map((s) => (
            <option key={s} value={s} style={{ background: '#18181c' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <button onClick={fetchLicenses} className="btn-secondary" title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* License grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 210, borderRadius: 16 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          className="glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ padding: 48, textAlign: 'center' }}
        >
          <Key size={40} style={{ margin: '0 auto 16px', color: 'var(--color-text-subtle)' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
            No licenses found
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20 }}>
            {search ? 'Try a different search term.' : 'Create your first license key to get started.'}
          </p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <Plus size={15} /> Generate License
            </button>
          )}
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          <AnimatePresence>
            {filtered.map((license) => (
              <LicenseCard key={license._id} license={license} onRefresh={fetchLicenses} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateLicenseModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
        )}
        {newKey && <NewKeyModal licenseKey={newKey} onClose={() => setNewKey(null)} />}
      </AnimatePresence>
    </div>
  );
}
