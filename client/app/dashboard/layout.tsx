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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/licenses', icon: Key, label: 'Licenses' },
  { href: '/dashboard/vault', icon: Vault, label: 'Vault' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--glass-border)' }}>
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
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>HS512 Security Portal</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                    padding: '11px 14px',
                    borderRadius: 12,
                    background: isActive ? 'rgba(124, 58, 237, 0.16)' : 'transparent',
                    border: isActive ? '1px solid rgba(124, 58, 237, 0.35)' : '1px solid transparent',
                    color: isActive ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: isActive ? '0 4px 16px rgba(124,58,237,0.15)' : 'none',
                    backdropFilter: isActive ? 'blur(12px)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.7 }} />}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Day / Night Theme Switcher inside Sidebar */}
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)' }}>Theme Mode</span>
          <ThemeToggle />
        </div>

        {/* User profile */}
        <div style={{ padding: '16px 12px', borderTop: '1px solid var(--glass-border)' }}>
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
            style={{ fontSize: 13, padding: '9px 12px' }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
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
