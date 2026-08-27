'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCabang } from '@/lib/CabangContext';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Loader2, 
  ShieldAlert, 
  Activity,
  Layers
} from 'lucide-react';

export default function DashboardMingguanPage() {
  const { selectedCabang } = useCabang();

  const [dari, setDari] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [sampai, setSampai] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboard = async () => {
    if (!selectedCabang) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/mingguan?cabang=${selectedCabang.Cabang_ID}&dari=${dari}&sampai=${sampai}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Error fetching weekly dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedCabang, dari, sampai]);

  if (!selectedCabang) {
    return (
      <div className="text-center py-16 surface-card rounded-3xl p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-[#B38600] mx-auto" />
        <h3 className="text-base font-bold text-[#172B4D]">Pilih Cabang Terlebih Dahulu</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#172B4D] flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-[#1868DB]" />
            <span>Dashboard Tren Mingguan</span>
          </h1>
          <p className="text-[#44546F] text-sm mt-1">
            Cabang Operasional: <span className="text-[#172B4D] font-semibold">{selectedCabang.Nama_Cabang}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#F1F2F4] rounded p-1 text-sm font-medium">
            <Link href="/dashboard/harian" className="text-[#44546F] hover:text-[#172B4D] px-3 py-1 rounded transition-colors">
              Harian
            </Link>
            <span className="bg-white text-[#172B4D] px-3 py-1 rounded shadow-sm">Mingguan</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-[#44546F]">
            <input
              type="date"
              value={dari}
              onChange={(e) => setDari(e.target.value)}
              className="bg-white border border-[#DCDFE4] rounded px-3 py-1.5 text-sm text-[#172B4D] focus:outline-none focus:border-[#1868DB] tabular-nums"
            />
            <span className="text-[#44546F]">sampai</span>
            <input
              type="date"
              value={sampai}
              onChange={(e) => setSampai(e.target.value)}
              className="bg-white border border-[#DCDFE4] rounded px-3 py-1.5 text-sm text-[#172B4D] focus:outline-none focus:border-[#1868DB] tabular-nums"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center">
          <Loader2 className="w-8 h-8 text-[#1868DB] animate-spin mx-auto mb-2" />
          <p className="text-[#44546F] text-sm">Memuat tren transaksi mingguan...</p>
        </div>
      ) : !data ? (
        <div className="p-12 text-center surface-card">
          <p className="text-[#44546F] text-sm">Gagal memuat data tren.</p>
        </div>
      ) : (
        <>
          {/* Summary Card */}
          <div className="surface-card p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm text-[#44546F] font-semibold">Total Item Terhitung pada Periode Ini</span>
              <h2 className="text-3xl font-bold text-[#172B4D] tabular-nums">{data.totalTransaksi || 0} Transaksi</h2>
              <p className="text-sm text-[#44546F] tabular-nums">Periode: {data.dari} hingga {data.sampai}</p>
            </div>
            <div className="p-4 bg-[#E9F2FF] text-[#1868DB] rounded">
              <Activity className="w-8 h-8" />
            </div>
          </div>

          {/* Daily Distribution */}
          <div className="surface-card p-6 space-y-4">
            <h3 className="font-semibold text-sm text-[#172B4D] uppercase tracking-wider">Distribusi Aktivitas Harian</h3>

            {(!data.trenPerHari || Object.keys(data.trenPerHari).length === 0) ? (
              <p className="text-[#44546F] text-sm text-center py-8">Tidak ada aktivitas pada rentang tanggal ini.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {Object.entries(data.trenPerHari).map(([tgl, count]: any) => (
                  <div key={tgl} className="p-4 bg-[#F7F8F9] border border-[#DCDFE4] rounded text-center space-y-1">
                    <span className="text-xs text-[#44546F] block tabular-nums">{tgl}</span>
                    <span className="text-2xl font-bold text-[#1868DB] tabular-nums block">{count}</span>
                    <span className="text-[10px] text-[#44546F] block uppercase font-bold">Item</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
