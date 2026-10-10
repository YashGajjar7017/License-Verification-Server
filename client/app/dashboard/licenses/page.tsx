'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Plus, RefreshCw, Eye, EyeOff, Copy, CheckCheck,
  Trash2, ShieldX, Search, Filter, X, Lock, Unlock,
  AlertTriangle, MonitorSmartphone, Calendar,
} from 'lucide-react';
import { licenseApi } from '@/lib/api';
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
}

// ---------------------------------------------------------------------------
// Create License Modal
// ---------------------------------------------------------------------------
function CreateLicenseModal({ onClose, onCreated }: { onClose: () => void; onCreated: (key: string) => void }) {
  const [form, setForm] = useState({
    productName: '', tier: 'basic', maxActivations: '1', expiresAt: '', notes: '', recoveryHint: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await licenseApi.create({
        ...form,
        maxActivations: parseInt(form.maxActivations, 10),
        expiresAt: form.expiresAt || undefined,
      });
      onCreated(data.licenseKey);
      toast.success('License generated! Copy the key now.');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Failed to create license');
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <motion.div
        className="glass-card w-full max-w-lg"
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }} style={{ padding: 32 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Generate License Key</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>Product Name *</label>
            <input className="input-field" value={form.productName}
                   onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
                   placeholder="My Desktop App" required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>Tier</label>
              <select className="input-field" value={form.tier}
                      onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}>
                {['free', 'basic', 'pro', 'enterprise', 'lifetime'].map(t => (
                  <option key={t} value={t} style={{ background: '#18181c' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>Max Activations</label>
              <input className="input-field" type="number" min="1" max="1000" value={form.maxActivations}
                     onChange={e => setForm(f => ({ ...f, maxActivations: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>Expiry Date (optional)</label>
            <input className="input-field" type="date" value={form.expiresAt}
                   onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>Recovery Hint (optional)</label>
            <input className="input-field" value={form.recoveryHint}
                   onChange={e => setForm(f => ({ ...f, recoveryHint: e.target.value }))}
                   placeholder="e.g. Registered to john@acme.com on Jan 2025" />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', display: 'block', marginBottom: 6 }}>Notes (optional)</label>
            <textarea className="input-field" value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      rows={2} placeholder="Internal notes..." style={{ resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={isLoading} className="btn-primary" style={{ flex: 1 }}>
              {isLoading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</> : <><Key size={15} /> Generate</>}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
      <motion.div
        className="glass-card w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ padding: 32, textAlign: 'center' }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: '50%', margin: '0 auto 20px',
          background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Key size={24} color="#10b981" />
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
          Your License Key
        </h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
          ⚠️ Copy this key now — it will not be shown again.
        </p>
        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 16,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 18,
          letterSpacing: '0.08em', color: '#10b981', wordBreak: 'break-all',
        }}>
          {licenseKey}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copyKey} className="btn-primary" style={{ flex: 1 }}>
            {copied ? <><CheckCheck size={15} /> Copied!</> : <><Copy size={15} /> Copy Key</>}
          </button>
          <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Done</button>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// License Card
// ---------------------------------------------------------------------------
function LicenseCard({ license, onRefresh }: { license: License; onRefresh: () => void }) {
  const [revealing, setRevealing] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const statusColors: Record<string, string> = {
    active: '#10b981', expired: '#f59e0b', revoked: '#ef4444',
    suspended: '#a1a1aa', pending: '#7c3aed',
  };

  const tierColors: Record<string, string> = {
    free: '#71717a', basic: '#7c3aed', pro: '#06b6d4',
    enterprise: '#f59e0b', lifetime: '#10b981',
  };

  async function revealKey() {
    if (revealedKey) { setRevealedKey(null); return; }
    setRevealing(true);
    try {
      const { data } = await licenseApi.reveal(license._id);
      setRevealedKey(data.licenseKey);
    } catch {
      toast.error('Failed to reveal key');
    } finally {
      setRevealing(false);
    }
  }

  function copyKey() {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    toast.success('Key copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  async function revoke() {
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

  const expiryDate = license.expiresAt ? new Date(license.expiresAt) : null;
  const isExpiringSoon = expiryDate && expiryDate > new Date() &&
    expiryDate < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <motion.div
      className="glass-card"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: 20 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)' }}>{license.productName}</h3>
            <span className={`badge badge-${license.status}`}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColors[license.status], display: 'inline-block' }} />
              {license.status}
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: `${tierColors[license.tier] || '#7c3aed'}20`,
              color: tierColors[license.tier] || '#7c3aed',
              border: `1px solid ${tierColors[license.tier] || '#7c3aed'}30`,
            }}>
              {license.tier.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Key display */}
      <div style={{
        background: 'rgba(0,0,0,0.3)', border: '1px solid var(--color-border)',
        borderRadius: 8, padding: '10px 14px', marginBottom: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 13, letterSpacing: '0.06em',
          color: revealedKey ? '#a78bfa' : 'var(--color-text-muted)',
        }}>
          {revealedKey || '••••-••••-••••-••••'}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {revealedKey && (
            <button onClick={copyKey} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
              {copied ? <CheckCheck size={14} color="#10b981" /> : <Copy size={14} />}
            </button>
          )}
          <button onClick={revealKey} disabled={revealing}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}>
            {revealing ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> :
              revealedKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-muted)' }}>
          <MonitorSmartphone size={12} />
          {license.activations?.length || 0}/{license.maxActivations} activations
        </div>
        {expiryDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                        color: isExpiringSoon ? '#f59e0b' : 'var(--color-text-muted)' }}>
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
      </div>

      {license.recoveryHint && (
        <div style={{
          background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)',
          borderRadius: 6, padding: '6px 10px', fontSize: 12,
          color: 'var(--color-text-muted)', marginBottom: 14,
        }}>
          💡 {license.recoveryHint}
        </div>
      )}

      {/* Actions */}
      {license.status === 'active' && (
        <button onClick={revoke} disabled={revoking} className="btn-danger" style={{ fontSize: 12, padding: '6px 12px' }}>
          {revoking ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <ShieldX size={13} />}
          Revoke
        </button>
      )}
    </motion.div>
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

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);

  function handleCreated(key: string) {
    setShowCreate(false);
    setNewKey(key);
    fetchLicenses();
  }

  const filtered = licenses.filter(l =>
    !search || l.productName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)' }}>License Keys</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
            {total} total license{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> New License
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="relative" style={{ flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                     color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input className="input-field" placeholder="Search licenses..." value={search}
                 onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34 }} />
        </div>
        <select className="input-field" value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto', minWidth: 130 }}>
          <option value="">All statuses</option>
          {['active','expired','revoked','suspended','pending'].map(s => (
            <option key={s} value={s} style={{ background: '#18181c' }}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button onClick={fetchLicenses} className="btn-secondary" title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* License grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[0,1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div className="glass-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ padding: 48, textAlign: 'center' }}>
          <Key size={40} style={{ margin: '0 auto 16px', color: 'var(--color-text-subtle)' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>No licenses found</h3>
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
            {filtered.map(license => (
              <LicenseCard key={license._id} license={license} onRefresh={fetchLicenses} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showCreate && <CreateLicenseModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
        {newKey && <NewKeyModal licenseKey={newKey} onClose={() => setNewKey(null)} />}
      </AnimatePresence>
    </div>
  );
}
