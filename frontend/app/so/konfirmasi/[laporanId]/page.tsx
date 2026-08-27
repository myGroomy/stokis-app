'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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

export default function KonfirmasiLaporanPage() {
  const params = useParams();
  const laporanId = params?.laporanId as string;
  const { selectedCabang } = useCabang();

  const [waLink, setWaLink] = useState<string>('');
  const [laporan, setLaporan] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updatingWa, setUpdatingWa] = useState<boolean>(false);
  const [waSent, setWaSent] = useState<boolean>(false);

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

  const handleShareWhatsApp = async () => {
    if (!waLink) return;
    window.open(waLink, '_blank');

    try {
      setUpdatingWa(true);
      await fetch(`/api/laporan/${laporanId}/status-wa`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cabangId: selectedCabang?.Cabang_ID }),
      });
      setWaSent(true);
    } catch (e) {
      console.error('Failed to update WA status:', e);
    } finally {
      setUpdatingWa(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-[#1868DB] animate-spin" />
        <p className="text-[#44546F] text-sm tracking-wide">Menyiapkan laporan PDF...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6 text-center">
      {/* Success Badge */}
      <div className="inline-flex p-4 rounded-full bg-[#E3FCEF] text-[#216E4E] mb-2">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#172B4D] tracking-tight">
          Stock Opname Berhasil Disimpan
        </h1>
        <p className="text-[#44546F] text-sm max-w-md mx-auto">
          Data transaksi telah tercatat di spreadsheet cabang dan berkas PDF telah tersimpan di Google Drive.
        </p>
      </div>

      {/* Report Info Card */}
      <div className="surface-card p-6 text-left space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#DCDFE4]">
          <span className="text-sm text-[#44546F] font-semibold">Nomor Laporan</span>
          <span className="font-mono text-sm font-semibold text-[#172B4D] bg-[#F1F2F4] px-2.5 py-1 rounded">
            {laporanId}
          </span>
        </div>

        {laporan && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#44546F]">Tanggal dan Shift:</span>
              <span className="font-semibold text-[#172B4D]">{laporan.Tanggal_Operasional} ({laporan.Shift})</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#44546F]">Petugas Penanggung Jawab:</span>
              <span className="font-semibold text-[#172B4D]">{laporan.Petugas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#44546F]">Item Status Kritis:</span>
              <span className="font-bold text-[#CA3521] tabular-nums">{laporan.Jumlah_Kritis} Item</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#44546F]">Item Status Hampir Habis:</span>
              <span className="font-bold text-[#B38600] tabular-nums">{laporan.Jumlah_Hampir_Habis} Item</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        {laporan?.Link_PDF && (
          <a
            href={laporan.Link_PDF}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-default inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[44px]"
          >
            <FileText className="w-4 h-4 text-[#1868DB]" />
            <span>Buka File PDF Drive</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}

        <button
          onClick={handleShareWhatsApp}
          disabled={updatingWa}
          className="inline-flex items-center justify-center gap-2 bg-[#22A06B] hover:bg-[#216E4E] text-white px-6 py-3 rounded font-medium text-sm transition-colors disabled:opacity-50 min-h-[44px]"
        >
          <Share2 className="w-4 h-4" />
          <span>{waSent ? 'Kirim Ulang ke WhatsApp' : 'Kirim Laporan ke WhatsApp'}</span>
        </button>
      </div>

      {waSent && (
        <div className="inline-flex items-center gap-1.5 text-sm text-[#216E4E] font-medium bg-[#E3FCEF] px-4 py-2 rounded border border-[#BAF3DB]">
          <CheckCircle2 className="w-4 h-4" />
          <span>Status laporan telah diperbarui: Sudah Dikirim</span>
        </div>
      )}

      {/* Navigation Footer */}
      <div className="pt-6 border-t border-[#DCDFE4] flex items-center justify-between text-sm">
        <Link
          href="/laporan"
          className="inline-flex items-center gap-1.5 text-[#44546F] hover:text-[#172B4D] font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Riwayat Laporan</span>
        </Link>

        <Link
          href="/so/input"
          className="inline-flex items-center gap-1.5 text-[#1868DB] hover:text-[#0055CC] font-semibold transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Input Sesi Baru</span>
        </Link>
      </div>
    </div>
  );
}
