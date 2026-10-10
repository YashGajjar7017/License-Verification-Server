'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Key,
  Vault,
  Settings,
  LogOut,
  Menu,
  LayoutDashboard,
  ChevronRight,
  Cpu,
  Server,
  Sliders,
  ShieldAlert,
  Puzzle,
  Copy,
  CheckCheck,
  Radio,
  ExternalLink,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/licenses', icon: Key, label: 'Licenses' },
  { href: '/dashboard/vault', icon: Vault, label: 'Credential Vault' },
  { href: '/dashboard/activations', icon: Server, label: 'Hardware Nodes' },
  { href: '/dashboard/generator', icon: Sliders, label: 'Crypto Studio' },
  { href: '/dashboard/audit', icon: ShieldAlert, label: 'Security & Audit' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

function ExtensionModal({ onClose }: { onClose: () => void }) {
  const [copiedToken, setCopiedToken] = useState(false);

  function copyToken() {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') || '' : '';
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    toast.success('Access Token copied! Paste in extension or login with email/password.');
    setTimeout(() => setCopiedToken(false), 2500);
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
        style={{ padding: 30 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <Puzzle size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--color-text)' }}>VaultKey Chrome Extension</h3>
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Direct database autofill & credential vault</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
              Installation Steps (30 seconds)
            </div>
            <ol style={{ fontSize: 12, color: 'var(--color-text-muted)', paddingLeft: 18, lineHeight: 1.6 }}>
              <li>Open Google Chrome and go to <code style={{ color: '#38bdf8' }}>chrome://extensions</code></li>
              <li>Turn <strong>ON</strong> "Developer mode" in the top-right corner.</li>
              <li>Click <strong>"Load unpacked"</strong> in the top-left corner.</li>
              <li>Select directory: <code style={{ color: '#38bdf8' }}>A:\Coding\License_Server\extension</code></li>
              <li>The VaultKey icon will appear in your Chrome toolbar!</li>
            </ol>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={copyToken} className="btn-primary" style={{ flex: 1 }}>
              {copiedToken ? <CheckCheck size={15} /> : <Copy size={15} />}
              <span>{copiedToken ? 'Token Copied!' : 'Copy Active Session Token'}</span>
            </button>
          </div>
        </div>

        <button onClick={onClose} className="btn-secondary w-full">
          Close Window
        </button>
      </motion.div>
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showExtModal, setShowExtModal] = useState(false);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-30 md:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={`sidebar ${open ? 'open' : ''}`} style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ padding: '22px 20px', borderBottom: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #7c3aed, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(124,58,237,0.4), inset 0 1px 1px rgba(255,255,255,0.4)',
                }}
              >
                <Shield size={20} color="white" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-text)' }}>VaultKey</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  HS512 Quantum Mesh
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 5, overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href} onClick={onClose} style={{ textDecoration: 'none' }}>
                <motion.div
                  whileHover={{ x: 3 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: isActive ? 'rgba(124, 58, 237, 0.16)' : 'transparent',
                    border: isActive ? '1px solid rgba(124, 58, 237, 0.35)' : '1px solid transparent',
                    color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 16px rgba(124,58,237,0.15)' : 'none',
                    backdropFilter: isActive ? 'blur(12px)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Chrome Extension Companion Card */}
        <div style={{ padding: '0 12px 12px' }}>
          <div
            onClick={() => setShowExtModal(true)}
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
              }}
            >
              <Puzzle size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>Chrome Extension</div>
              <div style={{ fontSize: 10, color: '#38bdf8' }}>Ready to Load Unpacked ➔</div>
            </div>
          </div>
        </div>

        {/* Day / Night Theme Switcher inside Sidebar */}
        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Theme Mode</span>
          <ThemeToggle />
        </div>

        {/* User profile */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid var(--glass-border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10,
              padding: '10px 12px',
              borderRadius: 12,
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 700,
                color: 'white',
                flexShrink: 0,
              }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                user?.name?.[0]?.toUpperCase() || 'A'
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn-liquid-secondary w-full"
            style={{ fontSize: 13, padding: '8px 12px' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {showExtModal && <ExtensionModal onClose={() => setShowExtModal(false)} />}
      </AnimatePresence>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-mesh">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Authenticating HS512 Session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }} className="bg-mesh">
      {/* Background Liquid Atmosphere Orbs */}
      <div className="liquid-orb-1" style={{ opacity: 0.5 }} />
      <div className="liquid-orb-2" style={{ opacity: 0.5 }} />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content" style={{ flex: 1, position: 'relative', zIndex: 10 }}>
        {/* Top Header Bar for Desktop & Mobile */}
        <div
          className="flex items-center justify-between mb-8 pb-4"
          style={{ borderBottom: '1px solid var(--glass-border)' }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text)' }}
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center gap-2">
              <span className="badge-liquid badge-512">
                <span className="dot-pulse" />
                <Cpu size={12} />
                HS512 512-Byte Active Session
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle showLabels />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
