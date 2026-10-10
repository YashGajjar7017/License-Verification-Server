'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabels?: boolean;
}

export default function ThemeToggle({ className = '', showLabels = false }: ThemeToggleProps) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div
      onClick={toggleTheme}
      className={`relative inline-flex items-center cursor-pointer select-none rounded-full p-1 transition-all duration-300 ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`Switch to ${isDark ? 'Day' : 'Night'} Mode`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTheme();
        }
      }}
      style={{
        background: isDark
          ? 'rgba(255, 255, 255, 0.08)'
          : 'rgba(0, 0, 0, 0.06)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: isDark
          ? '1px solid rgba(255, 255, 255, 0.16)'
          : '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: isDark
          ? '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
          : '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 1px rgba(255, 255, 255, 0.9)',
      }}
    >
      {/* Sliding Liquid Thumb */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          x: isDark ? 0 : 34,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        style={{
          width: 32,
          height: 32,
          top: 3,
          left: 4,
          background: isDark
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.85) 0%, rgba(99, 102, 241, 0.95) 100%)'
            : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
          boxShadow: isDark
            ? '0 2px 12px rgba(124, 58, 237, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.4)'
            : '0 2px 12px rgba(245, 158, 11, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.6)',
        }}
      />

      {/* Night (Moon) Option */}
      <div
        className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full"
        style={{ color: isDark ? '#ffffff' : 'var(--color-text-muted)' }}
      >
        <Moon size={16} strokeWidth={2.2} />
      </div>

      {/* Day (Sun) Option */}
      <div
        className="relative z-10 flex items-center justify-center w-8 h-8 rounded-full"
        style={{ color: !isDark ? '#ffffff' : 'var(--color-text-muted)' }}
      >
        <Sun size={17} strokeWidth={2.2} />
      </div>

      {showLabels && (
        <span
          className="ml-2 mr-3 text-xs font-semibold tracking-wide"
          style={{ color: 'var(--color-text)' }}
        >
          {isDark ? 'Night Mode' : 'Day Mode'}
        </span>
      )}
    </div>
  );
}
