"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, BookOpen, ExternalLink } from "lucide-react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsTOC } from "@/components/docs/DocsTOC";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";

interface DocsLayoutProps {
  children: React.ReactNode;
  tocItems?: { id: string; label: string; labelEn?: string; level: number }[];
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const segments = pathname.replace("/docs", "").split("/").filter(Boolean);
  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-[11px] text-base-content/40">
      <span className="text-base-content/30">/</span>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const label = seg
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        return (
          <span key={i} className="flex items-center gap-1.5">
            <span
              className={
                isLast
                  ? "text-base-content/70 font-medium"
                  : "text-base-content/40"
              }
            >
              {label}
            </span>
            {!isLast && <span className="text-base-content/20">/</span>}
          </span>
        );
      })}
    </nav>
  );
}

export function DocsLayout({ children, tocItems = [] }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-base-100">
      {/* Docs top bar */}
      <div className="sticky top-[60px] z-20 bg-base-100/80 backdrop-blur-lg border-b border-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-11 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 -ml-1.5 rounded-lg hover:bg-base-200 text-base-content/50 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t("Docs", "Docs")}</span>
            </Link>
            <Breadcrumb pathname={pathname} />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <DocsSearch onClose={() => setSidebarOpen(false)} />
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-base-content/40 hover:text-base-content/70 hover:bg-base-200 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{t("Kembali ke App", "Back to App")}</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        <DocsSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 min-w-0 flex">
          <main className="flex-1 min-w-0 px-5 py-8 sm:px-8 lg:px-12 max-w-3xl">
            {children}
          </main>
          <DocsTOC items={tocItems} />
        </div>
      </div>
    </div>
  );
}
