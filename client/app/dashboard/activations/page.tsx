'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  Server,
  Laptop,
  Cpu,
  RefreshCw,
  Search,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Radio,
  ExternalLink,
  MapPin,
  Clock,
  Key,
} from 'lucide-react';
import { licenseApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface MachineNode {
  licenseId: string;
  productName: string;
  tier: string;
  machineId: string;
  machineLabel?: string;
  activatedAt: string;
  ip?: string;
}

export default function ActivationsPage() {
  const [nodes, setNodes] = useState<MachineNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedNode, setSelectedNode] = useState<MachineNode | null>(null);

  async function fetchActivations() {
    setIsLoading(true);
    try {
      const { data } = await licenseApi.list({ limit: 100 });
      const extractedNodes: MachineNode[] = [];

      (data.data || []).forEach((lic: any) => {
        if (lic.activations && Array.isArray(lic.activations)) {
          lic.activations.forEach((act: any) => {
            extractedNodes.push({
              licenseId: lic._id,
              productName: lic.productName,
              tier: lic.tier,
              machineId: act.machineId,
              machineLabel: act.machineLabel || act.machineId,
              activatedAt: act.activatedAt,
              ip: act.ip || '127.0.0.1',
            });
          });
        }
      });

      setNodes(extractedNodes);
    } catch {
      toast.error('Failed to load hardware node activations');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchActivations();
  }, []);

  const filtered = nodes.filter(
    (n) =>
      !search ||
      n.machineId.toLowerCase().includes(search.toLowerCase()) ||
      n.productName.toLowerCase().includes(search.toLowerCase()) ||
      (n.machineLabel && n.machineLabel.toLowerCase().includes(search.toLowerCase())) ||
      (n.ip && n.ip.includes(search))
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text)' }}>Hardware Nodes & Activations</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginTop: 2 }}>
            Real-time telemetry and machine fingerprint bindings across all authorized licenses
          </p>
        </div>
        <button onClick={fetchActivations} className="btn-secondary" title="Refresh Node Network">
          <RefreshCw size={15} /> Refresh Nodes
        </button>
      </div>

      {/* High-level status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Active Hardware Nodes</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>{nodes.length}</p>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Server size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10b981', marginTop: 10 }}>
            <Radio size={12} className="animate-pulse" /> 100% Hardware Locked & Verified
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Cluster Gateways</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#06b6d4' }}>
                {nodes.filter((n) => n.machineId.includes('SRV') || n.machineId.includes('PROD')).length}
              </p>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={20} color="#06b6d4" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)', marginTop: 10 }}>
            <Activity size={12} /> High-throughput gateways
          </div>
        </div>

        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>Workstations / Dev Rigs</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed' }}>
                {nodes.filter((n) => !n.machineId.includes('SRV')).length}
              </p>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Laptop size={20} color="#7c3aed" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-muted)', marginTop: 10 }}>
            <CheckCircle2 size={12} /> Local developer workstations
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div className="relative" style={{ flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          <input
            className="input-field"
            placeholder="Search by Machine ID, node label, IP, or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 34 }}
          />
        </div>
      </div>

      {/* Nodes Grid */}
      {isLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <Server size={38} style={{ margin: '0 auto 14px', color: 'var(--color-text-subtle)' }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>No active hardware nodes found</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
            Activate a license using the API or client SDK to register hardware fingerprints.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
          <AnimatePresence>
            {filtered.map((node, i) => {
              const isServer = node.machineId.includes('SRV') || node.machineId.includes('PROD');

              return (
                <motion.div
                  key={`${node.licenseId}-${node.machineId}-${i}`}
                  className="glass-card"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ padding: 22, cursor: 'pointer' }}
                  onClick={() => setSelectedNode(node)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          background: isServer ? 'rgba(6,182,212,0.15)' : 'rgba(124,58,237,0.15)',
                          border: isServer ? '1px solid rgba(6,182,212,0.3)' : '1px solid rgba(124,58,237,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isServer ? <Server size={18} color="#06b6d4" /> : <Laptop size={18} color="#7c3aed" />}
                      </div>
                      <div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                          {node.machineLabel || node.machineId}
                        </h3>
                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {node.machineId}
                        </p>
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 10,
                        fontWeight: 700,
                        background: 'rgba(16,185,129,0.15)',
                        color: '#10b981',
                        border: '1px solid rgba(16,185,129,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981' }} /> ACTIVE
                    </span>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Bound Product:</span>
                      <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{node.productName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>IP Address:</span>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8' }}>{node.ip}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> Activated {new Date(node.activatedAt).toLocaleDateString()}
                    </span>
                    <span style={{ color: 'var(--color-primary-light)', fontWeight: 600 }}>Inspect Node ➔</span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Node Detail Modal */}
      <AnimatePresence>
        {selectedNode && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}
          >
            <motion.div
              className="glass-card w-full max-w-md"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{ padding: 28 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>Hardware Node Telemetry</h3>
                <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Machine Identifier</label>
                  <div className="input-field" style={{ fontFamily: 'JetBrains Mono, monospace', marginTop: 4 }}>{selectedNode.machineId}</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Machine Label</label>
                  <div className="input-field" style={{ marginTop: 4 }}>{selectedNode.machineLabel}</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Bound License Product</label>
                  <div className="input-field" style={{ marginTop: 4 }}>{selectedNode.productName} ({selectedNode.tier.toUpperCase()})</div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Registered IP / Gateway</label>
                  <div className="input-field" style={{ fontFamily: 'JetBrains Mono, monospace', color: '#06b6d4', marginTop: 4 }}>{selectedNode.ip}</div>
                </div>
              </div>

              <button onClick={() => setSelectedNode(null)} className="btn-primary w-full">
                Close Inspector
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
