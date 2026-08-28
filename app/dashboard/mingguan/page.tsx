'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCabang } from '@/lib/CabangContext';
import {
  TrendingUp,
  ShieldAlert,
  Activity,
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
  ResponsiveContainer
} from 'recharts';
import { QuantumLoaderFull } from '@/components/ui/QuantumLoader';

type ChartType = 'bar' | 'line' | 'area';

interface DailyStats {
  date: string;
  count: number;
  kritis: number;
  hampirHabis: number;
  aman: number;
}

function TrendBarChart({ data }: { data: DailyStats[] }) {
  return (
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.935 0.004 260)" vertical={false} />
      <XAxis
        dataKey="date"
        tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 10 }}
        axisLine={false}
        tickFormatter={(val) => val.split('-')[2] + '/' + val.split('-')[1]}
      />
      <YAxis tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 12 }} axisLine={false} />
      <Tooltip
        contentStyle={{ backgroundColor: 'oklch(0.99 0.002 260)', borderRadius: '4px', border: '1px solid oklch(0.90 0.005 260)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        itemStyle={{ color: 'oklch(0.18 0.03 260)' }}
        formatter={(value: number) => [`${value} Item`, 'Total']}
      />
      <Legend verticalAlign="bottom" height={36} />
      <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={32} fill="oklch(0.46 0.17 260)" />
    </BarChart>
  );
}

function TrendLineChart({ data }: { data: DailyStats[] }) {
  return (
    <RechartsLineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.935 0.004 260)" vertical={false} />
      <XAxis
        dataKey="date"
        tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 10 }}
        axisLine={false}
        tickFormatter={(val) => val.split('-')[2] + '/' + val.split('-')[1]}
      />
      <YAxis tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 12 }} axisLine={false} />
      <Tooltip
        contentStyle={{ backgroundColor: 'oklch(0.99 0.002 260)', borderRadius: '4px', border: '1px solid oklch(0.90 0.005 260)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        itemStyle={{ color: 'oklch(0.18 0.03 260)' }}
        formatter={(value: number) => [`${value} Item`, 'Total']}
      />
      <Legend verticalAlign="bottom" height={36} />
      <Line type="monotone" dataKey="count" stroke="oklch(0.46 0.17 260)" strokeWidth={3} dot={{ r: 4 }} />
    </RechartsLineChart>
  );
}

function TrendAreaChart({ data }: { data: DailyStats[] }) {
  return (
    <RechartsAreaChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.935 0.004 260)" vertical={false} />
      <XAxis
        dataKey="date"
        tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 10 }}
        axisLine={false}
        tickFormatter={(val) => val.split('-')[2] + '/' + val.split('-')[1]}
      />
      <YAxis tick={{ fill: 'oklch(0.40 0.03 260)', fontSize: 12 }} axisLine={false} />
      <Tooltip
        contentStyle={{ backgroundColor: 'oklch(0.99 0.002 260)', borderRadius: '4px', border: '1px solid oklch(0.90 0.005 260)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        itemStyle={{ color: 'oklch(0.18 0.03 260)' }}
        formatter={(value: number) => [`${value} Item`, 'Total']}
      />
      <Legend verticalAlign="bottom" height={36} />
      <Area type="monotone" dataKey="count" stroke="oklch(0.46 0.17 260)" fill="oklch(0.935 0.004 260)" strokeWidth={3} />
    </RechartsAreaChart>
  );
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
      <div className="text-center py-16 card bg-base-100 border border-base-300 p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-warning mx-auto" />
        <h3 className="text-base font-bold text-base-content">Pilih Cabang Terlebih Dahulu</h3>
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
    return <QuantumLoaderFull text="Memuat tren transaksi mingguan" />;
  }

  if (!data) {
    return (
      <div className="p-12 text-center card bg-base-100 border border-base-300">
        <p className="text-base-content/60 text-sm">Gagal memuat data tren.</p>
      </div>
    );
  }

  const ChartIcon = chartType === 'bar' ? BarChart3Icon : chartType === 'line' ? LineChartIcon : AreaChartIcon;

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <TrendBarChart data={trendData} />;
      case 'line':
        return <TrendLineChart data={trendData} />;
      case 'area':
        return <TrendAreaChart data={trendData} />;
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
            <TrendingUp className="w-6 h-6 text-primary" />
            <span>Dashboard Tren Mingguan</span>
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Cabang Operasional: <span className="text-base-content font-semibold">{selectedCabang.Nama_Cabang}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-base-200 rounded p-1 text-sm font-medium">
            <Link href="/dashboard/harian" className="text-base-content/60 hover:text-base-content px-3 py-1 rounded transition-colors">
              Harian
            </Link>
            <span className="bg-base-100 text-base-content px-3 py-1 rounded shadow-sm">Mingguan</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-base-content/60">
            <input
              type="date"
              value={dari}
              onChange={(e) => setDari(e.target.value)}
              className="input input-bordered px-3 py-1.5 text-sm tabular-nums"
            />
            <span>sampai</span>
            <input
              type="date"
              value={sampai}
              onChange={(e) => setSampai(e.target.value)}
              className="input input-bordered px-3 py-1.5 text-sm tabular-nums"
            />
          </div>

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
        className="card bg-base-100 border border-base-300 p-6 flex items-center justify-between"
      >
        <div className="space-y-1">
          <span className="text-sm text-base-content/60 font-semibold">Total Item Terhitung pada Periode Ini</span>
          <h2 className="text-3xl font-bold text-base-content tabular-nums">{data.totalTransaksi || 0} Transaksi</h2>
          <p className="text-sm text-base-content/60 tabular-nums">Periode: {data.dari} hingga {data.sampai}</p>
        </div>
        <div className="p-4 bg-primary/10 text-primary rounded">
          <Activity className="w-8 h-8" />
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
            <span>Tren Aktivitas Harian</span>
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
        className="card bg-base-100 border border-base-300 p-6 space-y-4"
      >
        <h3 className="font-semibold text-sm text-base-content uppercase tracking-wider">Distribusi Aktivitas Harian</h3>

        {(!trendData || trendData.length === 0) ? (
          <p className="text-base-content/60 text-sm text-center py-8">Tidak ada aktivitas pada rentang tanggal ini.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {trendData.map((day, i) => (
              <motion.div
                key={day.date}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i }}
                className="p-4 bg-base-200 border border-base-300 rounded text-center space-y-1"
              >
                <span className="text-xs text-base-content/60 block tabular-nums">{day.date}</span>
                <span className="text-2xl font-bold text-primary tabular-nums block">{day.count}</span>
                <div className="flex items-center justify-center gap-2 text-[10px] text-base-content/60 mt-1">
                  <span className="badge badge-error badge-xs">{day.kritis}K</span>
                  <span className="badge badge-warning badge-xs">{day.hampirHabis}H</span>
                  <span className="badge badge-success badge-xs">{day.aman}A</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
