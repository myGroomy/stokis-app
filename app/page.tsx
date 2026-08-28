"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import {
  ClipboardCheck,
  Package,
  Users,
  FileText,
  ArrowRight,
  Store,
  BarChart3,
  ShieldCheck,
  Database,
  Key,
  HelpCircle,
  Smartphone,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-anim",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" },
      );

      if (featuresRef.current) {
        gsap.fromTo(
          ".feature-card",
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: featuresRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          },
        );
      }

      if (workflowRef.current) {
        gsap.fromTo(
          ".workflow-step",
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.5,
            stagger: 0.15,
            ease: "power3.out",
            scrollTrigger: {
              trigger: workflowRef.current,
              start: "top 80%",
              toggleActions: "play none none none",
            },
          },
        );
      }

      if (statsRef.current) {
        gsap.fromTo(
          ".stat-card",
          { scale: 0.9, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: "back.out(1.2)",
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          },
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [user]);

  if (!user) {
    return (
      <main ref={containerRef} className="overflow-x-hidden w-full bg-base-200">
        {/* HERO */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center py-20 md:py-28 bg-base-100 border-b border-base-300 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-30 bg-gradient-to-br from-primary/10 via-transparent to-success/10" />
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1600&q=80')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm" />

          <div className="relative z-10 space-y-6 max-w-4xl px-4 flex flex-col items-center">
            <div className="hero-anim inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Branch Stock Opname System</span>
            </div>

            <h1 className="hero-anim text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] max-w-3xl text-base-content">
              Akurasi Stok Cabang{' '}
              <br className="hidden sm:inline" />
              Real-time ke{' '}
              <span className="text-primary">Google Sheets</span>
            </h1>

            <p className="hero-anim text-base sm:text-lg max-w-xl leading-relaxed text-base-content/60">
              Verifikasi stok fisik harian di gudang dan cabang dengan mudah.
              Laporan otomatis terkirim via PDF dan WhatsApp.
            </p>

            <div className="hero-anim pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/login"
                prefetch={false}
                className="btn btn-primary gap-2 px-8 py-3.5 text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
              >
                <span>Masuk ke Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#fitur"
                className="btn btn-ghost gap-2 px-8 py-3.5 text-sm font-semibold"
              >
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
        </section>

        {/* STATS */}
        <section ref={statsRef} className="max-w-6xl mx-auto px-4 py-12 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card card bg-base-100 border border-base-300 p-5 text-center space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-primary">100%</p>
              <p className="text-xs font-medium text-base-content/60">Digital & Paperless</p>
            </div>
            <div className="stat-card card bg-base-100 border border-base-300 p-5 text-center space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-success">&lt; 5m</p>
              <p className="text-xs font-medium text-base-content/60">Waktu per Laporan</p>
            </div>
            <div className="stat-card card bg-base-100 border border-base-300 p-5 text-center space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-warning">Multi</p>
              <p className="text-xs font-medium text-base-content/60">Cabang Terisolasi</p>
            </div>
            <div className="stat-card card bg-base-100 border border-base-300 p-5 text-center space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-error">Real-time</p>
              <p className="text-xs font-medium text-base-content/60">Sinkronisasi Data</p>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="fitur" ref={featuresRef} className="max-w-6xl mx-auto px-4 py-16 w-full space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-base-content">Kenapa STOKIS?</h2>
            <p className="text-sm text-base-content/60 max-w-lg mx-auto">
              Solusi lengkap untuk mengelola stock opname multi-cabang dengan efisien dan akurat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-card card bg-base-100 border border-base-300 overflow-hidden">
              <div className="h-40 bg-[url('https://images.unsplash.com/photo-1553413077-190dd305871c?w=600&q=80')] bg-cover bg-center" />
              <div className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-base-content">Isolasi Data Cabang</h3>
                <p className="text-xs leading-relaxed text-base-content/60">
                  Setiap cabang memiliki database Google Sheets sendiri yang terisolasi dan aman
                  untuk menjamin keandalan data antar lokasi.
                </p>
              </div>
            </div>

            <div className="feature-card card bg-base-100 border border-base-300 overflow-hidden">
              <div className="h-40 bg-[url('https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&q=80')] bg-cover bg-center" />
              <div className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-success/10 text-success">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-base-content">Laporan PDF & Excel Instan</h3>
                <p className="text-xs leading-relaxed text-base-content/60">
                  Selesai melakukan Stock Opname, laporan ringkasan dalam format PDF dan Excel
                  yang rapi langsung digenerate secara otomatis.
                </p>
              </div>
            </div>

            <div className="feature-card card bg-base-100 border border-base-300 overflow-hidden">
              <div className="h-40 bg-[url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600&q=80')] bg-cover bg-center" />
              <div className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-error/10 text-error">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-base-content">Dashboard Analitik</h3>
                <p className="text-xs leading-relaxed text-base-content/60">
                  Pantau tren stok harian dan mingguan melalui grafik interaktif. Identifikasi
                  item kritis dan selisih secara real-time.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-card card bg-base-100 border border-base-300 overflow-hidden">
              <div className="h-40 bg-[url('https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80')] bg-cover bg-center" />
              <div className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-warning/10 text-warning">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-base-content">Keamanan PIN 6-Digit</h3>
                <p className="text-xs leading-relaxed text-base-content/60">
                  Petugas melakukan login secara aman menggunakan username dan 6-digit PIN unik
                  untuk setiap akun operasional.
                </p>
              </div>
            </div>

            <div className="feature-card card bg-base-100 border border-base-300 overflow-hidden">
              <div className="h-40 bg-[url('https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80')] bg-cover bg-center" />
              <div className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-info/10 text-info">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-base-content">Kirim via WhatsApp</h3>
                <p className="text-xs leading-relaxed text-base-content/60">
                  Notifikasi laporan langsung terkirim ke WhatsApp PIC cabang. Ringkasan lengkap
                  dengan tautan PDF tanpa perlu aplikasi tambahan.
                </p>
              </div>
            </div>

            <div className="feature-card card bg-base-100 border border-base-300 overflow-hidden">
              <div className="h-40 bg-[url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80')] bg-cover bg-center" />
              <div className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-secondary/10 text-secondary">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-base-content">Multi-Shift</h3>
                <p className="text-xs leading-relaxed text-base-content/60">
                  Dukungan pencatatan untuk shift Opening, Middle, dan Closing. Setiap shift
                  tercatat secara terpisah dan terorganisir.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW */}
        <section ref={workflowRef} className="bg-base-100 border-y border-base-300">
          <div className="max-w-6xl mx-auto px-4 py-16 w-full space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold text-base-content">Alur Kerja Sederhana</h2>
              <p className="text-sm text-base-content/60 max-w-lg mx-auto">
                Dari pencatatan fisik hingga laporan PDF, semuanya dalam lima langkah mudah.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
              <div className="workflow-step flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="text-sm font-bold text-base-content">Login PIN</h4>
                <p className="text-xs text-base-content/60">Akses aman dengan 6-digit PIN</p>
              </div>

              <div className="workflow-step flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="text-sm font-bold text-base-content">Pilih Shift</h4>
                <p className="text-xs text-base-content/60">Opening, Middle, atau Closing</p>
              </div>

              <div className="workflow-step flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h4 className="text-sm font-bold text-base-content">Input Stok</h4>
                <p className="text-xs text-base-content/60">Catat jumlah fisik setiap item</p>
              </div>

              <div className="workflow-step flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  4
                </div>
                <h4 className="text-sm font-bold text-base-content">Submit</h4>
                <p className="text-xs text-base-content/60">Kirim laporan ke server</p>
              </div>

              <div className="workflow-step flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center font-bold text-sm">
                  5
                </div>
                <h4 className="text-sm font-bold text-base-content">Laporan PDF</h4>
                <p className="text-xs text-base-content/60">Download & kirim via WhatsApp</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-4 py-16 w-full">
          <div className="relative rounded-2xl overflow-hidden bg-primary text-primary-content p-8 md:p-12">
            <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1600&q=80')] bg-cover bg-center" />
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold">Siap Memulai?</h2>
                <p className="text-sm opacity-90 max-w-md">
                  Masuk ke akun Anda dan mulai pencatatan stok pertama hari ini.
                </p>
              </div>
              <Link
                href="/login"
                prefetch={false}
                className="btn btn-lg bg-base-100 text-primary border-none hover:bg-base-200 gap-2 px-8"
              >
                Mulai Sekarang
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-6 w-full border-t border-base-300 bg-base-100">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-base-content/50">
            <span>STOKIS &copy; {new Date().getFullYear()}</span>
            <span>Operasional Gudang & Retail</span>
          </div>
        </footer>
      </main>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <main ref={containerRef} className="space-y-8 max-w-5xl mx-auto">
      <div className="rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/10 border border-primary/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-base-100 text-primary border border-primary/20">
              {user.role}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-base-content">
            Selamat Datang, {user.nama}!
          </h1>
          <p className="text-sm text-base-content/60">
            Silakan gunakan modul di bawah untuk merekam stok, melihat laporan,
            atau mengelola data master.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2 text-base-content">
          <Zap className="w-4 h-4 text-primary" />
          <span>Modul Kerja</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/so/input" prefetch={false} className="card bg-base-100 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all p-5 flex items-start gap-4 group">
            <div className="p-2.5 rounded-lg bg-primary/10 text-primary"><ClipboardCheck className="w-5 h-5" /></div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-base-content">
                <span>Input Stock Opname</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0 text-primary" />
              </h3>
              <p className="text-xs text-base-content/60">Mulai sesi pencatatan stok fisik barang.</p>
            </div>
          </Link>
          <Link href="/laporan" prefetch={false} className="card bg-base-100 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all p-5 flex items-start gap-4 group">
            <div className="p-2.5 rounded-lg bg-success/10 text-success"><FileText className="w-5 h-5" /></div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold flex items-center gap-1.5 text-base-content">
                <span>Laporan & PDF</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0 text-primary" />
              </h3>
              <p className="text-xs text-base-content/60">Lihat arsip riwayat dan unduh laporan PDF.</p>
            </div>
          </Link>
          {isAdmin && (
            <Link href="/master-item" prefetch={false} className="card bg-base-100 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all p-5 flex items-start gap-4 group">
              <div className="p-2.5 rounded-lg bg-warning/10 text-warning"><Package className="w-5 h-5" /></div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-base-content">
                  <span>Database Master Item</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0 text-primary" />
                </h3>
                <p className="text-xs text-base-content/60">Kelola daftar barang dan threshold kritis.</p>
              </div>
            </Link>
          )}
          {isAdmin && (
            <Link href="/petugas" prefetch={false} className="card bg-base-100 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all p-5 flex items-start gap-4 group">
              <div className="p-2.5 rounded-lg bg-secondary/10 text-secondary"><Users className="w-5 h-5" /></div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold flex items-center gap-1.5 text-base-content">
                  <span>Manajemen Pengguna</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0 text-primary" />
                </h3>
                <p className="text-xs text-base-content/60">Daftarkan akun petugas baru dan atur PIN.</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300 p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-base-content">
          <HelpCircle className="w-4 h-4 text-base-content/50" />
          <span>Panduan Singkat</span>
        </h3>
        <ol className="list-decimal list-inside text-xs space-y-2.5 text-base-content/60">
          <li>Pastikan nama cabang sesuai dengan lokasi kerja Anda.</li>
          <li>Masuk ke modul <span className="font-bold text-base-content">Input Stock Opname</span>, pilih shift.</li>
          <li>Ketikkan jumlah stok fisik barang pada kolom yang disediakan.</li>
          <li>Tekan <span className="font-bold text-base-content">Submit Laporan SO</span> setelah semua data terisi.</li>
          <li>Unduh laporan <span className="font-bold text-base-content">PDF</span> dan <span className="font-bold text-base-content">Excel</span> yang digenerate otomatis.</li>
        </ol>
      </div>
    </main>
  );
}
