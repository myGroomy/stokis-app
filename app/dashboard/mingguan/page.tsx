'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useCabang } from '@/lib/CabangContext';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Loader2, 
  ShieldAlert, 
  Activity,
  Layers,
  BarChart2,
  LineChart,
  AreaChart
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart as RechartsLineChart, 
  Line, 
  AreaChart as RechartsAreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

type ChartType = 'bar' | 'line' | 'area';

interface DailyStats {
  date: string;
  count: number;
  kritis: number;
  hampirHabis: number;
  aman: number;
}

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
  const [chartType, setChartType] = useState<ChartType>('bar');

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

  const trendData: DailyStats[] = useMemo(() => {
    if (!data?.trenPerHari) return [];
    return Object.entries(data.trenPerHari).map(([date, stats]: any) => ({
      date: date,
      count: stats.total || 0,
      kritis: stats.kritis || 0,
      hampirHabis: stats.hampirHabis || 0,
      aman: stats.aman || 0,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <Loader2 className="w-8 h-8 text-[#1868DB] animate-spin" />
        <p className="text-[#44546F] text-sm tracking-wide">Memuat tren transaksi mingguan...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center surface-card">
        <p className="text-[#44546F] text-sm">Gagal memuat data tren.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header & Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
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

          {/* Chart Type Toggle */}
          <div className="flex bg-[#F1F2F4] rounded p-1">
            {(['bar', 'line', 'area'] as ChartType[]).map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`p-1.5 rounded transition-colors ${
                  chartType === type 
                    ? 'bg-white text-[#1868DB] shadow-sm' 
                    : 'text-[#44546F] hover:text-[#172B4D]'
                }`}
                title={`${type.charAt(0).toUpperCase() + type.slice(1)} Chart`}
              >
                {type === 'bar' && <BarChart2 className="w-4 h-4" />}
                {type === 'line' && <LineChart2 className="w-4 h-4" />}
                {type === 'area' && <AreaChart2 className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="surface-card p-6 flex items-center justify-between"
      >
        <div className="space-y-1">
          <span className="text-sm text-[#44546F] font-semibold">Total Item Terhitung pada Periode Ini</span>
          <h2 className="text-3xl font-bold text-[#172B4D] tabular-nums">{data.totalTransaksi || 0} Transaksi</h2>
          <p className="text-sm text-[#44546F] tabular-nums">Periode: {data.dari} hingga {data.sampai}</p>
        </div>
        <div className="p-4 bg-[#E9F2FF] text-[#1868DB] rounded">
          <Activity className="w-8 h-8" />
        </div>
      </motion.div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="surface-card p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#172B4D] flex items-center gap-2">
            {chartType === 'bar' && <BarChart2 className="w-5 h-5 text-[#1868DB]" />}
            {chartType === 'line' && <LineChart2 className="w-5 h-5 text-[#1868DB]" />}
            {chartType === 'area' && <AreaChart2 className="w-5 h-5 text-[#1868DB]" />}
            <span>Tren Aktivitas Harian</span>
          </h3>
          <span className="text-xs font-medium text-[#44546F] bg-[#F1F2F4] px-2 py-1 rounded">
            {data.totalTransaksi} Total Transaksi
          </span>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' && (
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9F2FF" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#44546F', fontSize: 10 }} 
                  axisLine={false} 
                  tickFormatter={(val) => val.split('-')[2] + '/' + val.split('-')[1]}
                />
                <YAxis tick={{ fill: '#44546F', fontSize: 12 }} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #DCDFE4', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#172B4D' }}
                  formatter={(value: number) => [`${value} Item`, 'Total']}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32} fill="#1868DB" />
              </BarChart>
            )}
            {chartType === 'line' && (
              <RechartsLineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9F2FF" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#44546F', fontSize: 10 }} 
                  axisLine={false} 
                  tickFormatter={(val) => val.split('-')[2] + '/' + val.split('-')[1]}
                />
                <YAxis tick={{ fill: '#44546F', fontSize: 12 }} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #DCDFE4', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#172B4D' }}
                  formatter={(value: number) => [`${value} Item`, 'Total']}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Line type="monotone" dataKey="count" stroke="#1868DB" strokeWidth={3} dot={{ r: 4 }} />
              </RechartsLineChart>
            )}
            {chartType === 'area' && (
              <RechartsAreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9F2FF" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#44546F', fontSize: 10 }} 
                  axisLine={false} 
                  tickFormatter={(val) => val.split('-')[2] + '/' + val.split('-')[1]}
                />
                <YAxis tick={{ fill: '#44546F', fontSize: 12 }} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #DCDFE4', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#172B4D' }}
                  formatter={(value: number) => [`${value} Item`, 'Total']}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Area type="monotone" dataKey="count" stroke="#1868DB" fill="#E9F2FF" strokeWidth={3} />
              </RechartsAreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Daily Distribution Grid */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="surface-card p-6 space-y-4"
      >
        <h3 className="font-semibold text-sm text-[#172B4D] uppercase tracking-wider">Distribusi Aktivitas Harian</h3>

        {(!trendData || trendData.length === 0) ? (
          <p className="text-[#44546F] text-sm text-center py-8">Tidak ada aktivitas pada rentang tanggal ini.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {trendData.map((day, i) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i }}
                className="p-4 bg-[#F7F8F9] border border-[#DCDFE4] rounded text-center space-y-1"
              >
                <span className="text-xs text-[#44546F] block tabular-nums">{day.date}</span>
                <span className="text-2xl font-bold text-[#1868DB] tabular-nums block">{day.count}</span>
                <div className="flex items-center justify-center gap-2 text-[10px] text-[#44546F] mt-1">
                  <span className="bg-[#FFEBE6] text-[#CA3521] px-1.5 py-0.5 rounded">{day.kritis}K</span>
                  <span className="bg-[#FFFAE6] text-[#B38600] px-1.5 py-0.5 rounded">{day.hampirHabis}H</span>
                  <span className="bg-[#E3FCEF] text-[#216E4E] px-1.5 py-0.5 rounded">{day.aman}A</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Icons components
function BarChart2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}

function LineChart2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 12H18L15 21L9 3L6 12H2" />
    </svg>
  );
}

function AreaChart2({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 12V4H2L6 12L10 20L14 10L18 20V12H22Z" />
    </svg>
  );
}
