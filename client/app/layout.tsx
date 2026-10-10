import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'VaultKey — Ultra-Secure License & Credential Vault (HS512)',
    template: '%s | VaultKey',
  },
  description:
    'Apple Liquid Glass interface with HS512 512-byte cryptographic JWT engine, AES-256-GCM encryption, and hardware license verification.',
  keywords: ['license server', 'credential vault', 'HS512', 'JWT 512 bytes', 'AES-256-GCM', 'liquid glass'],
  robots: 'noindex, nofollow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-mesh antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: 'liquid-glass-toast',
                style: {
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '14px',
                  fontSize: '14px',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  boxShadow: 'var(--glass-shadow)',
                },
                success: {
                  iconTheme: { primary: '#10b981', secondary: '#ffffff' },
                },
                error: {
                  iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
