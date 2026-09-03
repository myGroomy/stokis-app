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
    <nav className="flex items-center justify-between pt-8 mt-8 border-t border-base-300">
      {prev ? (
        <Link
          href={prev.href}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-base-300 hover:border-primary/30 hover:bg-primary/5 transition-colors group flex-1 max-w-xs"
        >
          <ChevronLeft className="w-4 h-4 text-base-content/40 group-hover:text-primary transition-colors" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/40">
              {lang === "en" ? "Previous" : "Sebelumnya"}
            </p>
            <p className="text-xs font-semibold text-base-content group-hover:text-primary transition-colors">
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
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-base-300 hover:border-primary/30 hover:bg-primary/5 transition-colors group flex-1 max-w-xs text-right justify-end"
        >
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-base-content/40">
              {lang === "en" ? "Next" : "Selanjutnya"}
            </p>
            <p className="text-xs font-semibold text-base-content group-hover:text-primary transition-colors">
              {lang === "en" && next.labelEn ? next.labelEn : next.label}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-base-content/40 group-hover:text-primary transition-colors" />
        </Link>
      ) : (
        <div />
      )}
    </nav>
  );
}
