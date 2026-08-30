"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  ClipboardCheck,
  FileText,
  Building2,
  BarChart3,
  ShieldCheck,
  Smartphone,
  Zap,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: ClipboardCheck,
    title: "Input Cepat",
    desc: "Formulir ringkas seperti Google Form. Isi stok S1/S2 per item, langsung terhitung otomatis.",
  },
  {
    icon: FileText,
    title: "Laporan PDF & Excel",
    desc: "Generate laporan instan dengan status Kritis/Hampir Habis/Aman. Sortir otomatis, siap kirim ke WhatsApp.",
  },
  {
    icon: Building2,
    title: "Multi Cabang",
    desc: "Setiap cabang punya database terisolasi. Satu akun admin bisa akses semua cabang.",
  },
  {
    icon: BarChart3,
    title: "Dashboard Real-time",
    desc: "Pantau stok harian dan mingguan. Threshold otomatis tandai item kritis.",
  },
  {
    icon: ShieldCheck,
    title: "Aman & Terkontrol",
    desc: "PIN terenkripsi, sesi aman, validasi role. Petugas hanya bisa akses cabang sendiri.",
  },
  {
    icon: Smartphone,
    title: "Mobile Friendly",
    desc: "Operasional dari HP langsung. Tidak perlu install aplikasi, cukup buka browser.",
  },
];

const steps = [
  {
    num: "01",
    title: "Setup Cabang",
    desc: "Daftarkan cabang Anda. Setiap cabang punya item dan threshold sendiri.",
  },
  {
    num: "02",
    title: "Isi Stock Opname",
    desc: "Petugas masukkan jumlah stok aktual per item. Formulir ringkas, tidak ribet.",
  },
  {
    num: "03",
    title: "Laporan Otomatis",
    desc: "PDF dan Excel langsung jadi. Kirim ke WhatsApp atau simpan untuk audit.",
  },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/so/input");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen bg-base-100">
      {/* Nav */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-base-100/85 border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/logo.jpg"
              alt="Stokis"
              className="w-8 h-8 rounded-lg object-cover shadow-sm"
            />
            <span className="text-sm font-bold tracking-tight text-base-content">
              STOKIS
            </span>
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-content text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Masuk
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
              <Zap className="w-3 h-3" />
              Stock Opname Modern
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-base-content leading-[1.1]">
              Kelola Stok
              <br />
              <span className="text-primary">Lebih Cepat</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-base-content/60 leading-relaxed max-w-lg">
              Sistem stock opname multi cabang. Input dari HP, laporan PDF otomatis, threshold alert. Tidak ribet, tidak mahal.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-content text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
              >
                Mulai Sekarang
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#fitur"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-base-300 text-base-content/70 text-sm font-semibold transition-all hover:bg-base-200 hover:text-base-content"
              >
                Lihat Fitur
              </a>
            </div>
          </div>

          {/* Hero visual: mockup ringkas */}
          <div className="mt-12 md:mt-16 relative">
            <div className="rounded-xl border border-base-300 bg-base-200/50 p-4 md:p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-error/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-success/60" />
                <span className="ml-2 text-xs font-semibold text-base-content/40">
                  stokis.app
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {[
                  { label: "Kritis", value: "3", color: "bg-error/10 text-error border-error/20" },
                  { label: "Hampir Habis", value: "7", color: "bg-warning/10 text-warning border-warning/20" },
                  { label: "Aman", value: "42", color: "bg-success/10 text-success border-success/20" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className={`rounded-lg border p-3 md:p-4 text-center ${s.color}`}
                  >
                    <div className="text-2xl md:text-3xl font-bold">{s.value}</div>
                    <div className="text-xs font-semibold mt-1 opacity-70">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { name: "Minyak Goreng 2L", qty: "2", threshold: "10", status: "Kritis" },
                  { name: "Tepung Terigu 1kg", qty: "8", threshold: "15", status: "Hampir Habis" },
                  { name: "Gula Pasir 1kg", qty: "24", threshold: "10", status: "Aman" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-base-100 border border-base-300 text-xs"
                  >
                    <span className="font-semibold text-base-content truncate mr-2">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-base-content/50">
                        {item.qty}/{item.threshold}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "Kritis"
                            ? "bg-error/10 text-error"
                            : item.status === "Hampir Habis"
                            ? "bg-warning/10 text-warning"
                            : "bg-success/10 text-success"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 md:py-24 border-t border-base-300">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-base-content">
            Cara Kerja
          </h2>
          <p className="mt-2 text-sm text-base-content/50 max-w-md">
            Tiga langkah sederhana dari awal sampai laporan jadi.
          </p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.num} className="relative">
                <div className="text-5xl font-bold text-base-content/[0.06] leading-none">
                  {step.num}
                </div>
                <h3 className="mt-3 text-base font-bold text-base-content">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm text-base-content/55 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" className="py-16 md:py-24 border-t border-base-300 bg-base-200/40">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-base-content">
            Fitur Utama
          </h2>
          <p className="mt-2 text-sm text-base-content/50 max-w-md">
            Dirancang untuk operasional gudang yang butuh kecepatan, bukan birokrasi.
          </p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-base-300 bg-base-100 p-5 transition-all hover:shadow-md hover:border-primary/20"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <h3 className="mt-3.5 text-sm font-bold text-base-content">
                    {f.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-base-content/55 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Stokis */}
      <section className="py-16 md:py-24 border-t border-base-300">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-base-content">
                Kenapa Stokis?
              </h2>
              <p className="mt-3 text-sm text-base-content/55 leading-relaxed max-w-md">
                Spreadsheet manual itu lambat. Software mahal itu ribet. Stokis hadir di tengahnya: cukup HP, cukup browser, langsung jalan.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Gratis untuk satu cabang",
                  "Tidak perlu install aplikasi",
                  "Data tersimpan di Google Sheets Anda",
                  "Laporan PDF & Excel siap kirim",
                  "Threshold alert otomatis",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                    <span className="text-sm text-base-content/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-base-300 bg-base-200/50 p-6">
              <div className="space-y-4">
                {[
                  { label: "Waktu input per SO", value: "< 10 menit", bar: "w-[15%]" },
                  { label: "Waktu generate laporan", value: "< 5 detik", bar: "w-[8%]" },
                  { label: "Biaya setup", value: "Gratis", bar: "w-[5%]" },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-base-content/60">
                        {m.label}
                      </span>
                      <span className="font-bold text-primary">{m.value}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-base-300 overflow-hidden">
                      <div className={`h-full rounded-full bg-primary ${m.bar}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 border-t border-base-300 bg-primary">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-content">
            Siap Kelola Stok Lebih Baik?
          </h2>
          <p className="mt-3 text-sm text-primary-content/70 max-w-md mx-auto">
            Mulai sekarang. Gratis untuk satu cabang, tidak perlu kartu kredit.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-base-100 text-primary text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg"
          >
            Mulai Gratis
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-base-300">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/logo.jpg"
              alt="Stokis"
              className="w-5 h-5 rounded object-cover"
            />
            <span className="text-xs font-semibold text-base-content/40">
              Stokis &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs font-semibold text-base-content/40 hover:text-primary transition-colors"
            >
              Masuk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
