"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/LanguageContext";

interface PageNavItem {
  href: string;
  label: string;
  labelEn?: string;
}

interface DocsPageNavProps {
  prev?: PageNavItem;
  next?: PageNavItem;
}

export function DocsPageNav({ prev, next }: DocsPageNavProps) {
  const { lang } = useLanguage();

  return (
    <nav className="flex items-stretch justify-between gap-3 pt-8 mt-8 border-t border-base-200">
      {prev ? (
        <Link
          href={prev.href}
          className="flex-1 flex items-center gap-2 px-3 sm:px-4 py-3 rounded-xl border border-base-200 hover:border-primary/20 hover:bg-base-200/30 transition-all group min-w-0"
        >
          <ChevronLeft className="w-4 h-4 text-base-content/30 group-hover:text-primary flex-shrink-0 transition-colors" />
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wider text-base-content/30">
              {lang === "en" ? "Previous" : "Sebelumnya"}
            </p>
            <p className="text-xs font-medium text-base-content/70 group-hover:text-primary truncate transition-colors">
              {lang === "en" && prev.labelEn ? prev.labelEn : prev.label}
            </p>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          href={next.href}
          className="flex-1 flex items-center gap-2 px-3 sm:px-4 py-3 rounded-xl border border-base-200 hover:border-primary/20 hover:bg-base-200/30 transition-all group text-right min-w-0"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-medium uppercase tracking-wider text-base-content/30">
              {lang === "en" ? "Next" : "Selanjutnya"}
            </p>
            <p className="text-xs font-medium text-base-content/70 group-hover:text-primary truncate transition-colors">
              {lang === "en" && next.labelEn ? next.labelEn : next.label}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-base-content/30 group-hover:text-primary flex-shrink-0 transition-colors" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
