'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Vault, Shield, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { licenseApi, vaultApi } from '@/lib/api';
import Link from 'next/link';

interface Stats {
  totalLicenses: number;
  activeLicenses: number;
  expiredLicenses: number;
  vaultItems: number;
}

function StatCard({
  icon: Icon, label, value, color, delay = 0,
}: {
  icon: React.ElementType; label: string; value: number | string; color: string; delay?: number;
}) {
  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      style={{ padding: 24 }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
            {value}
          </p>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${color}20`,
          border: `1px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </motion.div>
  );
}

function RecentActivity() {
  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      style={{ padding: 24 }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 20 }}>
        Recent Activity
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { action: 'License verified', detail: 'VKPRO-XXX2-K4LM-8TQ9', time: '2 min ago', color: '#10b981' },
          { action: 'Vault item accessed', detail: 'GitHub API Key', time: '15 min ago', color: '#7c3aed' },
          { action: 'New license created', detail: 'Enterprise — 5 seats', time: '1 hr ago', color: '#06b6d4' },
          { action: 'License revoked', detail: 'VKFRE-Y9BT-2PL1-W5MK', time: '3 hr ago', color: '#ef4444' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 + i * 0.07 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: item.color, boxShadow: `0 0 8px ${item.color}80`,
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>{item.action}</p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                {item.detail}
              </p>
            </div>
            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', flexShrink: 0 }}>{item.time}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function QuickActions() {
  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      style={{ padding: 24 }}
    >
      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 20 }}>
        Quick Actions
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Link href="/dashboard/licenses?action=create" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ x: 4 }}
            className="btn-secondary w-full"
            style={{ justifyContent: 'flex-start', gap: 10 }}
          >
            <Key size={15} /> Generate New License
          </motion.div>
        </Link>
        <Link href="/dashboard/vault?action=create" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ x: 4 }}
            className="btn-secondary w-full"
            style={{ justifyContent: 'flex-start', gap: 10 }}
          >
            <Vault size={15} /> Store Credential
          </motion.div>
        </Link>
        <Link href="/dashboard/licenses?action=verify" style={{ textDecoration: 'none' }}>
          <motion.div
            whileHover={{ x: 4 }}
            className="btn-secondary w-full"
            style={{ justifyContent: 'flex-start', gap: 10 }}
          >
            <Shield size={15} /> Verify a License
          </motion.div>
        </Link>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalLicenses: 0, activeLicenses: 0, expiredLicenses: 0, vaultItems: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [licAll, licActive, licExpired, vault] = await Promise.allSettled([
          licenseApi.list({ limit: 1 }),
          licenseApi.list({ status: 'active', limit: 1 }),
          licenseApi.list({ status: 'expired', limit: 1 }),
          vaultApi.list({ limit: 1 }),
        ]);
        setStats({
          totalLicenses:  licAll.status === 'fulfilled' ? licAll.value.data.pagination.total : 0,
          activeLicenses: licActive.status === 'fulfilled' ? licActive.value.data.pagination.total : 0,
          expiredLicenses:licExpired.status === 'fulfilled' ? licExpired.value.data.pagination.total : 0,
          vaultItems:     vault.status === 'fulfilled' ? vault.value.data.pagination.total : 0,
        });
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32 }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', marginBottom: 4 }}>
          {greeting}, {user?.name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Here&apos;s your security overview for today.
        </p>
      </motion.div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {isLoading ? (
          [0,1,2,3].map(i => (
            <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />
          ))
        ) : (
          <>
            <StatCard icon={Key}           label="Total Licenses"    value={stats.totalLicenses}   color="#7c3aed" delay={0} />
            <StatCard icon={Activity}      label="Active Licenses"   value={stats.activeLicenses}  color="#10b981" delay={0.08} />
            <StatCard icon={AlertTriangle} label="Expired Licenses"  value={stats.expiredLicenses} color="#f59e0b" delay={0.12} />
            <StatCard icon={Vault}         label="Vault Secrets"     value={stats.vaultItems}      color="#06b6d4" delay={0.16} />
          </>
        )}
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <RecentActivity />
        <QuickActions />
      </div>
    </div>
  );
}
