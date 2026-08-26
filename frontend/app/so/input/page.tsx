'use client';

import React, { useState, useEffect } from 'react';
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
  Hash
} from 'lucide-react';

interface MasterItem {
  Item_ID: string;
  Nama_Barang: string;
  Area: string;
  Satuan: string;
  Threshold: number;
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
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form State
  const [tanggalOperasional, setTanggalOperasional] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [shift, setShift] = useState<string>('Opening');
  const [petugas, setPetugas] = useState<string>('');
  
  // Inputs: { [itemId]: { step1: string, step2: string } }
  const [counts, setCounts] = useState<Record<string, { step1: string; step2: string }>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!selectedCabang) return;

    const fetchData = async () => {
      try {
        setLoadingData(true);
        setErrorMsg('');
        const [resItems, resPetugas] = await Promise.all([
          fetch(`/api/master-item?cabang=${selectedCabang.Cabang_ID}`),
          fetch(`/api/petugas?cabang=${selectedCabang.Cabang_ID}`),
        ]);

        const dataItems = await resItems.json();
        const dataPetugas = await resPetugas.json();

        if (dataItems.success && Array.isArray(dataItems.data)) {
          setItems(dataItems.data);
          const initialCounts: Record<string, { step1: string; step2: string }> = {};
          dataItems.data.forEach((item: MasterItem) => {
            initialCounts[item.Item_ID] = { step1: '', step2: '' };
          });
          setCounts(initialCounts);
        }

        if (dataPetugas.success && Array.isArray(dataPetugas.data)) {
          setPetugasList(dataPetugas.data);
          if (dataPetugas.data.length > 0) {
            setPetugas(dataPetugas.data[0].Nama);
          }
        }
      } catch (err: any) {
        setErrorMsg('Gagal memuat data master item atau petugas: ' + err.message);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [selectedCabang]);

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

  // Group items by Area
  const groupedItems = items.reduce((acc, item) => {
    const area = item.Area || 'Area Umum';
    if (!acc[area]) acc[area] = [];
    acc[area].push(item);
    return acc;
  }, {} as Record<string, MasterItem[]>);

  const handleCountChange = (itemId: string, field: 'step1' | 'step2', value: string) => {
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
        const c = counts[it.Item_ID] || { step1: '0', step2: '0' };
        return {
          itemId: it.Item_ID,
          step1: Number(c.step1) || 0,
          step2: Number(c.step2) || 0,
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
        router.push(`/so/konfirmasi/${result.data.laporanId}`);
      } else {
        setErrorMsg(result.error?.message || 'Gagal menyimpan data stock opname');
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kendala jaringan: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
            <span>{items.length} Item Terdaftar</span>
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

      {/* Items Section by Area */}
      {Object.keys(groupedItems).length === 0 ? (
        <div className="text-center py-12 surface-card p-6">
          <p className="text-[#44546F] text-sm">Belum ada item terdaftar pada master barang cabang ini.</p>
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
                const total = (Number(step1Val) || 0) + (Number(step2Val) || 0);

                return (
                  <div key={item.Item_ID} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F7F8F9] transition-colors">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#172B4D] text-sm">{item.Nama_Barang}</span>
                        <span className="text-xs text-[#44546F] font-mono">({item.Satuan})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#44546F] tabular-nums">
                          Batas Minimum: <span className="font-bold text-[#172B4D]">{item.Threshold}</span>
                        </span>
                        {getStatusBadge(total, item.Threshold)}
                      </div>
                    </div>

                    {/* Step 1 & Step 2 Input Cells */}
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="w-24">
                        <span className="block text-[10px] text-[#44546F] mb-1 text-center font-semibold uppercase tracking-wide">Step 1 (Utuh)</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={step1Val}
                          onChange={(e) => handleCountChange(item.Item_ID, 'step1', e.target.value)}
                          className="w-full py-1.5 text-center text-sm font-bold tabular-nums"
                        />
                      </div>

                      <span className="text-[#44546F] font-bold self-end mb-2.5">+</span>

                      <div className="w-24">
                        <span className="block text-[10px] text-[#44546F] mb-1 text-center font-semibold uppercase tracking-wide">Step 2 (Buka)</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="0"
                          value={step2Val}
                          onChange={(e) => handleCountChange(item.Item_ID, 'step2', e.target.value)}
                          className="w-full py-1.5 text-center text-sm font-bold tabular-nums"
                        />
                      </div>

                      <span className="text-[#44546F] font-bold self-end mb-2.5">=</span>

                      <div className="w-20 text-center self-end mb-1">
                        <span className="block text-base font-extrabold text-[#1868DB] tabular-nums">{total}</span>
                        <span className="text-[9px] uppercase tracking-wider text-[#44546F] font-bold">Total</span>
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
      <div className="sticky bottom-4 z-40 surface-card p-4 shadow-sm border border-[#DCDFE4] flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <span className="text-xs text-[#44546F] font-medium">Selesaikan sesi pencatatan</span>
          <p className="text-sm font-semibold text-[#172B4D]">Laporan PDF akan otomatis disimpan ke Google Drive</p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary px-6 py-3 flex items-center gap-2 shadow-sm"
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
