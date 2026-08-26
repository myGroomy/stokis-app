import type { Metadata } from 'next';
import './globals.css';
import { CabangProvider } from '@/lib/CabangContext';
import { Navbar } from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Stokis — Sistem Stock Opname Multi Cabang',
  description: 'Sistem Stock Opname Multi Cabang dengan isolasi database Google Sheets dan laporan otomatis PDF & WhatsApp',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col font-sans antialiased bg-[#F7F8F9] text-[#172B4D]">
        <CabangProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 overflow-x-hidden">
            {children}
          </main>
        </CabangProvider>
      </body>
    </html>
  );
}
