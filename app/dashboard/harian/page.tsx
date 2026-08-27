'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCabang } from '@/lib/CabangContext';
import { 
  BarChart3, 
  AlertCircle, 
  Package, 
  TrendingUp,
  ShieldAlert,
  BarChart3Icon,
  LineChartIcon,
  AreaChartIcon
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
import { QuantumLoaderFull } from '@/components/ui/QuantumLoader';

type ChartType = 'bar' | 'line' | 'area';

interface DashboardData {
  totalTransaksi: number;
  kritis: number;
  hampirHabis: number;
  aman: number;
  detail: any[];
}

function StatusBarChart({ data }: { data: any[] }) {
  return (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E9F2FF" vertical={false} />
      <XAxis dataKey="name" tick={{ fill: '#44546F', fontSize: 12 }} axisLine={false} />
      <YAxis tick={{ fill: '#44546F', fontSize: 12 }} axisLine={false} />
      <Tooltip
        contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #DCDFE4', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        itemStyle={{ color: '#172B4D' }}
      />
      <Legend verticalAlign="bottom" height={36} />
      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Bar>
    </BarChart>
  );
}

function StatusLineChart({ data }: { data: any[] }) {
  return (
    <RechartsLineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E9F2FF" vertical={false} />
      <XAxis dataKey="name" tick={{ fill: '#44546F', fontSize: 12 }} axisLine={false} />
      <YAxis tick={{ fill: '#44546F', fontSize: 12 }} axisLine={false} />
      <Tooltip
        contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #DCDFE4', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        itemStyle={{ color: '#172B4D' }}
      />
      <Legend verticalAlign="bottom" height={36} />
      <Line type="monotone" dataKey="value" stroke="#1868DB" strokeWidth={3} dot={{ r: 4 }} />
    </RechartsLineChart>
  );
}

function StatusAreaChart({ data }: { data: any[] }) {
  return (
    <RechartsAreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#E9F2FF" vertical={false} />
      <XAxis dataKey="name" tick={{ fill: '#44546F', fontSize: 12 }} axisLine={false} />
      <YAxis tick={{ fill: '#44546F', fontSize: 12 }} axisLine={false} />
      <Tooltip
        contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #DCDFE4', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        itemStyle={{ color: '#172B4D' }}
      />
      <Legend verticalAlign="bottom" height={36} />
      <Area type="monotone" dataKey="value" stroke="#1868DB" fill="#E9F2FF" strokeWidth={3} />
    </RechartsAreaChart>
  );
}

export default function DashboardHarianPage() {
  const { selectedCabang } = useCabang();

  const [tanggal, setTanggal] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartType, setChartType] = useState<ChartType>('bar');

  const fetchDashboard = async () => {
    if (!selectedCabang) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/harian?cabang=${selectedCabang.Cabang_ID}&tanggal=${tanggal}`);
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Error fetching dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedCabang, tanggal]);

  if (!selectedCabang) {
    return (
      <div className="text-center py-16 surface-card rounded-3xl p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-[#B38600] mx-auto" />
        <h3 className="text-base font-bold text-[#172B4D]">Pilih Cabang Terlebih Dahulu</h3>
      </div>
    );
  }

  const chartData = useMemo(() => {
    if (!data?.detail) return [];
    return [
      { name: 'Kritis', value: data.kritis, color: '#CA3521' },
      { name: 'Hampir Habis', value: data.hampirHabis, color: '#B38600' },
      { name: 'Aman', value: data.aman, color: '#216E4E' },
    ];
  }, [data]);

  if (loading) {
    return <QuantumLoaderFull text="Memuat ringkasan data harian" />;
  }

  if (!data) {
    return (
      <div className="p-12 text-center surface-card">
        <p className="text-[#44546F] text-sm">Gagal memuat data dashboard.</p>
      </div>
    );
  }

  const ChartIcon = chartType === 'bar' ? BarChart3Icon : chartType === 'line' ? LineChartIcon : AreaChartIcon;

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <StatusBarChart data={chartData} />;
      case 'line':
        return <StatusLineChart data={chartData} />;
      case 'area':
        return <StatusAreaChart data={chartData} />;
    }
  };

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
            <BarChart3 className="w-6 h-6 text-[#1868DB]" />
            <span>Dashboard Analitik Harian</span>
          </h1>
          <p className="text-[#44546F] text-sm mt-1">
            Cabang Operasional: <span className="text-[#172B4D] font-semibold">{selectedCabang.Nama_Cabang}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-[#F1F2F4] rounded p-1 text-sm font-medium">
            <span className="bg-white text-[#172B4D] px-3 py-1 rounded shadow-sm">Harian</span>
            <Link href="/dashboard/mingguan" className="text-[#44546F] hover:text-[#172B4D] px-3 py-1 rounded transition-colors">
              Mingguan
            </Link>
          </div>

          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="bg-white border border-[#DCDFE4] rounded px-3 py-1.5 text-sm text-[#172B4D] focus:outline-none focus:border-[#1868DB] tabular-nums"
          />

          {/* Chart Type Toggle */}
          <div className="flex bg-[#F1F2F4] rounded p-1">
            {(['bar', 'line', 'area'] as ChartType[]).map((type) => {
              const Icon = type === 'bar' ? BarChart3Icon : type === 'line' ? LineChartIcon : AreaChartIcon;
              return (
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
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Metric Cards */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="surface-card p-5 flex items-center gap-4">
          <div className="p-3 bg-[#E9F2FF] text-[#1868DB] rounded">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-[#44546F] font-semibold">Total Item Terhitung</span>
            <h3 className="text-2xl font-bold text-[#172B4D] tabular-nums">{data.totalTransaksi || 0}</h3>
          </div>
        </div>

        <div className="surface-card p-5 flex items-center gap-4">
          <div className="p-3 bg-[#FFEBE6] text-[#CA3521] rounded">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-[#44546F] font-semibold">Item Status Kritis</span>
            <h3 className="text-2xl font-bold text-[#CA3521] tabular-nums">{data.kritis || 0}</h3>
          </div>
        </div>

        <div className="surface-card p-5 flex items-center gap-4">
          <div className="p-3 bg-[#FFFAE6] text-[#B38600] rounded">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-[#44546F] font-semibold">Item Hampir Habis</span>
            <h3 className="text-2xl font-bold text-[#B38600] tabular-nums">{data.hampirHabis || 0}</h3>
          </div>
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
            <ChartIcon className="w-5 h-5 text-[#1868DB]" />
            <span>Distribusi Status Item</span>
          </h3>
          <span className="text-xs font-medium text-[#44546F] bg-[#F1F2F4] px-2 py-1 rounded">
            {data.totalTransaksi} Total Transaksi
          </span>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Detailed Transaction List */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="surface-card overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#DCDFE4] font-semibold text-sm text-[#172B4D] flex items-center justify-between">
          <span>Rincian Catatan SO Tanggal {tanggal}</span>
          <span className="text-[#44546F] font-mono text-xs">{data.detail?.length || 0} Baris</span>
        </div>

        {(!data.detail || data.detail.length === 0) ? (
          <div className="p-12 text-center text-[#44546F] text-sm">
            Belum ada transaksi stock opname yang tercatat pada tanggal ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm mobile-card-table">
              <thead className="bg-[#F7F8F9] text-[#44546F] font-semibold border-b border-[#DCDFE4]">
                <tr>
                  <th className="px-5 py-3">Nama Barang</th>
                  <th className="px-5 py-3">Shift</th>
                  <th className="px-5 py-3">Petugas</th>
                  <th className="px-5 py-3 text-center">Step 1</th>
                  <th className="px-5 py-3 text-center">Step 2</th>
                  <th className="px-5 py-3 text-center">Total</th>
                  <th className="px-5 py-3 text-center">Batas Minimum</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y sm:divide-y-0 divide-[#DCDFE4] text-[#172B4D]">
                {data.detail.map((row: any, i: number) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    className="hover:bg-[#F7F8F9] transition-colors"
                  >
                    <td className="px-5 py-4 font-semibold" data-label="Barang">{row.Nama_Barang}</td>
                    <td className="px-5 py-4 text-[#44546F]" data-label="Shift">{row.Shift}</td>
                    <td className="px-5 py-4 text-[#172B4D]" data-label="Petugas">{row.Petugas}</td>
                    <td className="px-5 py-4 text-center tabular-nums" data-label="Step 1">{row.Step1}</td>
                    <td className="px-5 py-4 text-center tabular-nums" data-label="Step 2">{row.Step2}</td>
                    <td className="px-5 py-4 text-center font-bold text-[#1868DB] tabular-nums" data-label="Total">{row.Total}</td>
                    <td className="px-5 py-4 text-center text-[#44546F] tabular-nums" data-label="Minimum">{row.Threshold}</td>
                    <td className="px-5 py-4 text-right" data-label="Status">
                      <span
                        className={`lozenge ${
                          row.Status === 'Kritis'
                            ? 'lozenge-danger'
                            : row.Status === 'Hampir Habis'
                            ? 'lozenge-warning'
                            : 'lozenge-success'
                        }`}
                      >
                        {row.Status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}