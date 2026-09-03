"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import {
  BookOpen,
  Rocket,
  Users,
  Layers,
  Code2,
  AlertTriangle,
  HelpCircle,
  FileText,
  ChevronDown,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface SidebarItem {
  label: string;
  labelEn?: string;
  href: string;
  icon?: LucideIcon;
  children?: SidebarItem[];
}

const sidebarItems: SidebarItem[] = [
  {
    label: "Introduction",
    href: "/docs/introduction",
    icon: BookOpen,
  },
  {
    label: "Getting Started",
    href: "/docs/getting-started",
    icon: Rocket,
  },
  {
    label: "User Guide",
    href: "/docs/user-guide",
    icon: Users,
    children: [
      { label: "Stock Opname (SO)", href: "/docs/user-guide/stock-opname" },
      { label: "Laporan", href: "/docs/user-guide/laporan" },
      { label: "Dashboard", href: "/docs/user-guide/dashboard" },
      { label: "Master Item", href: "/docs/user-guide/master-item" },
      { label: "Cabang", href: "/docs/user-guide/cabang" },
      { label: "Petugas", href: "/docs/user-guide/petugas" },
    ],
  },
  {
    label: "Product & System",
    href: "/docs/product",
    icon: Layers,
  },
  {
    label: "Developer Docs",
    href: "/docs/developer",
    icon: Code2,
  },
  {
    label: "Troubleshooting",
    href: "/docs/troubleshooting",
    icon: AlertTriangle,
  },
  {
    label: "FAQ",
    href: "/docs/faq",
    icon: HelpCircle,
  },
  {
    label: "Changelog",
    href: "/docs/changelog",
    icon: FileText,
  },
];

interface DocsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DocsSidebar({ isOpen, onClose }: DocsSidebarProps) {
  const pathname = usePathname();
  const { lang, t } = useLanguage();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const active = sidebarItems.find(
      (item) =>
        item.children?.some((child) => pathname.startsWith(child.href)) ||
        pathname.startsWith(item.href)
    );
    return active ? [active.href] : [];
  });

  const toggleGroup = (href: string) => {
    setExpandedGroups((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === "/docs") return pathname === "/docs";
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isGroupExpanded = (href: string) => expandedGroups.includes(href);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-72 bg-base-100 border-r border-base-300 transform transition-transform duration-200 ease-out lg:sticky lg:top-[60px] lg:h-[calc(100vh-60px)] lg:z-10 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 lg:hidden border-b border-base-300">
          <span className="text-sm font-bold text-base-content">
            {t("Dokumentasi", "Documentation")}
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-base-200 text-base-content/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="p-3 space-y-0.5 overflow-y-auto h-[calc(100%-60px)] lg:h-full">
          {/* Docs home link */}
          <Link
            href="/docs"
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors mb-2 ${
              pathname === "/docs"
                ? "bg-primary/10 text-primary"
                : "text-base-content/60 hover:bg-base-200 hover:text-base-content"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{t("Overview", "Overview")}</span>
          </Link>

          <div className="h-px bg-base-300 my-2" />

          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const active = isActive(item.href);
            const expanded = isGroupExpanded(item.href);

            if (hasChildren) {
              return (
                <div key={item.href}>
                  <button
                    onClick={() => toggleGroup(item.href)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-base-content/60 hover:bg-base-200 hover:text-base-content"
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                    <span className="flex-1 text-left">
                      {lang === "en" && item.labelEn ? item.labelEn : item.label}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        expanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {expanded && (
                    <div className="ml-4 pl-3 border-l border-base-300 space-y-0.5 mt-0.5 mb-1">
                      {item.children!.map((child) => {
                        const childActive = isActive(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              childActive
                                ? "bg-primary/10 text-primary font-semibold"
                                : "text-base-content/50 hover:bg-base-200 hover:text-base-content"
                            }`}
                          >
                            <span>
                              {lang === "en" && child.labelEn
                                ? child.labelEn
                                : child.label}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-base-content/60 hover:bg-base-200 hover:text-base-content"
                }`}
              >
                {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
                <span>
                  {lang === "en" && item.labelEn ? item.labelEn : item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
