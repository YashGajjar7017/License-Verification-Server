'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
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
  createdAt: string;
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

// ---------------------------------------------------------------------------
// Add Vault Item Modal
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
  });
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.secretValue) {
      toast.error('Secret value is required');
      return;
    }
    setIsLoading(true);
    try {
      await vaultApi.create({
        ...form,
        tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
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
        className="glass-card w-full max-w-lg"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        style={{ padding: 32 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Store New Credential</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
              Secret Value (Encrypted AES-256-GCM) *
            </label>
            <input
              type="password"
              className="input-field"
              value={form.secretValue}
              onChange={(e) => setForm((f) => ({ ...f, secretValue: e.target.value }))}
              placeholder="Paste raw password, token, or key"
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

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
              Tags (Comma-separated)
            </label>
            <input
              className="input-field"
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="production, api, stripe"
            />
          </div>

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
// Vault Card
// ---------------------------------------------------------------------------
function VaultCard({ item, onRefresh }: { item: VaultItem; onRefresh: () => void }) {
  const [revealing, setRevealing] = useState(false);
  const [decryptedValue, setDecryptedValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const catColor = CATEGORY_COLORS[item.category] || '#64748b';
  const icon = CATEGORY_ICONS[item.category] || '📦';

  async function handleToggleDecrypt() {
    if (decryptedValue) {
      setDecryptedValue(null);
      return;
    }
    setRevealing(true);
    try {
      const { data } = await vaultApi.decrypt(item._id);
      setDecryptedValue(data.data.secretValue);
    } catch {
      toast.error('Failed to decrypt vault secret');
    } finally {
      setRevealing(false);
    }
  }

  function handleCopy() {
    if (!decryptedValue) return;
    navigator.clipboard.writeText(decryptedValue);
    setCopied(true);
    toast.success('Secret copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDelete() {
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

  return (
    <motion.div
      className="glass-card"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: 20 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            }}
          >
            {icon}
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>{item.label}</h3>
            {item.username && (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.username}</p>
            )}
          </div>
        </div>

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
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
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

      {/* Footer Details */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: 'var(--color-text-muted)' }}>
          {item.website && (
            <a
              href={item.website}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--color-primary-light)', textDecoration: 'none' }}
            >
              <ExternalLink size={11} /> Open
            </a>
          )}
          <span>Created {new Date(item.createdAt).toLocaleDateString()}</span>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
          title="Delete item"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
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
            {total} encrypted item{total !== 1 ? 's' : ''} stored with AES-256-GCM
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
        {showAdd && <AddVaultModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); fetchItems(); }} />}
      </AnimatePresence>
    </div>
  );
}
