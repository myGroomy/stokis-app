"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsTOC } from "@/components/docs/DocsTOC";
import { DocsSearch } from "@/components/docs/DocsSearch";
import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";

interface DocsLayoutProps {
  children: React.ReactNode;
  tocItems?: { id: string; label: string; labelEn?: string; level: number }[];
}

export function DocsLayout({ children, tocItems = [] }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-base-100">
      {/* Docs header bar */}
      <div className="sticky top-[60px] z-30 bg-base-100/90 backdrop-blur-md border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-base-200 text-base-content/60"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="flex items-center gap-1 text-[11px] text-base-content/40">
            <Link href="/docs" className="hover:text-primary transition-colors">
              {t("Docs", "Docs")}
            </Link>
            {pathname !== "/docs" && (
              <>
                <span>/</span>
                <span className="text-base-content/60 font-medium truncate max-w-[200px]">
                  {pathname
                    .replace("/docs/", "")
                    .split("/")
                    .map((s) =>
                      s
                        .replace(/-/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())
                    )
                    .join(" / ")}
                </span>
              </>
            )}
          </nav>

          <div className="ml-auto">
            <DocsSearch onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      </div>

      <div className="flex max-w-7xl mx-auto">
        <DocsSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 min-w-0 flex">
          <article className="flex-1 min-w-0 px-6 py-8 lg:px-10 max-w-3xl">
            {children}
          </article>
          <DocsTOC items={tocItems} />
        </div>
      </div>
    </div>
  );
}
