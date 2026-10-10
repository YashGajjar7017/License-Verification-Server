import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'VaultKey — Secure License & Credential Manager',
    template: '%s | VaultKey',
  },
  description:
    'A professional license server and encrypted credential vault with AES-256-GCM security, JWT authentication, and Google OAuth.',
  keywords: ['license server', 'credential vault', 'key management', 'security'],
  robots: 'noindex, nofollow', // Private dashboard — no public indexing
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-mesh antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#18181c',
                color: '#f4f4f5',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '10px',
                fontSize: '14px',
                backdropFilter: 'blur(12px)',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#18181c' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#18181c' },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
