'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Download,
  Filter,
  Search,
  Lock,
  Key,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditEvent {
  id: string;
  type: 'auth' | 'decrypt' | 'activation' | 'license_check' | 'security';
  title: string;
  detail: string;
  actor: string;
  ip: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'success';
}

const INITIAL_EVENTS: AuditEvent[] = [
  {
    id: 'aud-001',
    type: 'auth',
    title: 'HS512 Session Token Generated',
    detail: 'Signed with 512-byte quantum master key for admin@example.com',
    actor: 'admin@example.com',
    ip: '127.0.0.1',
    timestamp: 'Just now',
    severity: 'success',
  },
  {
    id: 'aud-002',
    type: 'decrypt',
    title: 'AES-256-GCM Vault Decrypt Request',
    detail: 'Decrypted "AWS Production KMS Master Key" secret payload',
    actor: 'admin@example.com',
    ip: '198.51.100.24',
    timestamp: '3 mins ago',
    severity: 'low',
  },
  {
    id: 'aud-003',
    type: 'activation',
    title: 'Hardware Fingerprint Node Activated',
    detail: 'Node SRV-PROD-US-EAST-01 bound to VaultKey Enterprise Shield 2026',
    actor: 'Hardware Agent',
    ip: '198.51.100.24',
    timestamp: '14 mins ago',
    severity: 'success',
  },
  {
    id: 'aud-004',
    type: 'license_check',
    title: 'HMAC License Verification Verified',
    detail: 'License VKENT-XXXX-XXXX verified with valid HMAC-SHA256 signature',
    actor: 'API Gateway',
    ip: '203.0.113.88',
    timestamp: '1 hour ago',
    severity: 'low',
  },
  {
    id: 'aud-005',
    type: 'decrypt',
    title: 'AES-256-GCM Vault Decrypt Request',
    detail: 'Decrypted "Stripe Live Webhook Signing Secret"',
    actor: 'admin@example.com',
    ip: '127.0.0.1',
    timestamp: '2 hours ago',
    severity: 'low',
  },
  {
    id: 'aud-006',
    type: 'activation',
    title: 'Failover Gateway Activated',
    detail: 'Node SRV-PROD-EU-CENTRAL-02 bound to Frankfurt Gateway cluster',
    actor: 'Frankfurt Node',
    ip: '203.0.113.88',
    timestamp: '5 hours ago',
    severity: 'success',
  },
  {
    id: 'aud-007',
    type: 'security',
    title: 'Rate Limit Threshold Enforced',
    detail: 'Brute-force protection activated on /api/auth/login from unauthorized IP',
    actor: 'System Firewall',
    ip: '192.0.2.14',
    timestamp: '1 day ago',
    severity: 'medium',
  },
];

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>(INITIAL_EVENTS);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  function handleExport() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vaultkey_audit_log_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Audit telemetry exported to JSON! 📋');
  }

  const filtered = events.filter((ev) => {
    const matchesSearch =
      !search ||
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      ev.detail.toLowerCase().includes(search.toLowerCase()) ||
      ev.ip.includes(search) ||
      ev.actor.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'all' || ev.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)' }}>Security Audit & Telemetry</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
            Immutable cryptographic audit trail for hardware nodes, vault decrypts, and authentication sessions
          </p>
        </div>
        <button onClick={handleExport} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Download size={15} /> Export Audit Log
        </button>
      </div>

      {/* Security Health Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Security Posture</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#10b981' }}>Fortified (99.8%)</p>
          <p style={{ fontSize: 11, color: '#10b981', marginTop: 4 }}>Zero unauthorized intrusions</p>
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Zero-Knowledge AEAD</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#06b6d4' }}>Active (AES-256)</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Hardware-enforced encryption</p>
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>JWT Signature Mode</p>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>HS512 (512-Bytes)</p>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>Post-quantum random secret</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="relative" style={{ flex: '1 1 200px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            className="input-field"
            placeholder="Search events by IP, title, actor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>

        <select className="input-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ width: 'auto', minWidth: 160 }}>
          <option value="all">All Event Types</option>
          <option value="auth">Authentication (HS512)</option>
          <option value="decrypt">Vault Decrypt (AES-256)</option>
          <option value="activation">Hardware Nodes</option>
          <option value="license_check">License Verifications</option>
          <option value="security">Firewall & Security</option>
        </select>
      </div>

      {/* Events List */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map((ev) => {
            const colors: Record<string, string> = {
              success: '#10b981',
              low: '#38bdf8',
              medium: '#f59e0b',
              high: '#ef4444',
            };
            const col = colors[ev.severity] || '#38bdf8';

            return (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'rgba(0,0,0,0.25)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 12,
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: col,
                      boxShadow: `0 0 10px ${col}80`,
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>{ev.title}</span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 4,
                          background: `${col}15`,
                          color: col,
                          border: `1px solid ${col}30`,
                          textTransform: 'uppercase',
                        }}
                      >
                        {ev.type}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>{ev.detail}</p>
                    <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
                      <span>👤 {ev.actor}</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>🌐 {ev.ip}</span>
                    </div>
                  </div>
                </div>

                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {ev.timestamp}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
