'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useCabang } from '@/lib/CabangContext';
import { useAuth } from '@/lib/AuthContext';
import {
  ClipboardCheck,
  Send,
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Layers,
  ShieldAlert,
  Hash,
  Search,
  Filter,
  StickyNote,
  X,
  BadgeCheck,
} from 'lucide-react';
import { QuantumLoaderFull, QuantumLoaderMini } from '@/components/ui/QuantumLoader';
import { staggerContainer, staggerItem } from '@/components/PageTransition';

interface MasterItem {
  Item_ID: string;
  Nama_Barang: string;
  Area: string;
  Satuan: string;
  Threshold: number;
}

interface PreviousSO {
  step1: number;
  step2: number;
  total: number;
  tanggal: string;
  shift: string;
  petugas: string;
}

export interface SOItemPayload {
  itemId: string;
  namaBarang: string;
  satuan: string;
  area: string;
  threshold: number;
  step1: number;
  step2: number;
  keterangan: string;
  prevStep1: number | null;
  prevStep2: number | null;
  prevTotal: number | null;
  prevTanggal: string | null;
  prevShift: string | null;
}

export interface SOFormState {
  tanggalOperasional: string;
  shift: string;
  petugas: string;
  items: SOItemPayload[];
  cabangNama: string;
  cabangKode: string;
}

