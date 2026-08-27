'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCabang } from '@/lib/CabangContext';
import { 
  ClipboardCheck, 
  Send, 
  Calendar, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  HelpCircle,
  Loader2,
  Layers,
  ArrowRight,
  ShieldAlert,
  Hash,
  Search,
  Filter,
  StickyNote,
  X
} from 'lucide-react';

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

interface Petugas {
  Petugas_ID: string;
  Nama: string;
}

export default function InputSOPage() {
  const router = useRouter();
  const { selectedCabang, loading: cabangLoading } = useCabang();

  const [items, setItems] = useState<MasterItem[]>([]);
  const [petugasList, setPetugasList] = useState<Petugas[]>([]);
  const [previousSO, setPreviousSO] = useState<Record<string, PreviousSO>>({});
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form State
  const [tanggalOperasional, setTanggalOperasional] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [shift, setShift] = useState<string>('Opening');
  const [petugas, setPetugas] = useState<string>('');
  
  // Inputs: { [itemId]: { step1: string, step2: string, keterangan: string } }
  const [counts, setCounts] = useState<Record<string, { step1: string; step2: string; keterangan: string }>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('Semua');

  useEffect(() => {
    if (!selectedCabang) return;

    const fetchData = async () => {
      try {
        setLoadingData(true);
        setErrorMsg('');
        const [resItems, resPetugas, resPrevious] = await Promise.all([
          fetch(`/api/master-item?cabang=${selectedCabang.Cabang_ID}`),
          fetch(`/api/petugas?cabang=${selectedCabang.Cabang_ID}`),
          fetch('/api/so/previous'),
        ]);

        const dataItems = await resItems.json();
        const dataPetugas = await resPetugas.json();
        const dataPrevious = await resPrevious.json();

        if (dataItems.success && Array.isArray(dataItems.data)) {
          setItems(dataItems.data);
          const initialCounts: Record<string, { step1: string; step2: string; keterangan: string }> = {};
          dataItems.data.forEach((item: MasterItem) => {
            initialCounts[item.Item_ID] = { step1: '', step2: '', keterangan: '' };
          });
          setCounts(initialCounts);
        }

        if (dataPetugas.success && Array.isArray(dataPetugas.data)) {
          setPetugasList(dataPetugas.data);
          if (dataPetugas.data.length > 0) {
            setPetugas(dataPetugas.data[0].Nama);
          }
        }

        if (dataPrevious.success && dataPrevious.data) {
          setPreviousSO(dataPrevious.data);
        }
      } catch (err: any) {
        setErrorMsg('Gagal memuat data master item atau petugas: ' + err.message);
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

  if (cabangLoading || loadingData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-[#1868DB] animate-spin" />
        <p className="text-[#44546F] text-sm tracking-wide">Menyiapkan formulir Stock Opname...</p>
      </div>
    );
  }

  if (!selectedCabang) {
    return (
      <div className="text-center py-16 surface-card rounded-3xl p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-[#B38600] mx-auto" />
        <h3 className="text-base font-bold text-[#172B4D]">Pilih Cabang Terlebih Dahulu</h3>
        <p className="text-[#44546F] text-sm">Silakan pilih cabang aktif melalui switcher di bagian atas navigasi.</p>
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
        <span className="text-[11px] font-medium text-[#44546F] bg-[#F1F2F4] px-2 py-0.5 rounded border border-[#DCDFE4] inline-flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-[#44546F]" />
          <span>Tidak Dipantau</span>
        </span>
      );
    }
    if (total <= threshold) {
      return (
        <span className="text-[11px] font-bold text-[#CA3521] bg-[#FFEBE6] border border-[#FFBDAD] px-2 py-0.5 rounded inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-[#CA3521]" />
          <span>Kritis</span>
        </span>
      );
    }
    if (total <= threshold * 2) {
      return (
        <span className="text-[11px] font-bold text-[#B38600] bg-[#FFFAE6] border border-[#F8E6A0] px-2 py-0.5 rounded inline-flex items-center gap-1">
          <AlertCircle className="w-3 h-3 text-[#B38600]" />
          <span>Hampir Habis</span>
        </span>
      );
    }
    return (
      <span className="text-[11px] font-bold text-[#216E4E] bg-[#E3FCEF] border border-[#BAF3DB] px-2 py-0.5 rounded inline-flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3 text-[#216E4E]" />
        <span>Aman</span>
      </span>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!petugas) {
      alert('Pilih nama petugas yang melakukan pencatatan');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const payloadItems = items.map((it) => {
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
        };
      });

      const res = await fetch('/api/so', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          tanggalOperasional,
          shift,
          petugas,
          items: payloadItems,
        }),
      });

      const result = await res.json();
      if (result.success && result.data?.laporanId) {
        const laporanId = result.data.laporanId;

        // Generate PDF with comparison data
        try {
          const pdfRes = await fetch(`/api/so/${laporanId}/pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: payloadItems,
              cabangNama: selectedCabang.Nama_Cabang,
              tanggalOperasional,
              shift,
              petugas,
              previousSO: {
                date: '2026-08-23',
                shift: 'Closing',
              },
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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Session Metadata Card */}
      <div className="surface-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#DCDFE4]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#E9F2FF] text-[#1868DB]">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#172B4D] tracking-tight">Formulir Input Stock Opname</h1>
              <p className="text-sm text-[#44546F]">
                Lokasi Cabang: <span className="font-semibold text-[#172B4D]">{selectedCabang.Nama_Cabang}</span>
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F1F2F4] rounded border border-[#DCDFE4] text-xs text-[#44546F] font-semibold">
            <Hash className="w-3.5 h-3.5" />
            <span>{filteredItems.length} / {items.length} Item</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-[#FFEBE6] border border-[#FFBDAD] rounded text-[#CA3521] text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tanggal Operasional */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#44546F] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#1868DB]" />
              <span>Tanggal Operasional</span>
            </label>
            <input
              type="date"
              value={tanggalOperasional}
              onChange={(e) => setTanggalOperasional(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm font-medium tabular-nums"
            />
          </div>

          {/* Shift */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#44546F] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1868DB]" />
              <span>Shift Kerja</span>
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full px-3 py-2 text-sm font-medium cursor-pointer"
            >
              <option value="Opening">Opening</option>
              <option value="Closing">Closing</option>
            </select>
          </div>

          {/* Petugas */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-[#44546F] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#1868DB]" />
              <span>Petugas Penanggung Jawab</span>
            </label>
            {petugasList.length === 0 ? (
              <input
                type="text"
                value={petugas}
                onChange={(e) => setPetugas(e.target.value)}
                placeholder="Ketik nama petugas..."
                required
                className="w-full px-3 py-2 text-sm font-medium"
              />
            ) : (
              <select
                value={petugas}
                onChange={(e) => setPetugas(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm font-medium cursor-pointer"
              >
                {petugasList.map((p) => (
                  <option key={p.Petugas_ID} value={p.Nama}>
                    {p.Nama}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="surface-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C]" />
            <input
              type="text"
              placeholder="Cari nama barang atau kode item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-[#DCDFE4] rounded-[4px] focus:border-[#1868DB] focus:ring-1 focus:ring-[#1868DB] outline-none transition-colors bg-[#FAFBFC] min-h-[40px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#6B778C] hover:text-[#172B4D] transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Area Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B778C] pointer-events-none" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="pl-9 pr-8 py-2 text-sm font-medium border border-[#DCDFE4] rounded-[4px] focus:border-[#1868DB] focus:ring-1 focus:ring-[#1868DB] outline-none transition-colors bg-[#FAFBFC] cursor-pointer appearance-none min-h-[40px]"
            >
              <option value="Semua">Semua Area</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-[#44546F] font-semibold">Filter aktif:</span>
            {selectedArea !== 'Semua' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E9F2FF] text-[#1868DB] text-[11px] font-semibold rounded-full border border-[#B3D4FF]">
                <Layers className="w-3 h-3" />
                {selectedArea}
                <button type="button" onClick={() => setSelectedArea('Semua')} className="hover:text-[#1557B0]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#E9F2FF] text-[#1868DB] text-[11px] font-semibold rounded-full border border-[#B3D4FF]">
                <Search className="w-3 h-3" />
                &quot;{searchQuery}&quot;
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-[#1557B0]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={() => { setSelectedArea('Semua'); setSearchQuery(''); }}
              className="text-[11px] text-[#6B778C] hover:text-[#CA3521] font-medium underline"
            >
              Hapus semua
            </button>
          </div>
        )}
      </div>

      {/* Items Section by Area */}
      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center py-12 surface-card p-6">
          <p className="text-[#44546F] text-sm">
            {items.length === 0 
              ? 'Belum ada item terdaftar pada master barang cabang ini.'
              : 'Tidak ada item yang cocok dengan filter atau pencarian.'
            }
          </p>
        </div>
      ) : (
        Object.entries(groupedItems).map(([area, areaItems]) => (
          <div key={area} className="surface-card overflow-hidden">
            <div className="bg-[#F7F8F9] px-5 py-3 border-b border-[#DCDFE4] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1868DB]" />
                <h3 className="font-semibold text-sm text-[#172B4D] uppercase tracking-wider">{area}</h3>
              </div>
              <span className="text-xs font-semibold text-[#44546F] tabular-nums">{areaItems.length} Item</span>
            </div>

            <div className="divide-y divide-[#DCDFE4]">
              {areaItems.map((item) => {
                const step1Val = counts[item.Item_ID]?.step1 || '';
                const step2Val = counts[item.Item_ID]?.step2 || '';
                const keteranganVal = counts[item.Item_ID]?.keterangan || '';
                const total = (Number(step1Val) || 0) + (Number(step2Val) || 0);
                const prev = previousSO[item.Nama_Barang];

                return (
                  <div key={item.Item_ID} className="p-4 sm:px-6 hover:bg-[#F7F8F9] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#172B4D] text-sm">{item.Nama_Barang}</span>
                          <span className="text-xs text-[#44546F] font-mono">({item.Satuan})</span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-[11px] text-[#44546F] tabular-nums">
                            Batas Minimum: <span className="font-bold text-[#172B4D]">{item.Threshold}</span>
                          </span>
                          {getStatusBadge(total, item.Threshold)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                        {prev ? (
                          <div className="flex-1 sm:w-32 sm:flex-none text-center">
                            <span className="block text-[10px] text-[#44546F] mb-1 font-semibold uppercase tracking-wide">SO Sebelumnya</span>
                            <div className="flex items-center gap-1 justify-center">
                              <div className="px-1.5 py-1 sm:py-0.5 bg-[#F1F2F4] border border-[#DCDFE4] rounded text-center min-h-[28px] flex flex-col items-center justify-center">
                                <span className="text-[9px] text-[#6B778C] uppercase">S1</span>
                                <span className="text-xs font-bold text-[#44546F] tabular-nums leading-tight">{prev.step1}</span>
                              </div>
                              <span className="text-[#B3BAC5] text-xs">+</span>
                              <div className="px-1.5 py-1 sm:py-0.5 bg-[#F1F2F4] border border-[#DCDFE4] rounded text-center min-h-[28px] flex flex-col items-center justify-center">
                                <span className="text-[9px] text-[#6B778C] uppercase">S2</span>
                                <span className="text-xs font-bold text-[#44546F] tabular-nums leading-tight">{prev.step2}</span>
                              </div>
                              <span className="text-[#B3BAC5] text-xs">=</span>
                              <div className="px-1.5 py-1 sm:py-0.5 bg-[#DCDFE4] border border-[#C1C7D0] rounded text-center min-h-[28px] flex items-center justify-center">
                                <span className="text-xs font-extrabold text-[#172B4D] tabular-nums">{prev.total}</span>
                              </div>
                            </div>
                            <span className="text-[9px] text-[#6B778C]">{prev.tanggal} ({prev.shift})</span>
                          </div>
                        ) : (
                          <div className="flex-1 sm:w-32 sm:flex-none text-center">
                            <span className="block text-[10px] text-[#44546F] mb-1 font-semibold uppercase tracking-wide">SO Sebelumnya</span>
                            <div className="px-2 py-1.5 sm:py-1 bg-[#F7F8F9] border border-[#DCDFE4] rounded text-center min-h-[32px] flex items-center justify-center">
                              <span className="text-xs text-[#B3BAC5]">Belum ada data</span>
                            </div>
                          </div>
                        )}

                        <span className="text-[#44546F] font-bold self-end mb-2.5 text-lg">→</span>
                        <div className="flex-1 sm:w-24 sm:flex-none">
                          <span className="block text-[10px] text-[#44546F] mb-1 text-center font-semibold uppercase tracking-wide">Step 1</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0"
                            value={step1Val}
                            onChange={(e) => handleCountChange(item.Item_ID, 'step1', e.target.value)}
                            className="w-full py-2 sm:py-1.5 text-center text-sm font-bold tabular-nums min-h-[44px] sm:min-h-0"
                          />
                        </div>

                        <span className="text-[#44546F] font-bold self-end mb-2.5 text-lg">+</span>

                        <div className="flex-1 sm:w-24 sm:flex-none">
                          <span className="block text-[10px] text-[#44546F] mb-1 text-center font-semibold uppercase tracking-wide">Step 2</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            placeholder="0"
                            value={step2Val}
                            onChange={(e) => handleCountChange(item.Item_ID, 'step2', e.target.value)}
                            className="w-full py-2 sm:py-1.5 text-center text-sm font-bold tabular-nums min-h-[44px] sm:min-h-0"
                          />
                        </div>

                        <span className="text-[#44546F] font-bold self-end mb-2.5 text-lg">=</span>

                        <div className="w-14 sm:w-20 text-center self-end mb-1">
                          <span className="text-lg sm:text-base font-extrabold text-[#1868DB] tabular-nums">{total}</span>
                          <span className="text-[9px] uppercase tracking-wider text-[#44546F] font-bold">Total</span>
                        </div>
                      </div>
                    </div>

                    {/* Keterangan (Optional Notes) */}
                    <div className="mt-2 sm:mt-3 sm:ml-auto sm:w-[calc(100%-320px)]">
                      <div className="relative">
                        <StickyNote className="absolute left-2.5 top-2 w-3.5 h-3.5 text-[#6B778C]" />
                        <input
                          type="text"
                          placeholder="Keterangan (opsional)..."
                          value={keteranganVal}
                          onChange={(e) => handleCountChange(item.Item_ID, 'keterangan', e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#DCDFE4] rounded-[4px] focus:border-[#1868DB] focus:ring-1 focus:ring-[#1868DB] outline-none transition-colors bg-[#FAFBFC]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Floating Action Bar */}
      <div className="sticky bottom-4 z-40 surface-card p-3 sm:p-4 shadow-sm border border-[#DCDFE4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs text-[#44546F] font-medium">Selesaikan sesi pencatatan</span>
          <p className="text-sm font-semibold text-[#172B4D]">Laporan PDF akan otomatis disimpan ke Google Drive</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary px-6 py-3 flex items-center justify-center gap-2 shadow-sm w-full sm:w-auto min-h-[44px]"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
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
  );
}
