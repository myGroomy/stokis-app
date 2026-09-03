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
} from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

const sections = [
  {
    icon: BookOpen,
    title: "Introduction",
    description: "Apa itu Stokis, masalah yang diselesaikan, dan target pengguna.",
    descriptionEn: "What is Stokis, problems it solves, and target users.",
    href: "/docs/introduction",
  },
  {
    icon: Rocket,
    title: "Getting Started",
    description: "Persyaratan, quick start, dan panduan setup awal.",
    descriptionEn: "Requirements, quick start, and initial setup guide.",
    href: "/docs/getting-started",
  },
  {
    icon: Users,
    title: "User Guide",
    description: "Panduan penggunaan setiap fitur utama produk.",
    descriptionEn: "Guide to using each main product feature.",
    href: "/docs/user-guide",
  },
  {
    icon: Layers,
    title: "Product & System",
    description: "Arsitektur produk, alur data, integrasi, dan role & permissions.",
    descriptionEn: "Product architecture, data flow, integrations, and roles & permissions.",
    href: "/docs/product",
  },
  {
    icon: Code2,
    title: "Developer Docs",
    description: "Tech stack, API, struktur project, dan deployment.",
    descriptionEn: "Tech stack, API, project structure, and deployment.",
    href: "/docs/developer",
  },
  {
    icon: AlertTriangle,
    title: "Troubleshooting",
    description: "Masalah umum dan solusinya.",
    descriptionEn: "Common issues and their solutions.",
    href: "/docs/troubleshooting",
  },
  {
    icon: HelpCircle,
    title: "FAQ",
    description: "Pertanyaan yang sering diajukan oleh pengguna.",
    descriptionEn: "Frequently asked questions by users.",
    href: "/docs/faq",
  },
  {
    icon: FileText,
    title: "Changelog",
    description: "Riwayat perubahan versi produk.",
    descriptionEn: "Product version change history.",
    href: "/docs/changelog",
  },
];

export default function DocsIndexPage() {
  const { lang, t } = useLanguage();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
          {t("Dokumentasi Stokis", "Stokis Documentation")}
        </h1>
        <p className="text-sm text-base-content/50 leading-relaxed max-w-lg">
          {t(
            "Panduan lengkap menggunakan Stokis — sistem stock opname multi-cabang dengan laporan otomatis & integrasi WhatsApp.",
            "Complete guide for using Stokis — multi-branch stock opname system with automatic reports & WhatsApp integration."
          )}
        </p>
      </div>

      {/* Quick start */}
      <Link
        href="/docs/getting-started"
        className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
      >
        <Rocket className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">
            {t("Mulai di sini", "Start here")}
          </p>
          <p className="text-xs text-base-content/50 mt-0.5">
            {t("Quick start dalam 5 menit", "Quick start in 5 minutes")}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Sections */}
      <div className="space-y-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-start gap-3 p-4 rounded-xl border border-base-200 hover:border-primary/20 hover:bg-base-200/30 transition-all group"
            >
              <div className="p-2 rounded-lg bg-base-200 group-hover:bg-primary/10 text-base-content/30 group-hover:text-primary transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-base-content group-hover:text-primary transition-colors">
                  {section.title}
                </p>
                <p className="text-xs text-base-content/45 mt-0.5 leading-relaxed">
                  {lang === "en" && section.descriptionEn
                    ? section.descriptionEn
                    : section.description}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-base-content/15 group-hover:text-primary/60 mt-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
