'use client';

import { useState, useEffect, useCallback, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Vault,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  Trash2,
  Search,
  X,
  Key,
  Shield,
  ExternalLink,
  Lock,
  Tag,
  MoreVertical,
  Clock,
  Database,
  Archive,
  ArchiveRestore,
  FileText,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { vaultApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface VaultItem {
  _id: string;
  label: string;
  category: 'password' | 'api_key' | 'token' | 'certificate' | 'license_key' | 'ssh_key' | 'other';
  description?: string;
  website?: string;
  username?: string;
  tags?: string[];
  isArchived?: boolean;
  accessCount?: number;
  lastAccessedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  api_key: '⚡',
  password: '🔑',
  token: '🎟️',
  certificate: '📜',
  license_key: '🛡️',
  ssh_key: '🔐',
  other: '📦',
};

const CATEGORY_COLORS: Record<string, string> = {
  api_key: '#8b5cf6',
  password: '#06b6d4',
  token: '#10b981',
  certificate: '#f59e0b',
  license_key: '#ec4899',
  ssh_key: '#6366f1',
  other: '#64748b',
};

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
// Vault Item Inspector Modal
// ---------------------------------------------------------------------------
function VaultDetailsModal({
  item,
  onClose,
}: {
  item: VaultItem;
  onClose: () => void;
}) {
  const [copiedId, setCopiedId] = useState(false);

  function copyDbId() {
    navigator.clipboard.writeText(item._id);
    setCopiedId(true);
    toast.success('Database ID copied');
    setTimeout(() => setCopiedId(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        className="glass-card w-full max-w-lg"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{ padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(124,58,237,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8b5cf6',
              }}
            >
              <Database size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>
                Credential Database Record
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.label}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Exact DB Creation Date & Time */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(6,182,212,0.1))',
              border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 10,
              padding: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Clock size={15} color="#8b5cf6" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>
                Database Storage Timestamp
              </span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', fontFamily: 'JetBrains Mono, monospace' }}>
              {formatActualDateTime(item.createdAt)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, fontFamily: 'monospace' }}>
              ISO: {item.createdAt}
            </div>
          </div>

          {/* Database ID */}
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--glass-border)',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>MongoDB Document ID</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text)' }}>{item._id}</span>
            </div>
            <button onClick={copyDbId} className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }}>
              {copiedId ? <CheckCheck size={13} color="#10b981" /> : <Copy size={13} />}
            </button>
          </div>

          {/* Metadata Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12 }}>
            <div style={{ background: 'var(--glass-bg)', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Category</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text)', textTransform: 'capitalize' }}>
                {item.category.replace('_', ' ')}
              </span>
            </div>
            <div style={{ background: 'var(--glass-bg)', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)' }}>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Access Count</span>
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{item.accessCount || 0} decryptions</span>
            </div>
            {item.username && (
              <div style={{ background: 'var(--glass-bg)', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Username / ID</span>
                <span style={{ color: 'var(--color-text)' }}>{item.username}</span>
              </div>
            )}
            {item.lastAccessedAt && (
              <div style={{ background: 'var(--glass-bg)', padding: 10, borderRadius: 8, border: '1px solid var(--glass-border)' }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block' }}>Last Decrypted</span>
                <span style={{ color: 'var(--color-text)' }}>{formatActualDateTime(item.lastAccessedAt)}</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--glass-border)' }}>
          <button onClick={onClose} className="btn-primary" style={{ minWidth: 90 }}>
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Vault Item Modal (With Advanced Generator & Settings)
// ---------------------------------------------------------------------------
function AddVaultModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    label: '',
    category: 'api_key',
    secretValue: '',
    username: '',
    website: '',
    description: '',
    tags: '',
    environment: 'production',
    expiresAt: '',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Quick generator helpers
  function generatePasswordSecret() {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~';
    const rand = new Uint32Array(24);
    window.crypto.getRandomValues(rand);
    let pass = '';
    for (let i = 0; i < 24; i++) pass += chars[rand[i] % chars.length];
    setForm((f) => ({ ...f, secretValue: pass }));
    toast.success('Generated 24-character high-entropy password!');
  }

  function generateApiKeySecret() {
    const buffer = new Uint8Array(32);
    window.crypto.getRandomValues(buffer);
    const hex = Array.from(buffer).map((b) => b.toString(16).padStart(2, '0')).join('');
    setForm((f) => ({ ...f, secretValue: `sk_live_${hex.slice(0, 32)}` }));
    toast.success('Generated 256-bit API Secret token!');
  }

  function generateLicenseSecret() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const parts = ['VKPRO'];
    for (let i = 0; i < 3; i++) {
      const rand = new Uint32Array(4);
      window.crypto.getRandomValues(rand);
      let chunk = '';
      for (let j = 0; j < 4; j++) chunk += chars[rand[j] % chars.length];
      parts.push(chunk);
    }
    setForm((f) => ({ ...f, secretValue: parts.join('-'), category: 'license_key' }));
    toast.success('Generated structured license key!');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.secretValue) {
      toast.error('Secret value is required');
      return;
    }
    setIsLoading(true);
    try {
      const tagList = form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      if (form.environment && !tagList.includes(form.environment)) {
        tagList.push(form.environment);
      }
      await vaultApi.create({
        ...form,
        tags: tagList,
        expiresAt: form.expiresAt || undefined,
      });
      toast.success('Secret encrypted & stored in vault! 🔐');
      onCreated();
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Failed to save secret');
      setIsLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
    >
      <motion.div
        className="glass-card w-full max-w-lg max-h-[90vh] flex flex-col"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{ padding: 28 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Store New Credential</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, paddingRight: 4, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
              Item Name *
            </label>
            <input
              className="input-field"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="e.g. Production Stripe Secret"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                Category
              </label>
              <select
                className="input-field"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                <option value="api_key">API Key</option>
                <option value="password">Password</option>
                <option value="token">Token</option>
                <option value="certificate">Certificate</option>
                <option value="license_key">License Key</option>
                <option value="ssh_key">SSH Key</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                Username / Identifier
              </label>
              <input
                className="input-field"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                placeholder="e.g. admin@org.com"
              />
            </div>
          </div>

          {/* Secret Value with Quick Generators */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>
                Secret Value (AES-256-GCM) *
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={generatePasswordSecret}
                  style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--color-primary-light)', border: '1px solid rgba(124,58,237,0.3)', cursor: 'pointer' }}
                >
                  ⚡ Pass
                </button>
                <button
                  type="button"
                  onClick={generateApiKeySecret}
                  style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--color-primary-light)', border: '1px solid rgba(124,58,237,0.3)', cursor: 'pointer' }}
                >
                  ⚡ Token
                </button>
                <button
                  type="button"
                  onClick={generateLicenseSecret}
                  style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', cursor: 'pointer' }}
                >
                  ⚡ License
                </button>
              </div>
            </div>
            <input
              type="password"
              className="input-field"
              value={form.secretValue}
              onChange={(e) => setForm((f) => ({ ...f, secretValue: e.target.value }))}
              placeholder="Paste raw secret or use ⚡ generator above"
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
              Website URL (Optional)
            </label>
            <input
              className="input-field"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://dashboard.stripe.com"
            />
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary-light)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: 0,
            }}
          >
            <Sliders size={13} />
            <span>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options (Environment, Expiry, Description)'}</span>
          </button>

          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                    Deployment Environment
                  </label>
                  <select
                    className="input-field"
                    value={form.environment}
                    onChange={(e) => setForm((f) => ({ ...f, environment: e.target.value }))}
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                    Secret Expiration / Rotation Date
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.expiresAt}
                    onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                  Description / Context
                </label>
                <input
                  className="input-field"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="e.g. Master Stripe API key for billing services"
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                  Tags (Comma-separated)
                </label>
                <input
                  className="input-field"
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="production, api, stripe"
                />
              </div>
            </motion.div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex: 1 }}>
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Lock size={15} /> Encrypt & Save
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
// Vault Card with Actual DB Date & Time and 3-Dots More Options Menu
// ---------------------------------------------------------------------------
function VaultCard({ item, onRefresh }: { item: VaultItem; onRefresh: () => void }) {
  const [revealing, setRevealing] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 3-dots dropdown menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const catColor = CATEGORY_COLORS[item.category] || '#64748b';
  const icon = CATEGORY_ICONS[item.category] || '📦';

  async function handleToggleDecrypt(): Promise<string | null> {
    if (decryptedValue) {
      setDecryptedValue(null);
      return null;
    }
    setRevealing(true);
    try {
      const { data } = await vaultApi.decrypt(item._id);
      setDecryptedValue(data.data.secretValue);
      return data.data.secretValue;
    } catch {
      toast.error('Failed to decrypt vault secret');
      return null;
    } finally {
      setRevealing(false);
    }
  }

  async function handleCopy() {
    let val = decryptedValue;
    if (!val) {
      val = await handleToggleDecrypt();
    }
    if (val) {
      navigator.clipboard.writeText(val);
      setCopied(true);
      toast.success('Secret copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function copyDbId() {
    navigator.clipboard.writeText(item._id);
    toast.success('Database ID copied');
    setMenuOpen(false);
  }

  async function handleToggleArchive() {
    setMenuOpen(false);
    try {
      await vaultApi.toggleArchive(item._id);
      toast.success(item.isArchived ? 'Credential unarchived' : 'Credential archived');
      onRefresh();
    } catch {
      toast.error('Failed to update archive status');
    }
  }

  async function handleDelete() {
    setMenuOpen(false);
    if (!confirm(`Delete vault credential "${item.label}"?`)) return;
    setDeleting(true);
    try {
      await vaultApi.delete(item._id);
      toast.success('Credential deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete credential');
      setDeleting(false);
    }
  }

  const formattedActualDateTime = formatActualDateTime(item.createdAt);

  return (
    <>
      <motion.div
        className="glass-card"
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ padding: 20, position: 'relative' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${catColor}20`,
                border: `1px solid ${catColor}35`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </h3>
              {item.username && (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.username}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                background: `${catColor}15`,
                color: catColor,
                border: `1px solid ${catColor}30`,
              }}
            >
              {item.category.replace('_', ' ').toUpperCase()}
            </span>

            {/* THREE-DOTS MENU TRIGGER */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="btn-secondary"
                style={{
                  width: 28,
                  height: 28,
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 6,
                }}
                title="More options"
              >
                <MoreVertical size={14} />
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: 4,
                      width: 190,
                      background: 'var(--color-surface)',
                      border: '1px solid var(--glass-border)',
                      boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
                      borderRadius: 10,
                      padding: 6,
                      zIndex: 40,
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <button
                      onClick={() => { setMenuOpen(false); handleToggleDecrypt(); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
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
                      {decryptedValue ? <EyeOff size={13} color="#f59e0b" /> : <Eye size={13} color="#38bdf8" />}
                      <span>{decryptedValue ? 'Hide Secret' : 'Decrypt Secret'}</span>
                    </button>

                    <button
                      onClick={() => { setMenuOpen(false); handleCopy(); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
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
                      <Copy size={13} color="#10b981" />
                      <span>Copy Secret</span>
                    </button>

                    <button
                      onClick={copyDbId}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
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
                      <Database size={13} color="#8b5cf6" />
                      <span>Copy DB ID</span>
                    </button>

                    <button
                      onClick={handleToggleArchive}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
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
                      {item.isArchived ? <ArchiveRestore size={13} color="#06b6d4" /> : <Archive size={13} color="#eab308" />}
                      <span>{item.isArchived ? 'Unarchive' : 'Archive Item'}</span>
                    </button>

                    <button
                      onClick={() => { setMenuOpen(false); setShowInspector(true); }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
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
                      <FileText size={13} color="#a855f7" />
                      <span>Inspect Record</span>
                    </button>

                    <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />

                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 10px',
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
                      <Trash2 size={13} />
                      <span>Delete Item</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {item.description && (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
            {item.description}
          </p>
        )}

        {/* Secret Display & Decrypt Box */}
        <div
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid var(--glass-border)',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 12,
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
              letterSpacing: '0.04em',
              color: decryptedValue ? '#38bdf8' : 'var(--color-text-muted)',
              wordBreak: 'break-all',
            }}
          >
            {decryptedValue || '••••••••••••••••••••••••••••••••'}
          </span>

          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            {decryptedValue && (
              <button
                onClick={handleCopy}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
                title="Copy secret"
              >
                {copied ? <CheckCheck size={14} color="#10b981" /> : <Copy size={14} />}
              </button>
            )}
            <button
              onClick={handleToggleDecrypt}
              disabled={revealing}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
              title={decryptedValue ? 'Hide' : 'Decrypt with AES-GCM'}
            >
              {revealing ? (
                <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
              ) : decryptedValue ? (
                <EyeOff size={14} />
              ) : (
                <Eye size={14} />
              )}
            </button>
          </div>
        </div>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
            {item.tags.map((t, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: 11,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--color-text-muted)',
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* ACTUAL DB DATE & TIME DISPLAY IN FOOTER */}
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
              gap: 5,
              fontSize: 11,
              color: 'var(--color-primary-light)',
              background: 'rgba(124,58,237,0.09)',
              border: '1px solid rgba(124,58,237,0.2)',
              padding: '3px 8px',
              borderRadius: 6,
            }}
            title={`MongoDB Document createdAt: ${item.createdAt}`}
          >
            <Clock size={11} className="text-violet-400" />
            <span>
              <strong>Stored in DB:</strong> {formattedActualDateTime}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {item.website && (
              <a
                href={item.website}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--color-primary-light)', textDecoration: 'none', fontSize: 11 }}
              >
                <ExternalLink size={11} /> Open
              </a>
            )}
            <button
              onClick={() => setShowInspector(true)}
              className="btn-secondary"
              style={{ fontSize: 11, padding: '3px 8px' }}
              title="Inspect Record"
            >
              Details
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showInspector && (
          <VaultDetailsModal item={item} onClose={() => setShowInspector(false)} />
        )}
      </AnimatePresence>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main Vault Page
// ---------------------------------------------------------------------------
export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [total, setTotal] = useState(0);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await vaultApi.list({ category: categoryFilter || undefined });
      setItems(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load vault items');
    } finally {
      setIsLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filtered = items.filter(
    (item) =>
      !search ||
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      item.username?.toLowerCase().includes(search.toLowerCase())
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
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)' }}>Credential Vault</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
            {total} encrypted item{total !== 1 ? 's' : ''} stored with AES-256-GCM & verified timestamps
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <Plus size={16} /> Store Credential
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
            placeholder="Search vault..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>

        <select
          className="input-field"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ width: 'auto', minWidth: 140 }}
        >
          <option value="">All categories</option>
          <option value="api_key">API Keys</option>
          <option value="password">Passwords</option>
          <option value="token">Tokens</option>
          <option value="certificate">Certificates</option>
          <option value="license_key">License Keys</option>
          <option value="ssh_key">SSH Keys</option>
          <option value="other">Other</option>
        </select>

        <button onClick={fetchItems} className="btn-secondary" title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          className="glass-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ padding: 48, textAlign: 'center' }}
        >
          <Vault size={40} style={{ margin: '0 auto 16px', color: 'var(--color-text-subtle)' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
            No credentials found
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: 20 }}>
            {search ? 'Try another search term.' : 'Store your first encrypted credential in the vault.'}
          </p>
          {!search && (
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus size={15} /> Add Secret
            </button>
          )}
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          <AnimatePresence>
            {filtered.map((item) => (
              <VaultCard key={item._id} item={item} onRefresh={fetchItems} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showAdd && (
          <AddVaultModal
            onClose={() => setShowAdd(false)}
            onCreated={() => {
              setShowAdd(false);
              fetchItems();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
