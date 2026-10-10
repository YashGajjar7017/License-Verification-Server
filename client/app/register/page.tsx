'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, Eye, EyeOff, User, ArrowRight, Chrome, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Contains number', ok: /\d/.test(password) },
  ];
  const strength = checks.filter(c => c.ok).length;
  const colors = ['#ef4444', '#f59e0b', '#10b981'];
  const labels = ['Weak', 'Fair', 'Strong'];

  if (!password) return null;

  return (
    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < strength ? colors[strength - 1] : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s ease',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {checks.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
            color: c.ok ? '#10b981' : 'var(--color-text-muted)' }}>
            <CheckCircle2 size={11} />
            {c.label}
          </div>
        ))}
      </div>
      {strength > 0 && (
        <p style={{ fontSize: 11, marginTop: 4, color: colors[strength - 1], fontWeight: 600 }}>
          {labels[strength - 1]} password
        </p>
      )}
    </motion.div>
  );
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setIsLoading(true);
    try {
      await register(name, email, password);
      router.push('/dashboard');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 right-1/3 w-96 h-96 rounded-full opacity-15 blur-3xl pointer-events-none"
           style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="absolute bottom-1/3 left-1/4 w-72 h-72 rounded-full opacity-10 blur-3xl pointer-events-none"
           style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
               style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)', boxShadow: '0 8px 32px rgba(124,58,237,0.4)' }}>
            <Shield size={28} color="white" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Create your vault</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginTop: 4 }}>
            Secure license & credential management
          </p>
        </div>

        <div className="glass-card p-8">
          <a href={`${API_URL}/auth/google`}
             className="btn-secondary w-full mb-6"
             style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <Chrome size={18} />
            Sign up with Google
          </a>

          <div className="relative mb-6">
            <div style={{ height: 1, background: 'var(--color-border)' }} />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs"
                  style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)', borderRadius: 4 }}>
              or create with email
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Full name</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                     style={{ color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                <input type="text" value={name} onChange={e => setName(e.target.value)}
                       placeholder="John Doe" required className="input-field" style={{ paddingLeft: 38 }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Email address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                     style={{ color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                       placeholder="you@example.com" required className="input-field" style={{ paddingLeft: 38 }} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2"
                     style={{ color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
                <input type={showPassword ? 'text' : 'password'} value={password}
                       onChange={e => setPassword(e.target.value)}
                       placeholder="Min. 8 characters" required className="input-field"
                       style={{ paddingLeft: 38, paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <AnimatePresence>
                {password && <PasswordStrength password={password} />}
              </AnimatePresence>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: 4, opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account...</>
              ) : (
                <>Create account <ArrowRight size={16} /></>
              )}
            </motion.button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--color-primary-light)', fontWeight: 500 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