export default function InputSOPage() {
  const router = useRouter();
  const { selectedCabang, loading: cabangLoading } = useCabang();
  const { user } = useAuth();

  const [items, setItems] = useState<MasterItem[]>([]);
  const [previousSO, setPreviousSO] = useState<Record<string, PreviousSO>>({});
  const [previousSOInfo, setPreviousSOInfo] = useState<{ tanggal: string; shift: string } | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form State
  const [tanggalOperasional, setTanggalOperasional] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [shift, setShift] = useState<string>('Opening');

  // Inputs: { [itemId]: { step1: string, step2: string, keterangan: string } }
  const [counts, setCounts] = useState<Record<string, { step1: string; step2: string; keterangan: string }>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('Semua');

  // Summary modal state
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [pendingPayload, setPendingPayload] = useState<SOFormState | null>(null);

  // Petugas = logged-in user name
  const petugas = user?.nama || 'Tidak diketahui';

  useEffect(() => {
    if (!selectedCabang) return;

    const fetchData = async () => {
      try {
        setLoadingData(true);
        setErrorMsg('');

        const [resItems, resPrevious] = await Promise.all([
          fetch(`/api/master-item?cabang=${selectedCabang.Cabang_ID}`),
          // FIX: kirim cabangId agar GAS bisa resolve spreadsheet yang benar
          fetch(`/api/so/previous?cabang=${selectedCabang.Cabang_ID}`),
        ]);

        const dataItems = await resItems.json();
        const dataPrevious = await resPrevious.json();

        if (dataItems.success && Array.isArray(dataItems.data)) {
          setItems(dataItems.data);
          const initialCounts: Record<string, { step1: string; step2: string; keterangan: string }> = {};
          dataItems.data.forEach((item: MasterItem) => {
            initialCounts[item.Item_ID] = { step1: '', step2: '', keterangan: '' };
          });
          setCounts(initialCounts);
        }

        if (dataPrevious.success && dataPrevious.data) {
          setPreviousSO(dataPrevious.data.items || dataPrevious.data);
          if (dataPrevious.data.latest) {
            setPreviousSOInfo({
              tanggal: dataPrevious.data.latest.tanggal,
              shift: dataPrevious.data.latest.shift,
            });
          }
        }
      } catch (err: any) {
        setErrorMsg('Gagal memuat data: ' + err.message);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [selectedCabang]);

  // Extract unique areas from items
  const areas = useMemo(() => {
    const areaSet = new Set(items.map(i => i.Area || 'Area Umum'));
    return Array.from(areaSet).sort();
  }, [items]);

  // Filter items by area and search
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesArea = selectedArea === 'Semua' || (item.Area || 'Area Umum') === selectedArea;
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        item.Nama_Barang.toLowerCase().includes(query) ||
        item.Item_ID.toLowerCase().includes(query);
      return matchesArea && matchesSearch;
    });
  }, [items, selectedArea, searchQuery]);

  const globalIndexMap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredItems.forEach((item, idx) => { map[item.Item_ID] = idx + 1; });
    return map;
  }, [filteredItems]);

  if (cabangLoading || loadingData) {
    return <QuantumLoaderFull text="Menyiapkan formulir SO" />;
  }

  if (!selectedCabang) {
    return (
      <div className="text-center py-16 card bg-base-100 border border-base-300 rounded-3xl p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-warning mx-auto" />
        <h3 className="text-base font-bold text-base-content">Pilih Cabang Terlebih Dahulu</h3>
        <p className="text-base-content/60 text-sm">Silakan pilih cabang aktif melalui switcher di bagian atas navigasi.</p>
      </div>
    );
  }

  // Group filtered items by Area
  const groupedItems = filteredItems.reduce((acc, item) => {
    const area = item.Area || 'Area Umum';
    if (!acc[area]) acc[area] = [];
    acc[area].push(item);
    return acc;
  }, {} as Record<string, MasterItem[]>);

  const handleCountChange = (itemId: string, field: 'step1' | 'step2' | 'keterangan', value: string) => {
    setCounts((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const getStatusBadge = (total: number, threshold: number) => {
    if (!threshold || threshold <= 0) {
      return (
        <span className="badge badge-ghost text-[11px] font-medium gap-1">
          <HelpCircle className="w-3 h-3" />
          <span>Tidak Dipantau</span>
        </span>
      );
    }
    if (total <= threshold) {
      return (
        <span className="badge badge-error text-[11px] font-bold gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>Kritis</span>
        </span>
      );
    }
    if (total <= threshold * 2) {
      return (
        <span className="badge badge-warning text-[11px] font-bold gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>Hampir Habis</span>
        </span>
      );
    }
    return (
      <span className="badge badge-success text-[11px] font-bold gap-1">
        <CheckCircle2 className="w-3 h-3" />
        <span>Aman</span>
      </span>
    );
  };

  const buildPayloadItems = (): SOItemPayload[] => {
    return items.map((it) => {
      const c = counts[it.Item_ID] || { step1: '0', step2: '0', keterangan: '' };
      const prev = previousSO[it.Nama_Barang];
      return {
        itemId: it.Item_ID,
        namaBarang: it.Nama_Barang,
        satuan: it.Satuan,
        area: it.Area,
        threshold: it.Threshold,
        step1: Number(c.step1) || 0,
        step2: Number(c.step2) || 0,
        keterangan: c.keterangan || '',
        prevStep1: prev?.step1 ?? null,
        prevStep2: prev?.step2 ?? null,
        prevTotal: prev?.total ?? null,
        prevTanggal: prev?.tanggal ?? null,
        prevShift: prev?.shift ?? null,
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payloadItems = buildPayloadItems();
    const formState: SOFormState = {
      tanggalOperasional,
      shift,
      petugas,
      items: payloadItems,
      cabangNama: selectedCabang.Nama_Cabang,
      cabangKode: selectedCabang.Cabang_ID,
    };
    setPendingPayload(formState);
    setShowSummary(true);
  };

  const handleConfirmedSubmit = async (formState: SOFormState) => {
    try {
      setSubmitting(true);
      setShowSummary(false);
      setErrorMsg('');

      const res = await fetch('/api/so', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          tanggalOperasional: formState.tanggalOperasional,
          shift: formState.shift,
          petugas: formState.petugas,
          items: formState.items,
        }),
      });

      const result = await res.json();
      if (result.success && result.data?.laporanId) {
        const laporanId = result.data.laporanId;

        // Generate PDF
        try {
          const pdfRes = await fetch(`/api/so/${laporanId}/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: formState.items,
              cabangNama: formState.cabangNama,
              cabangKode: formState.cabangKode,
              tanggalOperasional: formState.tanggalOperasional,
              shift: formState.shift,
              petugas: formState.petugas,
              previousSOInfo,
            }),
          });

          if (pdfRes.ok) {
            const blob = await pdfRes.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          }
        } catch {
          // PDF generation is non-critical
        }

        // Generate Spreadsheet
        try {
          const xlsRes = await fetch(`/api/so/${laporanId}/spreadsheet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: formState.items,
              cabangNama: formState.cabangNama,
              cabangKode: formState.cabangKode,
              tanggalOperasional: formState.tanggalOperasional,
              shift: formState.shift,
              petugas: formState.petugas,
              previousSOInfo,
            }),
          });

          if (xlsRes.ok) {
            const blob = await xlsRes.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const kode = (formState.cabangKode || 'CBG').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            const tgl = (formState.tanggalOperasional || '').replace(/-/g, '');
            const shiftLabel = (formState.shift || 'SO').toUpperCase();
            a.download = `${kode}-${tgl}-${shiftLabel}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        } catch {
          // Spreadsheet generation is non-critical
        }

        router.push(`/so/konfirmasi/${laporanId}`);
      } else {
        setErrorMsg(result.error?.message || 'Gagal menyimpan data stock opname');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kendala jaringan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activeFilterCount = (selectedArea !== 'Semua' ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
        {/* Session Metadata Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="card bg-base-100 border border-base-300 p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-base-300">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-base-content">
                  Formulir Input Stock Opname
                </h1>
                <p className="text-sm text-base-content/60">
                  Lokasi Cabang: <span className="font-semibold text-base-content">{selectedCabang.Nama_Cabang}</span>
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-base-200 text-base-content/60 border border-base-300">
              <Hash className="w-3.5 h-3.5" />
              <span>{filteredItems.length} / {items.length} Item</span>
            </div>
          </div>

          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg px-4 py-3 text-sm flex items-center gap-2 bg-error/10 border border-error/30 text-error"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Tanggal Operasional */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-base-content/60">
                <Calendar className="w-3.5 h-3.5 text-primary" />
                <span>Tanggal Operasional</span>
              </label>
              <input
                type="date"
                value={tanggalOperasional}
                onChange={(e) => setTanggalOperasional(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-sm font-medium tabular-nums input input-bordered"
              />
            </div>

            {/* Shift */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-base-content/60">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Shift Kerja</span>
              </label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3 py-2.5 text-sm font-medium cursor-pointer select select-bordered"
              >
                <option value="Opening">Opening</option>
                <option value="Closing">Closing</option>
              </select>
            </div>

            {/* Petugas — dari login, read-only */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold flex items-center gap-1.5 text-base-content/60">
                <User className="w-3.5 h-3.5 text-primary" />
                <span>Petugas</span>
              </label>
              <div className="w-full px-3 py-2.5 text-sm font-semibold flex items-center gap-2 min-h-[42px] bg-base-200 border border-base-300 text-base-content">
                <BadgeCheck className="w-4 h-4 flex-shrink-0 text-success" />
                <span>{petugas}</span>
                <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-md badge badge-success">
                  Login
                </span>
              </div>
            </div>
          </div>

          {/* Previous SO Info Banner */}
          {previousSOInfo && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium bg-primary/10 border border-primary/30 text-primary"
            >
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Data SO sebelumnya dimuat: <strong>{previousSOInfo.tanggal}</strong> · Shift <strong>{previousSOInfo.shift}</strong></span>
            </motion.div>
          )}
        </motion.div>

        {/* Filter & Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="card bg-base-100 border border-base-300 p-4 space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
              <input
                type="text"
                placeholder="Cari nama barang atau kode item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-sm min-h-[42px] input input-bordered"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-base-content/50 hover:text-base-content transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Area Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-base-content/50" />
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="pl-9 pr-8 py-2.5 text-sm font-medium cursor-pointer min-h-[42px] select select-bordered"
              >
                <option value="Semua">Semua Area</option>
                {areas.map(area => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 flex-wrap"
              >
                <span className="text-[11px] font-semibold text-base-content/60">Filter aktif:</span>
                {selectedArea !== 'Semua' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md badge badge-primary">
                    <Layers className="w-3 h-3" />
                    {selectedArea}
                    <button type="button" onClick={() => setSelectedArea('Semua')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md badge badge-primary">
                    <Search className="w-3 h-3" />
                    &quot;{searchQuery}&quot;
                    <button type="button" onClick={() => setSearchQuery('')}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedArea('Semua'); setSearchQuery(''); }}
                  className="text-[11px] font-medium underline text-base-content/50"
                >
                  Hapus semua
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Items Section by Area */}
        {Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-12 card bg-base-100 border border-base-300 p-6 text-base-content/60">
            <p className="text-sm">
              {items.length === 0
                ? 'Belum ada item terdaftar pada master barang cabang ini.'
                : 'Tidak ada item yang cocok dengan filter atau pencarian.'
              }
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {Object.entries(groupedItems).map(([area, areaItems]) => (
              <motion.div key={area} variants={staggerItem} className="card bg-base-100 border border-base-300 overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between bg-base-200 border-b border-base-300">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider text-base-content">
                      {area}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold tabular-nums text-base-content/60">
                    {areaItems.length} Item
                  </span>
                </div>

                <div className="border-t border-base-300">
                  {areaItems.map((item) => {
                    const step1Val = counts[item.Item_ID]?.step1 || '';
                    const step2Val = counts[item.Item_ID]?.step2 || '';
                    const keteranganVal = counts[item.Item_ID]?.keterangan || '';
                    const total = (Number(step1Val) || 0) + (Number(step2Val) || 0);
                    const prev = previousSO[item.Nama_Barang];

                    return (
                      <div
                        key={item.Item_ID}
                        className="p-4 sm:px-6 transition-colors border-b border-base-300 hover:bg-base-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-bold tabular-nums px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                                {globalIndexMap[item.Item_ID]}
                              </span>
                              <span className="font-extrabold text-sm text-base-content">
                                {item.Nama_Barang}
                              </span>
                              <span className="text-xs font-mono text-base-content/50">
                                ({item.Satuan})
                              </span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="text-[11px] tabular-nums text-base-content/60">
                                Batas Min: <span className="font-bold text-base-content">{item.Threshold}</span>
                              </span>
                              {getStatusBadge(total, item.Threshold)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                            {prev ? (
                              <div className="flex-1 sm:w-32 sm:flex-none text-center">
                                <span className="block text-[10px] mb-1 font-semibold uppercase tracking-wide text-base-content/60">
                                  SO Sebelumnya
                                </span>
                                <div className="flex items-center gap-1 justify-center">
                                  <div
                                    className="w-full py-2 sm:py-1.5 text-center text-sm font-bold tabular-nums min-h-[44px] sm:min-h-0 flex flex-col items-center justify-center bg-base-200 border border-base-300 text-base-content/60 rounded-lg opacity-80"
                                  >
                                    <span className="text-[9px] uppercase text-base-content/50">S1</span>
                                    <span className="text-sm font-bold tabular-nums leading-tight">{prev.step1}</span>
                                  </div>
                                  <span className="text-sm font-bold text-base-content/60">+</span>
                                  <div
                                    className="w-full py-2 sm:py-1.5 text-center text-sm font-bold tabular-nums min-h-[44px] sm:min-h-0 flex flex-col items-center justify-center bg-base-200 border border-base-300 text-base-content/60 rounded-lg opacity-80"
                                  >
                                    <span className="text-[9px] uppercase text-base-content/50">S2</span>
                                    <span className="text-sm font-bold tabular-nums leading-tight">{prev.step2}</span>
                                  </div>
                                  <span className="text-sm font-bold text-base-content/60">=</span>
                                  <div
                                    className="w-full py-2 sm:py-1.5 text-center text-sm font-bold tabular-nums min-h-[44px] sm:min-h-0 flex items-center justify-center bg-base-200 border border-base-300 text-base-content rounded-lg opacity-80"
                                  >
                                    <span className="text-sm font-extrabold tabular-nums">{prev.total}</span>
                                  </div>
                                </div>
                                <span className="text-[9px] text-base-content/50">
                                  {prev.tanggal} ({prev.shift})
                                </span>
                              </div>
                            ) : (
                              <div className="flex-1 sm:w-32 sm:flex-none text-center">
                                <span className="block text-[10px] mb-1 font-semibold uppercase tracking-wide text-base-content/60">
                                  SO Sebelumnya
                                </span>
                                <div
                                  className="w-full py-2 sm:py-1.5 text-center text-sm font-bold tabular-nums min-h-[44px] sm:min-h-0 flex items-center justify-center bg-base-200 border border-base-300 text-base-content/30 rounded-lg opacity-80"
                                >
                                  <span className="text-xs">Belum ada data</span>
                                </div>
                              </div>
                            )}

                            <span
                              className="font-bold self-end mb-2.5 text-lg text-base-content/60"
                            >
                              →
                            </span>
                            <div className="flex-1 sm:w-24 sm:flex-none">
                              <span
                                className="block text-[10px] mb-1 text-center font-semibold uppercase tracking-wide text-base-content/60"
                              >
                                Step 1
                              </span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="0"
                                value={step1Val}
                                onChange={(e) => handleCountChange(item.Item_ID, 'step1', e.target.value)}
                                className="w-full py-2 sm:py-1.5 text-center text-sm font-bold tabular-nums min-h-[44px] sm:min-h-0 input input-bordered"
                              />
                            </div>

                            <span
                              className="font-bold self-end mb-2.5 text-lg text-base-content/60"
                            >
                              +
                            </span>

                            <div className="flex-1 sm:w-24 sm:flex-none">
                              <span
                                className="block text-[10px] mb-1 text-center font-semibold uppercase tracking-wide text-base-content/60"
                              >
                                Step 2
                              </span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="0"
                                value={step2Val}
                                onChange={(e) => handleCountChange(item.Item_ID, 'step2', e.target.value)}
                                className="w-full py-2 sm:py-1.5 text-center text-sm font-bold tabular-nums min-h-[44px] sm:min-h-0 input input-bordered"
                              />
                            </div>

                            <span className="font-bold self-end mb-2.5 text-lg text-base-content/60">
                              =
                            </span>

                            <div className="w-14 sm:w-20 text-center self-end mb-1">
                              <span className="text-lg sm:text-base font-extrabold tabular-nums text-primary">
                                {total}
                              </span>
                                <span className="block text-[10px] mb-1 font-semibold uppercase tracking-wide text-base-content/60">
                                Total
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Keterangan (Optional Notes) */}
                        <div className="mt-2 sm:mt-3 sm:ml-auto sm:w-[calc(100%-320px)]">
                          <div className="relative">
                            <StickyNote
                              className="absolute left-2.5 top-2 w-3.5 h-3.5 text-base-content/50"
                            />
                            <input
                              type="text"
                              placeholder="Keterangan (opsional)..."
                              value={keteranganVal}
                              onChange={(e) => handleCountChange(item.Item_ID, 'keterangan', e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs input input-bordered"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Floating Action Bar */}
        <div className="sticky bottom-4 z-40 card bg-base-100 border border-base-300 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-base-content/60">
              Selesaikan sesi pencatatan
            </span>
            <p className="text-sm font-semibold text-base-content">
              Laporan PDF & Excel akan otomatis diunduh
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary px-6 py-3 flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px]"
          >
            {submitting ? (
              <>
                <QuantumLoaderMini />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Simpan & Buat Laporan</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Summary Modal rendered separately */}
      <AnimatePresence>
        {showSummary && pendingPayload && (
          <SOSummaryModalInline
            formState={pendingPayload}
            onConfirm={() => handleConfirmedSubmit(pendingPayload)}
            onCancel={() => setShowSummary(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Inline Summary Modal (lives here to share SOFormState types)
// ─────────────────────────────────────────────────────────────

function SOSummaryModalInline({
  formState,
  onConfirm,
  onCancel,
}: {
  formState: SOFormState;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const kritis = formState.items.filter(i => i.threshold > 0 && (i.step1 + i.step2) <= i.threshold);
  const hampirHabis = formState.items.filter(i => i.threshold > 0 && (i.step1 + i.step2) > i.threshold && (i.step1 + i.step2) <= i.threshold * 2);
  const aman = formState.items.filter(i => i.threshold > 0 && (i.step1 + i.step2) > i.threshold * 2);
  const tidakDipantau = formState.items.filter(i => !i.threshold || i.threshold <= 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="bg-base-100 rounded-xl border border-base-300 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-base-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-base-content text-base">Ringkasan Stock Opname</h2>
              <p className="text-xs text-base-content/60">Periksa sebelum mengirimkan data</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 text-base-content/40 hover:text-base-content hover:bg-base-200 rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Session Info */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-0.5">
              <span className="text-[11px] text-base-content/60 font-semibold uppercase tracking-wide">Cabang</span>
              <p className="font-semibold text-base-content">{formState.cabangNama}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-base-content/60 font-semibold uppercase tracking-wide">Petugas</span>
              <p className="font-semibold text-base-content">{formState.petugas}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-base-content/60 font-semibold uppercase tracking-wide">Tanggal</span>
              <p className="font-semibold text-base-content tabular-nums">{formState.tanggalOperasional}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] text-base-content/60 font-semibold uppercase tracking-wide">Shift</span>
              <p className="font-semibold text-base-content">{formState.shift}</p>
            </div>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-3 rounded-lg bg-error/10 border border-error/30">
              <span className="block text-2xl font-extrabold text-error tabular-nums">{kritis.length}</span>
              <span className="text-[10px] font-bold text-error uppercase">Kritis</span>
            </div>
            <div className="text-center p-3 rounded-lg bg-warning/10 border border-warning/30">
              <span className="block text-2xl font-extrabold text-warning tabular-nums">{hampirHabis.length}</span>
              <span className="text-[10px] font-bold text-warning uppercase tracking-wide">H. Habis</span>
            </div>
            <div className="text-center p-3 rounded-lg bg-success/10 border border-success/30">
              <span className="block text-2xl font-extrabold text-success tabular-nums">{aman.length}</span>
              <span className="text-[10px] font-bold text-success uppercase">Aman</span>
            </div>
            <div className="text-center p-3 rounded-lg bg-base-200 border border-base-300">
              <span className="block text-2xl font-extrabold text-base-content/60 tabular-nums">{tidakDipantau.length}</span>
              <span className="text-[10px] font-bold text-base-content/60 uppercase">N/A</span>
            </div>
          </div>

          {/* Critical Items List */}
          {kritis.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-error uppercase tracking-wide flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Item Kritis ({kritis.length})
              </span>
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {kritis.map(item => (
                  <div key={item.itemId} className="flex items-center justify-between px-3 py-1.5 bg-error/10 rounded text-xs border border-error/30">
                    <span className="font-medium text-base-content">{item.namaBarang}</span>
                    <span className="font-bold text-error tabular-nums">
                      {item.step1 + item.step2} / {item.threshold}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items with keterangan */}
          {formState.items.some(i => i.keterangan) && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-base-content/60 uppercase tracking-wide flex items-center gap-1.5">
                <StickyNote className="w-3.5 h-3.5" />
                Keterangan Diisi
              </span>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {formState.items.filter(i => i.keterangan).map(item => (
                  <div key={item.itemId} className="flex items-start justify-between px-3 py-1.5 bg-base-200 rounded text-xs border border-base-300 gap-2">
                    <span className="font-medium text-base-content flex-shrink-0">{item.namaBarang}:</span>
                    <span className="text-base-content/60 text-right">{item.keterangan}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onCancel}
            className="flex-1 btn px-4 py-2.5 text-sm font-medium min-h-[42px]"
          >
            Kembali & Edit
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 btn btn-primary px-4 py-2.5 text-sm font-semibold min-h-[42px] flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Konfirmasi & Submit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
