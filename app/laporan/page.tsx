'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCabang } from '@/lib/CabangContext';
import {
  FileText,
  Search,
  ExternalLink,
  Share2,
  Calendar,
  Clock,
  User,
  ShieldAlert,
  Loader2,
  Filter
} from 'lucide-react';
import { WATemplateModal } from '@/components/WATemplateModal';

interface LaporanItem {
  Laporan_ID: string;
  Sesi_ID: string;
  Tanggal_Operasional: string;
  Shift: string;
  Petugas: string;
  Waktu_Dibuat: string;
  Link_PDF: string;
  Jumlah_Kritis: number;
  Jumlah_Hampir_Habis: number;
  Status_Kirim_WA: string;
}

export default function LaporanPage() {
  const { selectedCabang } = useCabang();

  const [laporanList, setLaporanList] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [filterTanggal, setFilterTanggal] = useState<string>('');
  const [filterShift, setFilterShift] = useState<string>('');
  const [filterPetugas, setFilterPetugas] = useState<string>('');

  const [showWATemplate, setShowWATemplate] = useState<boolean>(false);
  const [selectedLaporan, setSelectedLaporan] = useState<LaporanItem | null>(null);

  const fetchLaporan = async () => {
    if (!selectedCabang) return;
    try {
      setLoading(true);
      const query = new URLSearchParams({
        cabang: selectedCabang.Cabang_ID,
        ...(filterTanggal ? { tanggal: filterTanggal } : {}),
        ...(filterShift ? { shift: filterShift } : {}),
        ...(filterPetugas ? { petugas: filterPetugas } : {}),
      });

      const res = await fetch(`/api/laporan?${query.toString()}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setLaporanList(json.data.reverse());
      }
    } catch (e) {
      console.error('Error fetching laporan:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [selectedCabang, filterTanggal, filterShift, filterPetugas]);

  if (!selectedCabang) {
    return (
      <div className="text-center py-16 card bg-base-100 border border-base-300 p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 mx-auto text-warning" />
        <h3 className="text-base font-bold text-base-content">Pilih Cabang Terlebih Dahulu</h3>
        <p className="text-sm text-base-content/60">Silakan pilih cabang aktif melalui menu di navbar atas.</p>
      </div>
    );
  }

  const handleOpenWATemplate = (laporan: LaporanItem) => {
    setSelectedLaporan(laporan);
    setShowWATemplate(true);
  };

  const handleWASent = (laporanId: string) => {
    setShowWATemplate(false);
    setSelectedLaporan(null);
    fetch(`/api/laporan/${laporanId}/status-wa`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cabangId: selectedCabang?.Cabang_ID }),
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key="header"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 text-base-content">
              <FileText className="w-6 h-6 text-primary" />
              <span>Riwayat Laporan Stock Opname</span>
            </h1>
            <p className="text-sm mt-1 text-base-content/60">
              Cabang Operasional: <span className="font-semibold text-base-content">{selectedCabang.Nama_Cabang}</span>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="card bg-base-100 border border-base-300 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-1.5 text-base-content/60">
              <Calendar className="w-3.5 h-3.5" />
              <span>Filter Tanggal</span>
            </label>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              className="input input-bordered w-full min-h-[42px] text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-1.5 text-base-content/60">
              <Clock className="w-3.5 h-3.5" />
              <span>Filter Shift</span>
            </label>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="select select-bordered w-full min-h-[42px] text-sm"
            >
              <option value="">Semua Shift</option>
              <option value="Opening">Opening</option>
              <option value="Closing">Closing</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold flex items-center gap-1.5 text-base-content/60">
              <User className="w-3.5 h-3.5" />
              <span>Pencarian Petugas</span>
            </label>
            <input
              type="text"
              placeholder="Ketik nama petugas..."
              value={filterPetugas}
              onChange={(e) => setFilterPetugas(e.target.value)}
              className="input input-bordered w-full min-h-[42px] text-sm"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="card bg-base-100 border border-base-300 overflow-hidden"
        >
          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-base-content/60">Memuat arsip laporan...</p>
            </div>
          ) : laporanList.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <FileText className="w-12 h-12 mx-auto text-base-content/30" />
              <h3 className="text-sm font-semibold text-base-content">Tidak Ada Laporan yang Ditemukan</h3>
              <p className="text-sm text-base-content/60">Belum ada catatan SO yang sesuai dengan kriteria filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm mobile-card-table">
                <thead className="bg-base-200 border-b border-base-300">
                  <tr className="font-semibold text-base-content/60">
                    <th className="px-5 py-3">ID Laporan</th>
                    <th className="px-5 py-3">Tanggal dan Shift</th>
                    <th className="px-5 py-3">Petugas</th>
                    <th className="px-5 py-3 text-center">Kritis</th>
                    <th className="px-5 py-3 text-center">Hampir Habis</th>
                    <th className="px-5 py-3 text-center">Status WhatsApp</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-base-content">
                  {laporanList.map((row) => (
                    <motion.tr
                      key={row.Laporan_ID}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.15 }}
                      className="transition-colors border-b border-base-300 hover:bg-base-200"
                    >
                      <td className="px-5 py-4 font-mono font-medium text-base-content/60" data-label="ID">
                        {row.Laporan_ID}
                      </td>
                      <td className="px-5 py-4" data-label="Tanggal">
                        <span className="font-semibold tabular-nums text-base-content">{row.Tanggal_Operasional}</span>
                        <span className="ml-2 font-medium text-xs px-2 py-0.5 rounded-md bg-base-200 text-base-content/60 border border-base-300">
                          {row.Shift}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-base-content" data-label="Petugas">
                        {row.Petugas}
                      </td>
                      <td className="px-5 py-4 text-center font-bold tabular-nums" data-label="Kritis">
                        {row.Jumlah_Kritis > 0 ? (
                          <span className="badge badge-error gap-1">
                            {row.Jumlah_Kritis}
                          </span>
                        ) : (
                          <span className="text-base-content/30">0</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center font-bold tabular-nums" data-label="Hampir Habis">
                        {row.Jumlah_Hampir_Habis > 0 ? (
                          <span className="badge badge-warning gap-1">
                            {row.Jumlah_Hampir_Habis}
                          </span>
                        ) : (
                          <span className="text-base-content/30">0</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center" data-label="WhatsApp">
                        <span className={`badge ${row.Status_Kirim_WA === 'Sudah Dikirim' ? 'badge-success' : 'badge-ghost'}`}>
                          {row.Status_Kirim_WA || 'Belum'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2" data-label="Aksi">
                        {row.Link_PDF && (
                          <a
                            href={row.Link_PDF}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Buka Berkas PDF di Google Drive"
                            className="btn btn-ghost btn-xs text-base-content/60 hover:text-primary"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenWATemplate(row)}
                          title="Siapkan Pesan WhatsApp"
                          className="btn btn-ghost btn-xs text-base-content/60 hover:text-success"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showWATemplate && selectedLaporan && (
          <WATemplateModal
            isOpen={showWATemplate}
            onClose={() => setShowWATemplate(false)}
            cabangNama={selectedCabang.Nama_Cabang}
            tanggal={selectedLaporan.Tanggal_Operasional}
            shift={selectedLaporan.Shift}
            petugas={selectedLaporan.Petugas}
            totalItem={selectedLaporan.Jumlah_Kritis + selectedLaporan.Jumlah_Hampir_Habis}
            jumlahKritis={selectedLaporan.Jumlah_Kritis}
            jumlahHampirHabis={selectedLaporan.Jumlah_Hampir_Habis}
            linkPDF={selectedLaporan.Link_PDF || ''}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
