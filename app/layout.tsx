import type { Metadata } from 'next';
import './globals.css';
import { CabangProvider } from '@/lib/CabangContext';
import { AuthProvider } from '@/lib/AuthContext';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Stokis - Sistem Stock Opname Multi Cabang',
  description: 'Sistem Stock Opname Multi Cabang dengan isolasi database Google Sheets dan laporan otomatis PDF & WhatsApp',
  icons: {
    icon: '/favicon.jpg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col font-sans antialiased" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-primary)' }}>
        <AuthProvider>
          <CabangProvider>
            <AuthGuard>
              <Navbar />
              <main className="flex-1 w-full max-w-6xl mx-auto px-4 pt-4 pb-24 md:py-8 overflow-x-hidden">
                {children}
              </main>
            </AuthGuard>
          </CabangProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
