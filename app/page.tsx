"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { useCabang } from "@/lib/CabangContext";
import { useAuth } from "@/lib/AuthContext";
import {
  ClipboardCheck,
  Package,
  Users,
  FileText,
  ArrowRight,
  PlusCircle,
  BarChart3,
  Store,
  ArrowUpRight,
  RefreshCw,
  Layers,
  ShieldCheck,
  Database,
  Key,
  Shield,
  HelpCircle,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const { user } = useAuth();
  const { cabangList, selectedCabang, setSelectedCabang, loading } =
    useCabang();

  const containerRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-anim",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" },
      );

      if (bentoRef.current) {
        gsap.fromTo(
          ".bento-card",
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: bentoRef.current,
              start: "top 85%",
              toggleActions: "play none none none",
            },
          },
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [user]);

  // LANDING PAGE (before login)
  if (!user) {
    return (
      <main
        ref={containerRef}
        className="overflow-x-hidden w-full bg-base-200 min-h-[85vh] flex flex-col justify-between"
      >
        <section className="relative flex flex-col items-center justify-center text-center py-20 md:py-28 bg-base-100 border-b border-base-300">
          <div className="absolute inset-0 pointer-events-none opacity-40 bg-gradient-to-b from-primary/10 to-transparent" />

          <div className="relative z-10 space-y-6 max-w-4xl px-4 flex flex-col items-center">
            <div className="hero-anim inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary">
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

            <div className="hero-anim pt-4">
              <Link
                href="/login"
                prefetch={false}
                className="btn btn-primary gap-2 px-8 py-3.5 text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
              >
                <span>Masuk ke Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-base-100 border border-base-300 p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-base-content">
                Isolasi Data Cabang
              </h3>
              <p className="text-xs leading-relaxed text-base-content/60">
                Setiap cabang memiliki database Google Sheets sendiri yang
                terisolasi dan aman untuk menjamin keandalan data.
              </p>
            </div>

            <div className="card bg-base-100 border border-base-300 p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-success/10 text-success">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-base-content">
                Laporan PDF & Excel Instan
              </h3>
              <p className="text-xs leading-relaxed text-base-content/60">
                Selesai melakukan Stock Opname, laporan ringkasan dalam format
                PDF dan Excel yang rapi langsung digenerate secara otomatis.
              </p>
            </div>

            <div className="card bg-base-100 border border-base-300 p-6 space-y-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-error/10 text-error">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-base-content">
                Keamanan PIN 6-Digit
              </h3>
              <p className="text-xs leading-relaxed text-base-content/60">
                Petugas melakukan login secara aman menggunakan username dan
                6-digit PIN unik untuk setiap akun operasional.
              </p>
            </div>
          </div>
        </section>

        <footer className="py-6 w-full border-t border-base-300 bg-base-100">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-base-content/50">
            <span>STOKIS &copy; {new Date().getFullYear()}</span>
            <span>Operasional Gudang & Retail</span>
          </div>
        </footer>
      </main>
    );
  }

  // OPERATIONAL HOME (after login)
  const isAdmin = user.role === "admin";

  return (
    <main ref={containerRef} className="space-y-8 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-primary/10 border border-primary/20">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-base-100 text-primary border border-primary/20">
              {user.role}
            </span>
            {selectedCabang && (
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md flex items-center gap-1 bg-success/10 text-success border border-success/20">
                <Store className="w-3 h-3" /> {selectedCabang.Nama_Cabang}
              </span>
            )}
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

      {/* Cabang Selector if user has multiple branches */}
      {cabangList.length > 1 && (
        <div className="card bg-base-100 border border-base-300 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-base-300 pb-3">
            <Store className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-base-content">
              Pilih Cabang Kerja Aktif
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {cabangList.map((cabang) => {
              const isSelected = selectedCabang?.Cabang_ID === cabang.Cabang_ID;
              return (
                <button
                  key={cabang.Cabang_ID}
                  onClick={() => setSelectedCabang(cabang)}
                  className={`text-left p-3.5 rounded border transition-colors flex flex-col justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary"
                      : "bg-base-100 border-base-300 hover:bg-base-200"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-base-content/60 bg-base-200 px-1.5 py-0.5 rounded">
                      {cabang.Cabang_ID}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-base-content truncate">
                    {cabang.Nama_Cabang}
                  </h4>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Operational Modules */}
      <div className="space-y-4">
        <h2 className="text-base font-bold flex items-center gap-2 text-base-content">
          <Layers className="w-4 h-4 text-primary" />
          <span>Modul Kerja Operasional</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/so/input"
            prefetch={false}
            className="card bg-base-100 border border-base-300 hover:border-primary/30 hover:shadow-md cursor-pointer transition-all p-5 flex items-start gap-4 group"
          >
            <div className="p-2.5 rounded-lg flex-shrink-0 bg-primary/10 text-primary">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold flex items-center gap-1.5 transition-colors text-base-content">
                <span>Input Stock Opname (SO)</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0 text-primary" />
              </h3>
              <p className="text-xs leading-relaxed text-base-content/60">
                Mulai sesi pencatatan stok fisik barang dagangan di area
                gudang/toko untuk membandingkan dengan target selisih.
              </p>
            </div>
          </Link>

          <Link
            href="/laporan"
            prefetch={false}
            className="card bg-base-100 border border-base-300 hover:border-primary/30 hover:shadow-md cursor-pointer transition-all p-5 flex items-start gap-4 group"
          >
            <div className="p-2.5 rounded-lg flex-shrink-0 bg-success/10 text-success">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold flex items-center gap-1.5 transition-colors text-base-content">
                <span>Laporan & PDF</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0 text-primary" />
              </h3>
              <p className="text-xs leading-relaxed text-base-content/60">
                Buka arsip riwayat sesi SO yang sudah selesai, unduh berkas PDF
                laporan, atau kirimkan rangkuman ke WhatsApp PIC.
              </p>
            </div>
          </Link>

          {isAdmin && (
            <Link
              href="/master-item"
              prefetch={false}
              className="card bg-base-100 border border-base-300 hover:border-primary/30 hover:shadow-md cursor-pointer transition-all p-5 flex items-start gap-4 group"
            >
              <div className="p-2.5 rounded-lg flex-shrink-0 bg-warning/10 text-warning">
                <Package className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold flex items-center gap-1.5 transition-colors text-base-content">
                  <span>Database Master Item</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0 text-primary" />
                </h3>
                <p className="text-xs leading-relaxed text-base-content/60">
                  Kelola daftar barang dagangan, tentukan area peletakan
                  (rak/chiller), serta sesuaikan batas minimal (threshold)
                  kritis.
                </p>
              </div>
            </Link>
          )}

          {isAdmin && (
            <Link
              href="/petugas"
              prefetch={false}
              className="card bg-base-100 border border-base-300 hover:border-primary/30 hover:shadow-md cursor-pointer transition-all p-5 flex items-start gap-4 group"
            >
              <div className="p-2.5 rounded-lg flex-shrink-0 bg-secondary/10 text-secondary">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold flex items-center gap-1.5 transition-colors text-base-content">
                  <span>Manajemen Pengguna</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0 text-primary" />
                </h3>
                <p className="text-xs leading-relaxed text-base-content/60">
                  Daftarkan akun petugas baru, ubah PIN 6-digit login, atau ubah
                  otoritas/cabang kerja masing-masing staf operasional.
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Guidelines & Quick Help */}
      <div className="card bg-base-100 border border-base-300 p-6 space-y-4">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-base-content">
          <HelpCircle className="w-4 h-4 text-base-content/50" />
          <span>Panduan Singkat Alur Stock Opname</span>
        </h3>
        <ol className="list-decimal list-inside text-xs space-y-2.5 leading-relaxed text-base-content/60">
          <li>
            Pastikan nama cabang di pojok kanan atas telah sesuai dengan lokasi
            kerja Anda saat ini.
          </li>
          <li>
            Masuk ke modul{" "}
            <span className="text-base-content font-bold">Input Stock Opname</span>
            , pilih <span className="text-base-content font-bold">Shift</span>{" "}
            kerja operasional.
          </li>
          <li>
            Ketikkan jumlah stok fisik barang pada kolom yang disediakan. Sistem
            akan otomatis menghitung selisih dibanding catatan pembukuan.
          </li>
          <li>
            Tekan{" "}
            <span className="text-base-content font-bold">Submit Laporan SO</span>{" "}
            setelah seluruh data terisi dengan lengkap dan benar.
          </li>
          <li>
            Unduh laporan format{" "}
            <span className="text-base-content font-bold">PDF</span> dan{" "}
            <span className="text-base-content font-bold">Excel</span> yang muncul
            secara otomatis sebagai bukti fisik.
          </li>
        </ol>
      </div>
    </main>
  );
}
