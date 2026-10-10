'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  Lock,
  Cpu,
  Copy,
  CheckCheck,
  RefreshCw,
  Shield,
  Zap,
  Sliders,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { vaultApi, licenseApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function GeneratorPage() {
  const [activeTab, setActiveTab] = useState<'password' | 'license' | 'hs512' | 'aes'>('password');

  // Password state
  const [passLength, setPassLength] = useState(24);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generatedPass, setGeneratedPass] = useState('');

  // License state
  const [licPrefix, setLicPrefix] = useState('VKPRO');
  const [licChunks, setLicChunks] = useState(4);
  const [generatedLic, setGeneratedLic] = useState('');

  // HS512 Quantum Secret state
  const [hs512Secret, setHs512Secret] = useState('');

  // AES-256 Key state
  const [aesKey, setAesKey] = useState('');

  // Copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Vault save modal
  const [savingLabel, setSavingLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // Generators
  // ---------------------------------------------------------------------------

  function genPassword() {
    let charset = '';
    if (useLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (!charset) charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    const rand = new Uint32Array(passLength);
    window.crypto.getRandomValues(rand);

    let res = '';
    for (let i = 0; i < passLength; i++) {
      res += charset[rand[i] % charset.length];
    }
    setGeneratedPass(res);
  }

  function genLicense() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const parts = [licPrefix];

    for (let i = 0; i < licChunks - 1; i++) {
      const rand = new Uint32Array(4);
      window.crypto.getRandomValues(rand);
      let chunk = '';
      for (let j = 0; j < 4; j++) {
        chunk += chars[rand[j] % chars.length];
      }
      parts.push(chunk);
    }
    setGeneratedLic(parts.join('-'));
  }

  function genHS512Secret() {
    // 512 bytes = 1024 hex characters
    const buffer = new Uint8Array(512);
    window.crypto.getRandomValues(buffer);
    const hex = Array.from(buffer).map((b) => b.toString(16).padStart(2, '0')).join('');
    setHs512Secret(hex);
  }

  function genAES256Key() {
    // 32 bytes = 64 hex characters
    const buffer = new Uint8Array(32);
    window.crypto.getRandomValues(buffer);
    const hex = Array.from(buffer).map((b) => b.toString(16).padStart(2, '0')).join('');
    setAesKey(hex);
  }

  useEffect(() => {
    genPassword();
    genLicense();
    genHS512Secret();
    genAES256Key();
  }, []);

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  }

  async function saveCurrentToVault(value: string, defaultName: string, category: string) {
    const label = prompt('Enter a label to save this secret directly to the Vault:', defaultName);
    if (!label) return;

    setIsSaving(true);
    try {
      await vaultApi.create({
        label,
        category,
        secretValue: value,
        description: `Generated via VaultKey Cryptographic Studio on ${new Date().toLocaleDateString()}`,
        tags: ['generator', category],
      });
      toast.success('Secret encrypted and stored in your vault! 🔐');
    } catch {
      toast.error('Failed to save to vault');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: 880 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)' }}>Cryptographic Key & Password Studio</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
          High-entropy hardware-random generator for passwords, product license keys, AES-256 tokens, and 512-byte HS512 secrets
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { id: 'password', label: 'Password Generator', icon: Lock },
          { id: 'license', label: 'License Key Formatter', icon: Key },
          { id: 'hs512', label: '512-Byte HS512 Secret', icon: Cpu },
          { id: 'aes', label: 'AES-256-GCM Master Key', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={isActive ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. PASSWORD GENERATOR */}
      {activeTab === 'password' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}>
            High-Entropy Master Password
          </h2>

          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 16,
                letterSpacing: '0.04em',
                color: '#38bdf8',
                wordBreak: 'break-all',
              }}
            >
              {generatedPass}
            </span>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={genPassword} className="btn-secondary" title="Regenerate">
                <RefreshCw size={15} />
              </button>
              <button onClick={() => handleCopy(generatedPass, 'pass')} className="btn-primary">
                {copiedKey === 'pass' ? <CheckCheck size={15} /> : <Copy size={15} />}
                <span>{copiedKey === 'pass' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--color-text)', marginBottom: 8 }}>
                <span>Length: {passLength} characters</span>
                <span style={{ color: passLength >= 24 ? '#10b981' : '#f59e0b' }}>
                  {passLength >= 24 ? 'Military Fortified' : 'Standard'}
                </span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={passLength}
                onChange={(e) => {
                  setPassLength(parseInt(e.target.value, 10));
                  setTimeout(genPassword, 10);
                }}
                style={{ width: '100%', accentColor: '#7c3aed' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={useUpper} onChange={(e) => { setUseUpper(e.target.checked); setTimeout(genPassword, 10); }} style={{ accentColor: '#7c3aed' }} />
                Uppercase (A-Z)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={useLower} onChange={(e) => { setUseLower(e.target.checked); setTimeout(genPassword, 10); }} style={{ accentColor: '#7c3aed' }} />
                Lowercase (a-z)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={useNumbers} onChange={(e) => { setUseNumbers(e.target.checked); setTimeout(genPassword, 10); }} style={{ accentColor: '#7c3aed' }} />
                Numbers (0-9)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text)', cursor: 'pointer' }}>
                <input type="checkbox" checked={useSymbols} onChange={(e) => { setUseSymbols(e.target.checked); setTimeout(genPassword, 10); }} style={{ accentColor: '#7c3aed' }} />
                Symbols (!@#$%...)
              </label>
            </div>
          </div>

          <button
            onClick={() => saveCurrentToVault(generatedPass, 'Generated Master Password', 'password')}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Save size={15} /> Save Directly to Credential Vault
          </button>
        </motion.div>
      )}

      {/* 2. LICENSE KEY GENERATOR */}
      {activeTab === 'license' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}>
            Product License Key Formatter
          </h2>

          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 18,
                letterSpacing: '0.06em',
                color: '#10b981',
                wordBreak: 'break-all',
              }}
            >
              {generatedLic}
            </span>

            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button onClick={genLicense} className="btn-secondary" title="Regenerate">
                <RefreshCw size={15} />
              </button>
              <button onClick={() => handleCopy(generatedLic, 'lic')} className="btn-primary">
                {copiedKey === 'lic' ? <CheckCheck size={15} /> : <Copy size={15} />}
                <span>{copiedKey === 'lic' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                Tier Prefix
              </label>
              <select
                className="input-field"
                value={licPrefix}
                onChange={(e) => {
                  setLicPrefix(e.target.value);
                  setTimeout(genLicense, 10);
                }}
              >
                <option value="VKPRO">VKPRO (Pro Edition)</option>
                <option value="VKENT">VKENT (Enterprise Edition)</option>
                <option value="VKLIF">VKLIF (Lifetime Perpetual)</option>
                <option value="VKDEV">VKDEV (Developer SDK)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                Block Chunks
              </label>
              <select
                className="input-field"
                value={licChunks}
                onChange={(e) => {
                  setLicChunks(parseInt(e.target.value, 10));
                  setTimeout(genLicense, 10);
                }}
              >
                <option value={3}>3 Chunks (e.g. VKPRO-XXXX-XXXX)</option>
                <option value={4}>4 Chunks (e.g. VKPRO-XXXX-XXXX-XXXX)</option>
                <option value={5}>5 Chunks (e.g. VKPRO-XXXX-XXXX-XXXX-XXXX)</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => saveCurrentToVault(generatedLic, `${licPrefix} License Key`, 'license_key')}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Save size={15} /> Save Key to Credential Vault
          </button>
        </motion.div>
      )}

      {/* 3. HS512 QUANTUM 512-BYTE SECRET */}
      {activeTab === 'hs512' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>
                512-Byte HS512 Quantum Secret Key
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Exact 512 bytes (4096-bit cryptographic strength) for maximum HMAC-SHA512 session verification
              </p>
            </div>
            <span className="badge-liquid badge-512">HS512 • 4096 BITS</span>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: '16px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              lineHeight: 1.6,
              color: '#c4b5fd',
              wordBreak: 'break-all',
              maxHeight: 180,
              overflowY: 'auto',
              marginBottom: 20,
            }}
          >
            {hs512Secret}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={genHS512Secret} className="btn-secondary">
              <RefreshCw size={15} /> Regenerate 512 Bytes
            </button>
            <button onClick={() => handleCopy(hs512Secret, 'hs512')} className="btn-primary">
              {copiedKey === 'hs512' ? <CheckCheck size={15} /> : <Copy size={15} />}
              <span>{copiedKey === 'hs512' ? 'Copied 512 Bytes' : 'Copy 512-Byte Secret'}</span>
            </button>
            <button
              onClick={() => saveCurrentToVault(hs512Secret, 'HS512 Quantum Authority Secret', 'certificate')}
              className="btn-secondary"
            >
              <Save size={15} /> Save in Vault
            </button>
          </div>
        </motion.div>
      )}

      {/* 4. AES-256-GCM KEY */}
      {activeTab === 'aes' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>
                AES-256-GCM 32-Byte Master Secret
              </h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                32 bytes (256 bits) for symmetric zero-knowledge AEAD database encryption
              </p>
            </div>
            <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              AES-256-GCM
            </span>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid var(--glass-border)',
              borderRadius: 12,
              padding: '16px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 14,
              color: '#34d399',
              wordBreak: 'break-all',
              marginBottom: 20,
            }}
          >
            {aesKey}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={genAES256Key} className="btn-secondary">
              <RefreshCw size={15} /> Regenerate 32 Bytes
            </button>
            <button onClick={() => handleCopy(aesKey, 'aes')} className="btn-primary">
              {copiedKey === 'aes' ? <CheckCheck size={15} /> : <Copy size={15} />}
              <span>{copiedKey === 'aes' ? 'Copied Key' : 'Copy 32-Byte Key'}</span>
            </button>
            <button
              onClick={() => saveCurrentToVault(aesKey, 'AES-256 Database Master Key', 'api_key')}
              className="btn-secondary"
            >
              <Save size={15} /> Save in Vault
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
