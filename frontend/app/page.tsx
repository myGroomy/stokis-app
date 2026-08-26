"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useCabang } from "@/lib/CabangContext";
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
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  const { cabangList, selectedCabang, setSelectedCabang, loading } =
    useCabang();

  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const bentoRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const heroTl = gsap.timeline();
      heroTl.fromTo(
        ".hero-title-word",
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power4.out" },
      );
      heroTl.fromTo(
        ".hero-desc",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
        "-=0.6",
      );
      heroTl.fromTo(
        ".hero-btn",
        { scale: 0.9, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
        },
        "-=0.4",
      );

      gsap.to(".marquee-track", {
        xPercent: -50,
        ease: "none",
        duration: 20,
        repeat: -1,
      });

      gsap.fromTo(
        ".bento-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: bentoRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        },
      );

      const revealWords = revealRef.current?.querySelectorAll(".reveal-word");
      if (revealWords && revealWords.length > 0) {
        gsap.fromTo(
          revealWords,
          { opacity: 0.15 },
          {
            opacity: 1,
            stagger: 0.1,
            scrollTrigger: {
              trigger: revealRef.current,
              start: "top 75%",
              end: "bottom 45%",
              scrub: true,
            },
          },
        );
      }

      gsap.fromTo(
        ctaRef.current,
        { scale: 0.95, opacity: 0.8 },
        {
          scale: 1,
          opacity: 1,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 90%",
            end: "top 50%",
            scrub: true,
          },
        },
      );
    },
    { scope: containerRef },
  );

  return (
    <main ref={containerRef} className="overflow-x-hidden w-full max-w-full">
      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-[75vh] flex flex-col items-center justify-center text-center py-20 md:py-32 overflow-hidden bg-white border-b border-[#DCDFE4]"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#E9F2FF] to-transparent pointer-events-none opacity-50" />

        <div className="relative z-10 space-y-8 max-w-6xl px-4 flex flex-col items-center">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.1] text-[#172B4D] max-w-5xl">
            <span className="inline-block overflow-hidden">
              <span className="hero-title-word inline-block">Akurasi Stok</span>
            </span>{" "}
            <span className="inline-block overflow-hidden">
              <span className="hero-title-word inline-block">Tanpa Batas,</span>
            </span>
            <br />
            <span className="inline-block overflow-hidden">
              <span className="hero-title-word inline-block">Terintegrasi</span>
            </span>{" "}
            <span
              className="inline-block w-16 h-7 sm:w-28 sm:h-12 rounded-lg align-middle bg-cover bg-center mx-2 border border-[#DCDFE4] shadow-sm"
              style={{
                backgroundImage: `url('https://picsum.photos/seed/dashboard/400/200')`,
              }}
            />{" "}
            <span className="inline-block overflow-hidden">
              <span className="hero-title-word inline-block text-[#1868DB]">ke Sheets</span>
            </span>
          </h1>

          <p className="hero-desc text-[#44546F] text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed">
            Sistem Stock Opname Multi Cabang cerdas. Hubungkan data gudang ke
            Google Sheets secara otomatis tanpa server database mandiri.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <Link
              href="#bento-dashboard"
              className="hero-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-primary px-6 py-3 text-sm"
            >
              <span>Mulai Stock Opname</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/cabang"
              className="hero-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 btn-default px-6 py-3 text-sm"
            >
              <span>Administrasi Cabang</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Infinite Marquee Section */}
      <section
        ref={marqueeRef}
        className="border-b border-[#DCDFE4] bg-[#F7F8F9] py-4 overflow-hidden w-full select-none"
      >
        <div className="flex whitespace-nowrap overflow-hidden">
          <div className="marquee-track flex gap-12 text-xs font-bold tracking-wider text-[#44546F] uppercase">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-12 items-center flex-shrink-0">
                <span>STOKIS OPERASIONAL</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#1868DB]" />
                <span>GOOGLE SHEETS INTEGRATION</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#1868DB]" />
                <span>AUTOMATIC PDF SYSTEM</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#1868DB]" />
                <span>WHATSAPP REPORTS</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#1868DB]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-16 md:h-24" />

      {/* Bento Grid Section */}
      <section
        id="bento-dashboard"
        ref={bentoRef}
        className="max-w-6xl mx-auto px-4 space-y-6"
      >
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#172B4D] tracking-tight">
            Pusat Kendali Sistem
          </h2>
          <p className="text-[#44546F] text-sm">
            Pilih cabang aktif dan luncurkan modul kerja yang diinginkan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 grid-flow-dense">
          {/* Card 1: Cabang Selector */}
          <div className="bento-card md:col-span-2 md:row-span-2 surface-card p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#DCDFE4] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded bg-[#E9F2FF] text-[#1868DB]">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#172B4D]">
                      Pilih Cabang Kerja
                    </h3>
                    <p className="text-[#44546F] text-xs mt-0.5">
                      Sesi pencatatan akan terisolasi ke database cabang terpilih
                    </p>
                  </div>
                </div>
                <span className="lozenge lozenge-default">
                  {cabangList.length} Terdaftar
                </span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[1, 2, 4].map((i) => (
                    <div
                      key={i}
                      className="h-20 bg-[#F1F2F4] rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : cabangList.length === 0 ? (
                <div className="text-center py-10 space-y-3 bg-[#F7F8F9] border border-[#DCDFE4] rounded-lg">
                  <Store className="w-8 h-8 text-[#44546F] mx-auto" />
                  <p className="text-[#44546F] text-sm max-w-xs mx-auto">
                    Database kosong. Daftarkan cabang baru di administrasi.
                  </p>
                  <Link
                    href="/cabang"
                    className="inline-flex items-center gap-1.5 btn-primary px-4 py-2 text-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Tambah Cabang</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 max-h-[300px] overflow-y-auto pr-1">
                  {cabangList.map((cabang) => {
                    const isSelected =
                      selectedCabang?.Cabang_ID === cabang.Cabang_ID;
                    return (
                      <button
                        key={cabang.Cabang_ID}
                        onClick={() => setSelectedCabang(cabang)}
                        className={`text-left p-4 rounded border transition-colors flex flex-col justify-between gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-[#E9F2FF] border-[#1868DB]"
                            : "bg-white border-[#DCDFE4] hover:bg-[#F7F8F9]"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-bold text-[#44546F] bg-[#F1F2F4] px-2 py-0.5 rounded">
                            {cabang.Cabang_ID}
                          </span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-[#1868DB]" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-[#172B4D] truncate">
                            {cabang.Nama_Cabang}
                          </h4>
                          {cabang.Alamat && (
                            <p className="text-xs text-[#44546F] truncate mt-0.5">
                              {cabang.Alamat}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2 border-t border-[#DCDFE4]">
                          <span className="text-[#44546F]">
                            PIC: {cabang.PIC_Nama || "—"}
                          </span>
                          <span
                            className={`font-medium ${isSelected ? "text-[#1868DB]" : "text-[#44546F]"}`}
                          >
                            {isSelected ? "Terpilih" : "Gunakan"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedCabang && (
              <div className="mt-6 p-4 bg-[#F7F8F9] border border-[#DCDFE4] rounded flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-[#44546F] font-bold uppercase tracking-wide">
                    Cabang Aktif
                  </span>
                  <p className="text-sm font-semibold text-[#172B4D]">
                    {selectedCabang.Nama_Cabang}
                  </p>
                </div>
                <Link
                  href="/so/input"
                  className="inline-flex items-center gap-1.5 btn-primary px-4 py-2 text-sm"
                >
                  <span>Mulai Input</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Card 2: Quick System Stats */}
          <div className="bento-card md:col-span-1 md:row-span-1 surface-card p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-[#E9F2FF] text-[#1868DB] rounded">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-[#44546F] uppercase tracking-widest">
                  Database
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#44546F]">
                  Total Cabang Terhubung
                </h4>
                <div className="text-3xl font-semibold text-[#172B4D] mt-1 tabular-nums">
                  {cabangList.length}
                </div>
              </div>
            </div>
            <div className="text-xs text-[#44546F] font-medium pt-3 border-t border-[#DCDFE4] flex items-center gap-1.5 mt-4">
              <RefreshCw className="w-3.5 h-3.5 text-[#1868DB]" />
              <span>Sinkronisasi otomatis dengan Drive</span>
            </div>
          </div>

          {/* Card 3: Google Sheets Database Sync Card */}
          <div className="bento-card md:col-span-1 md:row-span-1 surface-card p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2 bg-[#E3FCEF] text-[#216E4E] rounded">
                  <Database className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-[#44546F] uppercase tracking-widest">
                  Sistem
                </span>
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#44546F]">
                  Status Server Integration
                </h4>
                <div className="text-3xl font-semibold text-[#216E4E] mt-1 flex items-center gap-2">
                  <span>Aktif</span>
                  <span className="w-2.5 h-2.5 bg-[#22A06B] rounded-full inline-block" />
                </div>
              </div>
            </div>
            <div className="text-xs text-[#44546F] font-medium pt-3 border-t border-[#DCDFE4] mt-4">
              <span>Menggunakan Google Apps Script API</span>
            </div>
          </div>

          {/* Card 4: Operational Shortcuts */}
          <div className="bento-card md:col-span-3 md:row-span-1 surface-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1 max-w-md">
              <h3 className="text-base font-semibold text-[#172B4D] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1868DB]" />
                <span>Modul Kerja Sistem</span>
              </h3>
              <p className="text-[#44546F] text-sm">
                Pilih modul kerja di bawah untuk mengelola barang, laporan, staf, dan pemantauan.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full sm:w-auto">
              {[
                { name: "Input SO", desc: "Form opname", icon: ClipboardCheck, href: "/so/input" },
                { name: "Laporan", desc: "PDF & WA", icon: FileText, href: "/laporan" },
                { name: "Master Item", desc: "Database stok", icon: Package, href: "/master-item" },
                { name: "Petugas", desc: "Kontak staf", icon: Users, href: "/petugas" },
              ].map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="p-4 bg-white hover:bg-[#F7F8F9] border border-[#DCDFE4] rounded flex flex-col gap-2 transition-colors group/item"
                >
                  <item.icon className="w-5 h-5 text-[#1868DB]" />
                  <div>
                    <h4 className="text-sm font-semibold text-[#172B4D] group-hover/item:text-[#1868DB] transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-[10px] text-[#44546F] mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="h-16 md:h-24" />

      {/* Desire Section */}
      <section
        ref={revealRef}
        className="max-w-4xl mx-auto px-4 text-center py-16"
      >
        <h3 className="text-xl sm:text-2xl md:text-3xl font-medium leading-relaxed text-[#172B4D]">
          {`Aplikasi ini dirancang untuk mempercepat verifikasi stok fisik secara langsung. Setiap kata, baris, dan file disimpan di dalam cloud storage cabang Anda, memberikan privasi penuh serta transparansi operasional harian.`
            .split(" ")
            .map((word, idx) => (
              <span
                key={idx}
                className="reveal-word inline-block mr-1.5 text-[#172B4D]"
              >
                {word}
              </span>
            ))}
        </h3>
      </section>

      <div className="h-16 md:h-24" />

      {/* Action Section (CTA Box) */}
      <section ref={ctaRef} className="max-w-6xl mx-auto px-4 mb-24">
        <div className="bg-[#1868DB] rounded-lg p-8 md:p-16 text-center space-y-8 relative overflow-hidden">
          <div className="space-y-3 max-w-2xl mx-auto z-10 relative">
            <h2 className="text-2xl sm:text-4xl font-semibold text-white tracking-tight">
              Siap Meningkatkan Akurasi Stok?
            </h2>
            <p className="text-[#E9F2FF] text-sm sm:text-base">
              Kelola database stok opname harian cabang Anda secara otomatis
              melalui Google Sheets dan terima notifikasi laporan PDF langsung
              ke WhatsApp.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 z-10 relative">
            {selectedCabang ? (
              <Link
                href="/so/input"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#172B4D] font-medium text-sm px-6 py-3 rounded shadow hover:bg-[#F7F8F9] transition-colors"
              >
                <span>Input Stock Opname</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <a
                href="#bento-dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-[#172B4D] font-medium text-sm px-6 py-3 rounded shadow hover:bg-[#F7F8F9] transition-colors"
              >
                <span>Pilih Cabang Terlebih Dahulu</span>
                <Store className="w-4 h-4" />
              </a>
            )}
            <Link
              href="/cabang"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent text-white border border-[#E9F2FF] hover:bg-[#0055CC] font-medium text-sm px-6 py-3 rounded transition-colors"
            >
              <span>Administrasi Cabang</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#DCDFE4] bg-white py-6">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-[#44546F]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1868DB]" />
            <span>STOKIS — Google Sheets Auto Sync</span>
          </div>
          <div>
            <span>Sistem Operasional Stok Multi Cabang</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
