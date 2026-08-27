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
      // Hero animation
      gsap.fromTo(
        ".hero-anim",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" },
      );

      // Bento cards animation
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
  }, [user]); // Re-run animation if user state changes

  // ==========================================
  // RENDER 1: LANDING PAGE SEBELUM LOGIN
  // ==========================================
  if (!user) {
    return (
      <main
        ref={containerRef}
        className="overflow-x-hidden w-full bg-[#F7F8F9] min-h-[85vh] flex flex-col justify-between"
      >
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center text-center py-16 md:py-24 bg-white border-b border-[#DCDFE4]">
          <div className="absolute inset-0 bg-gradient-to-b from-[#E9F2FF] to-transparent pointer-events-none opacity-45" />

          <div className="relative z-10 space-y-6 max-w-4xl px-4 flex flex-col items-center">
            <div className="hero-anim inline-flex items-center gap-1.5 px-3 py-1 bg-[#E9F2FF] text-[#1868DB] rounded-full text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Multi-Branch Stock Opname System</span>
            </div>

            <h1 className="hero-anim text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] text-[#172B4D] max-w-3xl">
              Akurasi Stok Cabang <br className="hidden sm:inline" />
              Real-time ke <span className="text-[#1868DB]">Google Sheets</span>
            </h1>

            <p className="hero-anim text-[#44546F] text-base sm:text-lg max-w-xl leading-relaxed">
              Verifikasi stok fisik harian di gudang dan cabang dengan mudah.
              Laporan otomatis terkirim via PDF dan WhatsApp.
            </p>

            <div className="hero-anim pt-4">
              <Link
                href="/login"
                prefetch={false}
                className="inline-flex items-center justify-center gap-2 btn-primary px-8 py-3.5 text-sm font-semibold rounded-[4px] shadow-sm hover:bg-[#0055CC] transition-colors"
              >
                <span>Masuk ke Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="max-w-6xl mx-auto px-4 py-16 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="surface-card p-6 border border-[#DCDFE4] rounded-lg space-y-3">
              <div className="w-10 h-10 rounded bg-[#E9F2FF] text-[#1868DB] flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#172B4D]">
                Isolasi Data Cabang
              </h3>
              <p className="text-xs text-[#44546F] leading-relaxed">
                Setiap cabang memiliki database Google Sheets sendiri yang
                terisolasi dan aman untuk menjamin keandalan data.
              </p>
            </div>

            <div className="surface-card p-6 border border-[#DCDFE4] rounded-lg space-y-3">
              <div className="w-10 h-10 rounded bg-[#E3FCEF] text-[#216E4E] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#172B4D]">
                Laporan PDF Instan
              </h3>
              <p className="text-xs text-[#44546F] leading-relaxed">
                Selesai melakukan Stock Opname, laporan ringkasan dalam format
                PDF yang rapi langsung digenerate secara otomatis.
              </p>
            </div>

            <div className="surface-card p-6 border border-[#DCDFE4] rounded-lg space-y-3">
              <div className="w-10 h-10 rounded bg-[#FFF0F0] text-[#CA3521] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#172B4D]">
                Keamanan PIN 6-Digit
              </h3>
              <p className="text-xs text-[#44546F] leading-relaxed">
                Petugas melakukan login secara aman menggunakan username dan
                6-digit PIN unik untuk setiap akun operasional.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[#DCDFE4] bg-white py-6 w-full">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#44546F]">
            <span>STOKIS &copy; {new Date().getFullYear()}</span>
            <span>Operasional Gudang & Retail</span>
          </div>
        </footer>
      </main>
    );
  }

  // ==========================================
  // RENDER 2: BERANDA OPERASIONAL (SETELAH LOGIN)
  // ==========================================
  const isAdmin = user.role === "admin";

  return (
    <main ref={containerRef} className="space-y-8 max-w-5xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-[#E9F2FF] border border-[#DCDFE4] rounded-lg p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#1868DB] uppercase bg-[#E9F2FF] border border-[#1868DB]/20 px-2 py-0.5 rounded">
              {user.role}
            </span>
            {selectedCabang && (
              <span className="text-xs font-bold text-[#216E4E] uppercase bg-[#E3FCEF] border border-[#216E4E]/20 px-2 py-0.5 rounded flex items-center gap-1">
                <Store className="w-3 h-3" /> {selectedCabang.Nama_Cabang}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#172B4D]">
            Selamat Datang, {user.nama}!
          </h1>
          <p className="text-sm text-[#44546F]">
            Silakan gunakan modul di bawah untuk merekam stok, melihat laporan,
            atau mengelola data master.
          </p>
        </div>
      </div>

      {/* Cabang Selector if user has multiple branches */}
      {cabangList.length > 1 && (
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DCDFE4] pb-3">
            <Store className="w-4 h-4 text-[#1868DB]" />
            <h3 className="text-sm font-semibold text-[#172B4D]">
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
                      ? "bg-[#E9F2FF] border-[#1868DB]"
                      : "bg-white border-[#DCDFE4] hover:bg-[#F7F8F9]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-[#44546F] bg-[#F1F2F4] px-1.5 py-0.5 rounded">
                      {cabang.Cabang_ID}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1868DB]" />
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-[#172B4D] truncate">
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
        <h2 className="text-base font-bold text-[#172B4D] flex items-center gap-2">
          <Layers className="w-4.5 h-4.5 text-[#1868DB]" />
          <span>Modul Kerja Operasional</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Module 1: Input SO */}
          <Link
            href="/so/input"
            prefetch={false}
            className="surface-card p-6 hover:border-[#1868DB] transition-all duration-150 flex items-start gap-4 group"
          >
            <div className="p-3 rounded bg-[#E9F2FF] text-[#1868DB] flex-shrink-0">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#172B4D] group-hover:text-[#1868DB] transition-colors flex items-center gap-1.5">
                <span>Input Stock Opname (SO)</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
              </h3>
              <p className="text-xs text-[#44546F] leading-relaxed">
                Mulai sesi pencatatan stok fisik barang dagangan di area
                gudang/toko untuk membandingkan dengan target selisih.
              </p>
            </div>
          </Link>

          {/* Module 2: Lihat Laporan */}
          <Link
            href="/laporan"
            prefetch={false}
            className="surface-card p-6 hover:border-[#1868DB] transition-all duration-150 flex items-start gap-4 group"
          >
            <div className="p-3 rounded bg-[#E3FCEF] text-[#216E4E] flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#172B4D] group-hover:text-[#1868DB] transition-colors flex items-center gap-1.5">
                <span>Laporan & PDF</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
              </h3>
              <p className="text-xs text-[#44546F] leading-relaxed">
                Buka arsip riwayat sesi SO yang sudah selesai, unduh berkas PDF
                laporan, atau kirimkan rangkuman ke WhatsApp PIC.
              </p>
            </div>
          </Link>

          {/* Module 3: Master Item (Admin Only) */}
          {isAdmin && (
            <Link
              href="/master-item"
              prefetch={false}
              className="surface-card p-6 hover:border-[#1868DB] transition-all duration-150 flex items-start gap-4 group"
            >
              <div className="p-3 rounded bg-[#FFF0B3] text-[#B38600] flex-shrink-0">
                <Package className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#172B4D] group-hover:text-[#1868DB] transition-colors flex items-center gap-1.5">
                  <span>Database Master Item</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                </h3>
                <p className="text-xs text-[#44546F] leading-relaxed">
                  Kelola daftar barang dagangan, tentukan area peletakan
                  (rak/chiller), serta sesuaikan batas minimal (threshold)
                  kritis.
                </p>
              </div>
            </Link>
          )}

          {/* Module 4: Manajemen Pengguna (Admin Only) */}
          {isAdmin && (
            <Link
              href="/petugas"
              prefetch={false}
              className="surface-card p-6 hover:border-[#1868DB] transition-all duration-150 flex items-start gap-4 group"
            >
              <div className="p-3 rounded bg-[#DFD8FF] text-[#6554C0] flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#172B4D] group-hover:text-[#1868DB] transition-colors flex items-center gap-1.5">
                  <span>Manajemen Pengguna</span>
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0" />
                </h3>
                <p className="text-xs text-[#44546F] leading-relaxed">
                  Daftarkan akun petugas baru, ubah PIN 6-digit login, atau ubah
                  otoritas/cabang kerja masing-masing staf operasional.
                </p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Guidelines & Quick Help */}
      <div className="surface-card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-[#172B4D] flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#44546F]" />
          <span>Panduan Singkat Alur Stock Opname</span>
        </h3>
        <ol className="list-decimal list-inside text-xs text-[#44546F] space-y-2.5 leading-relaxed">
          <li>
            Pastikan nama cabang di pojok kanan atas telah sesuai dengan lokasi
            kerja Anda saat ini.
          </li>
          <li>
            Masuk ke modul{" "}
            <span className="text-[#172B4D] font-bold">Input Stock Opname</span>
            , pilih <span className="text-[#172B4D] font-bold">Shift</span>{" "}
            kerja operasional.
          </li>
          <li>
            Ketikkan jumlah stok fisik barang pada kolom yang disediakan. Sistem
            akan otomatis menghitung selisih dibanding catatan pembukuan.
          </li>
          <li>
            Tekan{" "}
            <span className="text-[#172B4D] font-bold">Submit Laporan SO</span>{" "}
            setelah seluruh data terisi dengan lengkap dan benar.
          </li>
          <li>
            Unduh laporan format{" "}
            <span className="text-[#172B4D] font-bold">PDF</span> yang muncul
            secara otomatis di tab browser baru sebagai bukti fisik.
          </li>
        </ol>
      </div>
    </main>
  );
}
