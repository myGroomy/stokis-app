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

  // Filters
  const [filterTanggal, setFilterTanggal] = useState<string>('');
  const [filterShift, setFilterShift] = useState<string>('');
  const [filterPetugas, setFilterPetugas] = useState<string>('');

  // WhatsApp Modal State
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
      <div className="text-center py-16 surface-card rounded-3xl p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-[#B38600] mx-auto" />
        <h3 className="text-base font-bold text-[#172B4D]">Pilih Cabang Terlebih Dahulu</h3>
        <p className="text-[#44546F] text-sm">Silakan pilih cabang aktif melalui menu di navbar atas.</p>
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
        {/* Header */}
        <motion.div
          key="header"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#172B4D] flex items-center gap-2">
              <FileText className="w-6 h-6 text-[#1868DB]" />
              <span>Riwayat Laporan Stock Opname</span>
            </h1>
            <p className="text-[#44546F] text-sm mt-1">
              Cabang Operasional: <span className="text-[#172B4D] font-semibold">{selectedCabang.Nama_Cabang}</span>
            </p>
          </div>
        </motion.div>

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="surface-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#44546F] flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Filter Tanggal</span>
            </label>
            <input
              type="date"
              value={filterTanggal}
              onChange={(e) => setFilterTanggal(e.target.value)}
              className="w-full px-3 py-2 text-sm tabular-nums"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#44546F] flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Filter Shift</span>
            </label>
            <select
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
              className="w-full px-3 py-2 text-sm cursor-pointer"
            >
              <option value="">Semua Shift</option>
              <option value="Opening">Opening</option>
              <option value="Closing">Closing</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#44546F] flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>Pencarian Petugas</span>
            </label>
            <input
              type="text"
              placeholder="Ketik nama petugas..."
              value={filterPetugas}
              onChange={(e) => setFilterPetugas(e.target.value)}
              className="w-full px-3 py-2 text-sm"
            />
          </div>
        </motion.div>

        {/* Table Section */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="surface-card overflow-hidden"
        >
          {loading ? (
            <div className="p-16 text-center">
              <Loader2 className="w-8 h-8 text-[#1868DB] animate-spin mx-auto mb-2" />
              <p className="text-[#44546F] text-sm">Memuat arsip laporan...</p>
            </div>
          ) : laporanList.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <FileText className="w-12 h-12 text-[#44546F] mx-auto" />
              <h3 className="text-sm font-semibold text-[#172B4D]">Tidak Ada Laporan yang Ditemukan</h3>
              <p className="text-[#44546F] text-sm">Belum ada catatan SO yang sesuai dengan kriteria filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm mobile-card-table">
                <thead className="bg-[#F7F8F9] text-[#44546F] font-semibold border-b border-[#DCDFE4]">
                  <tr>
                    <th className="px-5 py-3">ID Laporan</th>
                    <th className="px-5 py-3">Tanggal dan Shift</th>
                    <th className="px-5 py-3">Petugas</th>
                    <th className="px-5 py-3 text-center">Kritis</th>
                    <th className="px-5 py-3 text-center">Hampir Habis</th>
                    <th className="px-5 py-3 text-center">Status WhatsApp</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y sm:divide-y-0 divide-[#DCDFE4] text-[#172B4D]">
                  {laporanList.map((row) => (
                    <motion.tr
                      key={row.Laporan_ID}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.15 }}
                      className="hover:bg-[#F7F8F9] transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-medium text-[#44546F]" data-label="ID">
                        {row.Laporan_ID}
                      </td>
                      <td className="px-5 py-4" data-label="Tanggal">
                        <span className="font-semibold text-[#172B4D] tabular-nums">{row.Tanggal_Operasional}</span>
                        <span className="ml-2 font-medium text-[#44546F] bg-[#F1F2F4] border border-[#DCDFE4] px-2 py-0.5 rounded text-xs">
                          {row.Shift}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-medium text-[#172B4D]" data-label="Petugas">
                        {row.Petugas}
                      </td>
                      <td className="px-5 py-4 text-center font-bold tabular-nums" data-label="Kritis">
                        {row.Jumlah_Kritis > 0 ? (
                          <span className="bg-[#FFEBE6] text-[#CA3521] border border-[#FFBDAD] px-2 py-1 rounded text-xs">
                            {row.Jumlah_Kritis}
                          </span>
                        ) : (
                          <span className="text-[#44546F]">0</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center font-bold tabular-nums" data-label="Hampir Habis">
                        {row.Jumlah_Hampir_Habis > 0 ? (
                          <span className="bg-[#FFFAE6] text-[#B38600] border border-[#F8E6A0] px-2 py-1 rounded text-xs">
                            {row.Jumlah_Hampir_Habis}
                          </span>
                        ) : (
                          <span className="text-[#44546F]">0</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center" data-label="WhatsApp">
                        <span
                          className={`lozenge ${
                            row.Status_Kirim_WA === 'Sudah Dikirim'
                              ? 'lozenge-success'
                              : 'lozenge-default'
                          }`}
                        >
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
                            className="inline-flex p-1.5 text-[#44546F] hover:text-[#1868DB] hover:bg-[#F1F2F4] rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleOpenWATemplate(row)}
                          title="Siapkan Pesan WhatsApp"
                          className="inline-flex p-1.5 text-[#44546F] hover:text-[#216E4E] hover:bg-[#F1F2F4] rounded transition-colors"
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

      {/* WhatsApp Template Modal */}
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
