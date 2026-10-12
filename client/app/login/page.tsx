'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
  Cpu,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoFilled, setDemoFilled] = useState(false);

  // One-click demo filler for the requested dummy account
  function handleFillDemo() {
    setEmail('admin@example.com');
    setPassword('admin');
    setDemoFilled(true);
    toast.success('Admin demo credentials populated!', {
      icon: '⚡',
      duration: 2500,
    });
    setTimeout(() => setDemoFilled(false), 2000);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Authenticated with HS512 Security Session');
      router.push('/dashboard');
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-mesh">
      {/* Liquid Organic Floating Orbs */}
      <div className="liquid-orb-1" />
      <div className="liquid-orb-2" />
      <div className="liquid-orb-3" />

      {/* Top Bar with Night / Day Mode Toggle */}
      <header className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <ThemeToggle showLabels />
      </header>

      {/* Main Glass Portal Container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10 my-8"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-3 relative"
            style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.9) 0%, rgba(6, 182, 212, 0.9) 100%)',
              boxShadow: '0 12px 36px rgba(124, 58, 237, 0.45), inset 0 1px 2px rgba(255, 255, 255, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
          >
            <Shield size={32} color="#ffffff" strokeWidth={2.2} />
          </motion.div>

          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ color: 'var(--color-text)' }}
          >
            VaultKey
          </h1>

          {/* 512-Byte HS512 Security Badge */}
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="badge-liquid badge-512">
              <span className="dot-pulse" />
              <Cpu size={12} />
              HS512 • 512-Byte Quantum Cipher
            </span>
          </div>
        </div>

        {/* Apple Liquid Glass Card */}
        <div className="liquid-glass p-8 sm:p-9">
          {/* Quick Demo Fill Card */}
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleFillDemo}
            className="mb-6 p-3.5 rounded-xl cursor-pointer transition-all flex items-center justify-between"
            style={{
              background: demoFilled
                ? 'rgba(16, 185, 129, 0.15)'
                : 'var(--glass-bg)',
              border: demoFilled
                ? '1px solid rgba(16, 185, 129, 0.4)'
                : '1px solid var(--glass-border)',
              boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.2)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
                  color: '#ffffff',
                }}
              >
                <Zap size={16} />
              </div>
              <div className="text-left">
                <div
                  className="text-xs font-bold tracking-wide uppercase"
                  style={{ color: 'var(--color-primary-light)' }}
                >
                  Quick Demo Account
                </div>
                <div
                  className="text-xs font-mono"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  admin@example.com • admin
                </div>
              </div>
            </div>

            <button
              type="button"
              className="text-xs font-semibold px-2.5 py-1 rounded-md"
              style={{
                background: 'rgba(124, 58, 237, 0.15)',
                color: 'var(--color-primary-light)',
                border: '1px solid rgba(124, 58, 237, 0.3)',
              }}
            >
              {demoFilled ? 'Filled ✓' : 'Auto-fill'}
            </button>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="liquid-input pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  className="block text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="liquid-input pl-10 pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
                  style={{
                    color: 'var(--color-text-muted)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Button Row with Unlock Vault & Demo Sidebutton */}
            <div className="flex items-center gap-2.5 mt-2 w-full">
              <motion.button
                type="submit"
                disabled={isLoading}
                className="btn-liquid-primary flex-1"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  opacity: isLoading ? 0.75 : 1,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Vault</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </motion.button>

              {/* Dedicated Small Sidebutton for Demo */}
              <motion.button
                type="button"
                onClick={handleFillDemo}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                title="Fill demo credentials (admin@example.com / admin)"
                className="h-[46px] px-3.5 rounded-xl flex items-center justify-center gap-1.5 font-semibold text-xs transition-all relative overflow-hidden group shrink-0"
                style={{
                  background: demoFilled
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(6, 182, 212, 0.3))'
                    : 'linear-gradient(135deg, rgba(124, 58, 237, 0.22), rgba(6, 182, 212, 0.18))',
                  border: demoFilled
                    ? '1px solid rgba(16, 185, 129, 0.6)'
                    : '1px solid rgba(124, 58, 237, 0.45)',
                  color: demoFilled ? '#10b981' : 'var(--color-primary-light)',
                  boxShadow: '0 4px 14px rgba(124, 58, 237, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(12px)',
                }}
              >
                <Zap
                  size={14}
                  className={demoFilled ? 'animate-bounce text-emerald-400' : 'group-hover:rotate-12 transition-transform text-amber-300'}
                />
                <span className="tracking-wide font-bold">{demoFilled ? 'Filled ✓' : 'Demo'}</span>
              </motion.button>
            </div>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div
              className="w-full"
              style={{ height: 1, background: 'var(--glass-border)' }}
            />
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs tracking-wider uppercase font-semibold"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-muted)',
                borderRadius: 999,
                border: '1px solid var(--glass-border)',
              }}
            >
              or
            </span>
          </div>

          {/* Google OAuth Button */}
          <a
            href={`${API_URL}/auth/google`}
            className="btn-liquid-secondary w-full"
            style={{ textDecoration: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Sign in with Google</span>
          </a>
        </div>

        {/* Footer Link */}
        <p
          className="text-center mt-6 text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold transition-colors underline-offset-4 hover:underline"
            style={{ color: 'var(--color-primary-light)' }}
          >
            Create your vault free
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
