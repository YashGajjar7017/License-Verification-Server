'use client';

import { motion } from 'framer-motion';
import { Shield, Key, Cpu, User, Mail, Lock, CheckCircle, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 800 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)' }}>Account & Security Settings</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
          Manage your cryptographic credentials and profile security
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Profile Card */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <User size={18} color="var(--color-primary-light)" /> Profile Information
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                Full Name
              </label>
              <div className="input-field" style={{ opacity: 0.9 }}>{user?.name || 'Administrator'}</div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                Email Address
              </label>
              <div className="input-field" style={{ opacity: 0.9 }}>{user?.email || 'admin@example.com'}</div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                Account Role
              </label>
              <div className="input-field" style={{ textTransform: 'capitalize', opacity: 0.9 }}>
                {user?.role || 'admin'}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', display: 'block', marginBottom: 4 }}>
                Email Verification
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 0', color: '#10b981', fontSize: 14, fontWeight: 600 }}>
                <CheckCircle size={16} /> Verified
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic Session Card */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cpu size={18} color="#06b6d4" /> Cryptographic HS512 Security Architecture
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Token Algorithm</span>
                <span className="badge-liquid badge-512">HS512 / HMAC-SHA512</span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                JWTs are signed with a 512-byte (4096-bit) cryptographically random secret for post-quantum resistant session security.
              </p>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>Vault Secret Cipher</span>
                <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  AES-256-GCM
                </span>
              </div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                All credentials and license keys are encrypted with 32-byte authenticated encryption with associated data (AEAD).
              </p>
            </div>
          </div>
        </div>

        {/* Interface Appearance Card */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 16 }}>
            Interface Appearance
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Day / Night Mode</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Toggle between Apple Liquid Dark and Light themes</p>
            </div>
            <ThemeToggle showLabels />
          </div>
        </div>
      </div>
    </div>
  );
}
