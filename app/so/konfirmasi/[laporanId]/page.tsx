'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useCabang } from '@/lib/CabangContext';
import {
  CheckCircle2,
  FileText,
  Share2,
  ExternalLink,
  ArrowLeft,
  PlusCircle,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Send
} from 'lucide-react';
import { WATemplateModal } from '@/components/WATemplateModal';

export default function KonfirmasiLaporanPage() {
  const params = useParams();
  const laporanId = params?.laporanId as string;
  const { selectedCabang } = useCabang();

  const [waLink, setWaLink] = useState<string>('');
  const [laporan, setLaporan] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingWa, setUpdatingWa] = useState<boolean>(false);
  const [waSent, setWaSent] = useState<boolean>(false);
  const [showWATemplate, setShowWATemplate] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedCabang || !laporanId) return;

    const fetchWa = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/laporan/${laporanId}/wa-link?cabang=${selectedCabang.Cabang_ID}`);
        const json = await res.json();
        if (json.success && json.data) {
          setWaLink(json.data.waLink);
          setLaporan(json.data.laporan);
          if (json.data.laporan?.Status_Kirim_WA === 'Sudah Dikirim') {
            setWaSent(true);
          }
        }
      } catch (e) {
        console.error('Error fetching WhatsApp link:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchWa();
  }, [selectedCabang, laporanId]);

  const handleShareWhatsApp = () => {
    setShowWATemplate(true);
  };

  const handleWASent = () => {
    setWaSent(true);
    setShowWATemplate(false);
    if (laporanId) {
      fetch(`/api/laporan/${laporanId}/status-wa`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabangId: selectedCabang?.Cabang_ID }),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-base-content/60 text-sm tracking-wide">Menyiapkan laporan PDF...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <AnimatePresence mode="wait">
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="inline-flex p-4 rounded-full bg-success/10 text-success mb-2">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-semibold text-base-content tracking-tight">
              Stock Opname Berhasil Disimpan
            </h1>
            <p className="text-base-content/60 text-sm max-w-md mx-auto">
              Data transaksi telah tercatat di spreadsheet cabang dan berkas PDF telah tersimpan di Google Drive.
            </p>
          </div>

          <div className="card bg-base-100 border border-base-300 p-6 text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-base-300">
              <span className="text-sm text-base-content/60 font-semibold">Nomor Laporan</span>
              <span className="font-mono text-sm font-semibold text-base-content bg-base-200 px-2.5 py-1 rounded">
                {laporanId}
              </span>
            </div>

            {laporan && (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Tanggal dan Shift:</span>
                  <span className="font-semibold text-base-content">{laporan.Tanggal_Operasional} ({laporan.Shift})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Petugas Penanggung Jawab:</span>
                  <span className="font-semibold text-base-content">{laporan.Petugas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Item Status Kritis:</span>
                  <span className="font-bold text-error tabular-nums">{laporan.Jumlah_Kritis} Item</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-base-content/60">Item Status Hampir Habis:</span>
                  <span className="font-bold text-warning tabular-nums">{laporan.Jumlah_Hampir_Habis} Item</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {laporan?.Link_PDF && (
              <a
                href={laporan.Link_PDF}
                target="_blank"
                rel="noopener noreferrer"
                className="btn gap-2 px-5 py-3 min-h-[44px]"
              >
                <FileText className="w-4 h-4 text-primary" />
                <span>Buka File PDF Drive</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <button
              onClick={handleShareWhatsApp}
              disabled={updatingWa}
              className="btn btn-success gap-2 px-6 py-3 min-h-[44px]"
            >
              <Share2 className="w-4 h-4" />
              <span>{waSent ? 'Kirim Ulang ke WhatsApp' : 'Siapkan Pesan WhatsApp'}</span>
            </button>
          </div>

          {waSent && (
            <div className="alert alert-success text-sm py-2 mt-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Status laporan telah diperbarui: Sudah Dikirim</span>
            </div>
          )}

          <div className="pt-6 border-t border-base-300 flex items-center justify-between text-sm">
            <Link
              href="/laporan"
              className="inline-flex items-center gap-1.5 text-base-content/60 hover:text-base-content font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Riwayat Laporan</span>
            </Link>

            <Link
              href="/so/input"
              className="inline-flex items-center gap-1.5 text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Input Sesi Baru</span>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showWATemplate && laporan && (
          <WATemplateModal
            isOpen={showWATemplate}
            onClose={() => setShowWATemplate(false)}
            cabangNama={selectedCabang?.Nama_Cabang || '-'}
            tanggal={laporan.Tanggal_Operasional}
            shift={laporan.Shift}
            petugas={laporan.Petugas}
            totalItem={laporan.Jumlah_Kritis + laporan.Jumlah_Hampir_Habis + (laporan.Detail?.length || 0)}
            jumlahKritis={laporan.Jumlah_Kritis}
            jumlahHampirHabis={laporan.Jumlah_Hampir_Habis}
            linkPDF={laporan.Link_PDF || ''}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
