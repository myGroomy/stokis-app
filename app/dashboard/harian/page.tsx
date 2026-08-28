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
      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.935 0.004 260)" vertical={false} />
      <XAxis dataKey="name" tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 12 }} axisLine={false} />
      <YAxis tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 12 }} axisLine={false} />
      <Tooltip
        contentStyle={{ backgroundColor: 'oklch(0.99 0.002 260)', borderRadius: '4px', border: '1px solid oklch(0.90 0.005 260)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        itemStyle={{ color: 'oklch(0.18 0.03 260)' }}
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
      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.935 0.004 260)" vertical={false} />
      <XAxis dataKey="name" tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 12 }} axisLine={false} />
      <YAxis tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 12 }} axisLine={false} />
      <Tooltip
        contentStyle={{ backgroundColor: 'oklch(0.99 0.002 260)', borderRadius: '4px', border: '1px solid oklch(0.90 0.005 260)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        itemStyle={{ color: 'oklch(0.18 0.03 260)' }}
      />
      <Legend verticalAlign="bottom" height={36} />
      <Line type="monotone" dataKey="value" stroke="oklch(0.46 0.17 260)" strokeWidth={3} dot={{ r: 4 }} />
    </RechartsLineChart>
  );
}

function StatusAreaChart({ data }: { data: any[] }) {
  return (
    <RechartsAreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.935 0.004 260)" vertical={false} />
      <XAxis dataKey="name" tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 12 }} axisLine={false} />
      <YAxis tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 12 }} axisLine={false} />
      <Tooltip
        contentStyle={{ backgroundColor: 'oklch(0.99 0.002 260)', borderRadius: '4px', border: '1px solid oklch(0.90 0.005 260)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        itemStyle={{ color: 'oklch(0.18 0.03 260)' }}
      />
      <Legend verticalAlign="bottom" height={36} />
      <Area type="monotone" dataKey="value" stroke="oklch(0.46 0.17 260)" fill="oklch(0.935 0.004 260)" strokeWidth={3} />
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
      <div className="text-center py-16 card bg-base-100 border border-base-300 p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-warning mx-auto" />
        <h3 className="text-base font-bold text-base-content">Pilih Cabang Terlebih Dahulu</h3>
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
      <div className="p-12 text-center card bg-base-100 border border-base-300">
        <p className="text-base-content/60 text-sm">Gagal memuat data dashboard.</p>
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
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-base-content flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            <span>Dashboard Analitik Harian</span>
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Cabang Operasional: <span className="text-base-content font-semibold">{selectedCabang.Nama_Cabang}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-base-200 rounded p-1 text-sm font-medium">
            <span className="bg-base-100 text-base-content px-3 py-1 rounded shadow-sm">Harian</span>
            <Link href="/dashboard/mingguan" className="text-base-content/60 hover:text-base-content px-3 py-1 rounded transition-colors">
              Mingguan
            </Link>
          </div>

          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="input input-bordered px-3 py-1.5 text-sm tabular-nums"
          />

          <div className="flex bg-base-200 rounded p-1">
            {(['bar', 'line', 'area'] as ChartType[]).map((type) => {
              const Icon = type === 'bar' ? BarChart3Icon : type === 'line' ? LineChartIcon : AreaChartIcon;
              return (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`p-1.5 rounded transition-colors ${
                    chartType === type
                      ? 'bg-base-100 text-primary shadow-sm'
                      : 'text-base-content/60 hover:text-base-content'
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

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <div className="card bg-base-100 border border-base-300 p-5 flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-base-content/60 font-semibold">Total Item Terhitung</span>
            <h3 className="text-2xl font-bold text-base-content tabular-nums">{data.totalTransaksi || 0}</h3>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 p-5 flex items-center gap-4">
          <div className="p-3 bg-error/10 text-error rounded">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-base-content/60 font-semibold">Item Status Kritis</span>
            <h3 className="text-2xl font-bold text-error tabular-nums">{data.kritis || 0}</h3>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300 p-5 flex items-center gap-4">
          <div className="p-3 bg-warning/10 text-warning rounded">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-base-content/60 font-semibold">Item Hampir Habis</span>
            <h3 className="text-2xl font-bold text-warning tabular-nums">{data.hampirHabis || 0}</h3>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="card bg-base-100 border border-base-300 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base-content flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-primary" />
            <span>Distribusi Status Item</span>
          </h3>
          <span className="text-xs font-medium text-base-content/60 bg-base-200 px-2 py-1 rounded">
            {data.totalTransaksi} Total Transaksi
          </span>
        </div>

        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.15 }}
        className="card bg-base-100 border border-base-300 overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-base-300 font-semibold text-sm text-base-content flex items-center justify-between">
          <span>Rincian Catatan SO Tanggal {tanggal}</span>
          <span className="text-base-content/60 font-mono text-xs">{data.detail?.length || 0} Baris</span>
        </div>

        {(!data.detail || data.detail.length === 0) ? (
          <div className="p-12 text-center text-base-content/60 text-sm">
            Belum ada transaksi stock opname yang tercatat pada tanggal ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm mobile-card-table">
              <thead className="bg-base-200 border-b border-base-300">
                <tr className="font-semibold text-base-content/60">
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
              <tbody className="text-base-content">
                {data.detail.map((row: any, i: number) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    className="border-b border-base-300 hover:bg-base-200 transition-colors"
                  >
                    <td className="px-5 py-4 font-semibold" data-label="Barang">{row.Nama_Barang}</td>
                    <td className="px-5 py-4 text-base-content/60" data-label="Shift">{row.Shift}</td>
                    <td className="px-5 py-4 text-base-content" data-label="Petugas">{row.Petugas}</td>
                    <td className="px-5 py-4 text-center tabular-nums" data-label="Step 1">{row.Step1}</td>
                    <td className="px-5 py-4 text-center tabular-nums" data-label="Step 2">{row.Step2}</td>
                    <td className="px-5 py-4 text-center font-bold text-primary tabular-nums" data-label="Total">{row.Total}</td>
                    <td className="px-5 py-4 text-center text-base-content/60 tabular-nums" data-label="Minimum">{row.Threshold}</td>
                    <td className="px-5 py-4 text-right" data-label="Status">
                      <span className={`badge ${
                        row.Status === 'Kritis'
                          ? 'badge-error'
                          : row.Status === 'Hampir Habis'
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}>
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
