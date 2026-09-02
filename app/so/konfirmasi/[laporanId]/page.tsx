'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useCabang } from '@/lib/CabangContext';
import {
  CheckCircle2,
  Share2,
  ExternalLink,
  ArrowLeft,
  PlusCircle,
  RefreshCcw,
  Loader2,
  AlertTriangle,
  Table
} from 'lucide-react';
import { WATemplateModal } from '@/components/WATemplateModal';

export default function KonfirmasiLaporanPage() {
  const params = useParams();
  const laporanId = params?.laporanId as string;
  const { selectedCabang } = useCabang();

  const [showRegenerate, setShowRegenerate] = useState<boolean>(false);
const [laporan, setLaporan] = useState<any>(null);
const [loading, setLoading] = useState<boolean>(true);
const [waSent, setWaSent] = useState<boolean>(false);
const [showWATemplate, setShowWATemplate] = useState<boolean>(false);
const [errorMsg, setErrorMsg] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  // Read the flag set by the input page (if Link_XLSX was not ready)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const flag = localStorage.getItem('so_showRegenerate') === 'true';
      setShowRegenerate(flag);
      // clear flag so it does not persist to next laporan
      localStorage.removeItem('so_showRegenerate');
    }
  }, []);


  useEffect(() => {
    if (!selectedCabang || !laporanId) return;

    const fetchLaporan = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/laporan/${laporanId}/wa-link?cabang=${selectedCabang.Cabang_ID}`);
        const json = await res.json();
        if (json.success && json.data) {
          setLaporan(json.data.laporan);
          if (json.data.laporan?.Status_Kirim_WA === 'Sudah Dikirim') {
            setWaSent(true);
          }
        }
      } catch (e) {
        console.error('Error fetching laporan:', e);
        setErrorMsg('Gagal memuat detail laporan. Periksa koneksi internet Anda.');
      } finally {
        setLoading(false);
      }
    };

    fetchLaporan();
  }, [selectedCabang, laporanId]);

  const handleShareWhatsApp = () => {
    setShowWATemplate(true);
  };

  const [totalItem, setTotalItem] = useState<number>(0);


  // Fetch total item count from master items
  useEffect(() => {
    if (!selectedCabang?.Cabang_ID) return;
    const fetchTotal = async () => {
      try {
        const res = await fetch(`/api/master-item?cabang=${selectedCabang.Cabang_ID}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setTotalItem(json.data.length);
        } else if (json.success && Array.isArray(json.data?.items)) {
          setTotalItem(json.data.items.length);
        }
      } catch (e) {
        console.error('Failed to fetch total items', e);
      }
    };
    fetchTotal();
  }, [selectedCabang?.Cabang_ID]);

  const triggerRegenerate = async () => {
    if (!laporanId || !selectedCabang?.Cabang_ID) return;
    setIsRegenerating(true);
    try {
      const res = await fetch(
        `/api/laporan/${laporanId}/regenerate?cabang=${selectedCabang.Cabang_ID}`,
        { method: 'POST', credentials: 'include' }
      );
      const json = await res.json();
      if (json.success) {
        window.location.reload();
      } else {
        setErrorMsg(json.error?.message ?? 'Gagal regenerate spreadsheet');
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setIsRegenerating(false);
    }
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

  /**
   * Get XLSX link from database only - NO FALLBACK.
   * Returns empty string if Link_XLSX not set or not a Drive link.
   */
  const getXlsxLink = () => {
    if (laporan?.Link_XLSX && (laporan.Link_XLSX.includes('drive.google.com') || laporan.Link_XLSX.includes('drivesdk'))) {
      return laporan.Link_XLSX;
    }
    // NO FALLBACK - return empty string if not a valid Drive link
    return '';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-base-content/60 text-sm tracking-wide">Memuat detail laporan...</p>
      </div>
    );
  }

  if (!loading && !laporan) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="alert alert-error text-sm" role="alert">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg || 'Gagal memuat detail laporan.'}</span>
          <button
            onClick={() => { setErrorMsg(''); setLoading(true); window.location.reload(); }}
            className="btn btn-ghost btn-xs"
          >
            Coba Lagi
          </button>
        </div>
        <div className="pt-4 text-sm">
          <Link
            href="/laporan"
            className="inline-flex items-center gap-1.5 text-base-content/60 hover:text-base-content font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Riwayat Laporan</span>
          </Link>
        </div>
      </div>
    );
  }

  const hasXlsxLink = getXlsxLink() !== '';
  const xlsxLink = getXlsxLink();

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
              Data transaksi telah tercatat di spreadsheet cabang dan berkas XLSX telah tersimpan di Google Drive.
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
              {hasXlsxLink ? (
                <a href={xlsxLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary gap-2 px-5 py-3 min-h-[44px]">
                  <Table className="w-4 h-4" />
                  <span>Buka File XLSX</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              ) : (
                <button disabled className="btn btn-ghost gap-2 px-5 py-3 min-h-[44px] cursor-not-allowed opacity-50" title="File XLSX belum tersedia di Google Drive">
                  <Table className="w-4 h-4" />
                  <span>File XLSX Belum Tersedia</span>
                </button>
              )}

              {/* Always enabled Share WA button */}
              <button onClick={handleShareWhatsApp} className="btn btn-success gap-2 px-6 py-3 min-h-[44px]">
                <Share2 className="w-4 h-4" />
                <span>{waSent ? 'Kirim Ulang ke WhatsApp' : 'Siapkan Pesan WhatsApp'}</span>
              </button>

              {/* Regenerate button always shown, disabled when link is ready or loading */}
              <button
                onClick={triggerRegenerate}
                disabled={hasXlsxLink || isRegenerating}
                className={`btn btn-warning gap-2 px-5 py-3 min-h-[44px] ${hasXlsxLink ? 'btn-ghost opacity-50 cursor-not-allowed' : ''}`}
              >
                {isRegenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCcw className="w-4 h-4" />
                )}
                <span>Regenerate Spreadsheet</span>
              </button>
            </div>

          {/* Status XLSX Badge */}
          <div className="pt-1 flex items-center justify-center">
            {hasXlsxLink ? (
              <div className="flex items-center gap-1.5 text-xs text-success font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>File XLSX tersedia di Google Drive</span>
              </div>
            ) : null}
          </div>

          {waSent && (
            <div className="alert alert-success text-sm py-2 mt-2" role="alert">
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
            totalItem={totalItem || 136}
            jumlahKritis={laporan.Jumlah_Kritis}
            jumlahHampirHabis={laporan.Jumlah_Hampir_Habis}
            linkXLSX={xlsxLink}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
