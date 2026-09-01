import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CabangProvider } from '@/lib/CabangContext';
import { AuthProvider } from '@/lib/AuthContext';
import { TourProvider } from '@/lib/TourContext';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Stokis - Sistem Stock Opname Multi Cabang',
  description: 'Sistem Stock Opname Multi Cabang dengan isolasi database Google Sheets dan laporan otomatis XLSX & WhatsApp',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={inter.variable}>
      <body data-theme="stokis" className="min-h-screen flex flex-col antialiased bg-base-200 text-base-content">
        <AuthProvider>
          <CabangProvider>
            <AuthGuard>
              <TourProvider>
                <Navbar />
                <main className="flex-1 w-full overflow-x-hidden">
                  {children}
                </main>
              </TourProvider>
            </AuthGuard>
          </CabangProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
