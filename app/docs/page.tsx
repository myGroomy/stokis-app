"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Rocket,
  Users,
  Layers,
  Code2,
  AlertTriangle,
  HelpCircle,
  FileText,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";
import { DocsLayout } from "@/components/docs/DocsLayout";

const sections = [
  {
    icon: BookOpen,
    title: "Introduction",
    titleEn: "Introduction",
    description: "Apa itu Stokis, masalah yang diselesaikan, dan target pengguna.",
    descriptionEn: "What is Stokis, problems it solves, and target users.",
    href: "/docs/introduction",
  },
  {
    icon: Rocket,
    title: "Getting Started",
    titleEn: "Getting Started",
    description: "Persyaratan, quick start, dan panduan setup awal.",
    descriptionEn: "Requirements, quick start, and initial setup guide.",
    href: "/docs/getting-started",
  },
  {
    icon: Users,
    title: "User Guide",
    titleEn: "User Guide",
    description: "Panduan penggunaan setiap fitur utama produk.",
    descriptionEn: "Guide to using each main product feature.",
    href: "/docs/user-guide",
  },
  {
    icon: Layers,
    title: "Product & System",
    titleEn: "Product & System",
    description: "Arsitektur produk, alur data, integrasi, dan role & permissions.",
    descriptionEn: "Product architecture, data flow, integrations, and roles & permissions.",
    href: "/docs/product",
  },
  {
    icon: Code2,
    title: "Developer Docs",
    titleEn: "Developer Docs",
    description: "Tech stack, API, struktur project, dan deployment.",
    descriptionEn: "Tech stack, API, project structure, and deployment.",
    href: "/docs/developer",
  },
  {
    icon: AlertTriangle,
    title: "Troubleshooting",
    titleEn: "Troubleshooting",
    description: "Masalah umum dan solusinya.",
    descriptionEn: "Common issues and their solutions.",
    href: "/docs/troubleshooting",
  },
  {
    icon: HelpCircle,
    title: "FAQ",
    titleEn: "FAQ",
    description: "Pertanyaan yang sering diajukan oleh pengguna.",
    descriptionEn: "Frequently asked questions by users.",
    href: "/docs/faq",
  },
  {
    icon: FileText,
    title: "Changelog",
    titleEn: "Changelog",
    description: "Riwayat perubahan versi produk.",
    descriptionEn: "Product version change history.",
    href: "/docs/changelog",
  },
];

export default function DocsIndexPage() {
  const { lang, t } = useLanguage();

  return (
    <DocsLayout>
      <div className="space-y-8">
        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            {t("Dokumentasi", "Documentation")}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-base-content leading-tight">
            {t(
              "Dokumentasi Stokis",
              "Stokis Documentation"
            )}
          </h1>
          <p className="text-sm text-base-content/60 leading-relaxed max-w-xl">
            {t(
              "Panduan lengkap untuk menggunakan Stokis — sistem stock opname multi-cabang dengan laporan otomatis XLSX & integrasi WhatsApp.",
              "Complete guide for using Stokis — multi-branch stock opname system with automatic XLSX reports & WhatsApp integration."
            )}
          </p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/docs/getting-started"
            className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
          >
            <Rocket className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-bold text-base-content">
                {t("Mulai di sini", "Start here")}
              </p>
              <p className="text-[11px] text-base-content/50">
                {t("Quick start dalam 5 menit", "Quick start in 5 minutes")}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
          <Link
            href="/docs/user-guide/stock-opname"
            className="flex items-center gap-3 p-4 rounded-xl border border-base-300 hover:border-primary/20 hover:bg-primary/5 transition-colors group"
          >
            <Users className="w-5 h-5 text-base-content/40 group-hover:text-primary flex-shrink-0 transition-colors" />
            <div className="flex-1">
              <p className="text-xs font-bold text-base-content">
                {t("Panduan SO", "SO Guide")}
              </p>
              <p className="text-[11px] text-base-content/50">
                {t("Cara mengisi Stock Opname", "How to fill Stock Opname")}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-base-content/30 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
          </Link>
        </div>

        {/* Sections grid */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-base-content">
            {t("Semua Bagian", "All Sections")}
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="flex items-start gap-3 p-4 rounded-xl border border-base-300 hover:border-primary/20 hover:bg-base-200/50 transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-base-200 group-hover:bg-primary/10 text-base-content/40 group-hover:text-primary transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-base-content group-hover:text-primary transition-colors">
                      {lang === "en" && section.titleEn
                        ? section.titleEn
                        : section.title}
                    </p>
                    <p className="text-[11px] text-base-content/50 mt-0.5">
                      {lang === "en" && section.descriptionEn
                        ? section.descriptionEn
                        : section.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-base-content/20 group-hover:text-primary mt-1 opacity-0 group-hover:opacity-100 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DocsLayout>
  );
}
