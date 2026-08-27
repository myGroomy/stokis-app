"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCabang } from "@/lib/CabangContext";
import { useAuth } from "@/lib/AuthContext";
import {
  ClipboardCheck,
  Package,
  Users,
  Building2,
  FileText,
  BarChart3,
  Store,
  ChevronDown,
  Home,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type UserRole = "admin" | "petugas";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles?: UserRole[];
}

const bottomNavItems: NavItem[] = [
  { name: "Beranda", href: "/", icon: Home },
  { name: "Input SO", href: "/so/input", icon: ClipboardCheck },
  { name: "Laporan", href: "/laporan", icon: FileText },
  { name: "Item", href: "/master-item", icon: Package, roles: ["admin"] },
  { name: "Lainnya", href: "/cabang", icon: Building2, roles: ["admin"] },
  { name: "Keluar", href: "/logout", icon: LogOut },
];

const desktopNavItems: NavItem[] = [
  { name: "Input SO", href: "/so/input", icon: ClipboardCheck },
  { name: "Laporan", href: "/laporan", icon: FileText },
  { name: "Item", href: "/master-item", icon: Package, roles: ["admin"] },
  { name: "Petugas", href: "/petugas", icon: Users, roles: ["admin"] },
  { name: "Cabang", href: "/cabang", icon: Building2, roles: ["admin"] },
  { name: "Dashboard", href: "/dashboard/harian", icon: BarChart3 },
];

export function Navbar() {
  const pathname = usePathname();
  const { selectedCabang, cabangList, setSelectedCabang } = useCabang();
  const { user, logout } = useAuth();
  const role = user?.role || "petugas";

  const isVisible = (item: NavItem) => !item.roles || item.roles.includes(role);

  const filteredDesktop = desktopNavItems.filter(isVisible);
  const filteredBottom = bottomNavItems.filter(isVisible);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Top Header - Desktop */}
      <header className="sticky top-0 z-50 w-full bg-white border-b border-[#DCDFE4] shadow-xs">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <Link
              href="/"
              prefetch={false}
              className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
            >
              <img
                src="/favicon.jpg"
                alt="Stokis"
                className="w-8 h-8 rounded-[3px] shadow-xs object-cover"
              />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-bold text-[#172B4D] tracking-tight">
                  STOKIS
                </span>
                <span className="text-[10px] text-[#44546F] font-semibold tracking-wide uppercase mt-0.5">
                  Operasional
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {filteredDesktop.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={false}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-colors duration-150 ${
                      active
                        ? "bg-[#E9F2FF] text-[#1868DB]"
                        : "text-[#44546F] hover:text-[#172B4D] hover:bg-[#F1F2F4]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center">
              <div
                className={`flex items-center bg-[#F7F8F9] border border-[#DCDFE4] rounded-[4px] px-2 sm:px-3 py-1.5 transition-colors duration-150 max-w-[180px] sm:max-w-none ${cabangList.length > 1 ? "hover:border-[#1868DB]" : "opacity-85"}`}
              >
                <Store className="w-3.5 h-3.5 text-[#1868DB] mr-1.5 sm:mr-2 flex-shrink-0" />
                <select
                  value={selectedCabang?.Cabang_ID || ""}
                  disabled={cabangList.length <= 1}
                  onChange={(e) => {
                    const match = cabangList.find(
                      (c) => c.Cabang_ID === e.target.value,
                    );
                    if (match) setSelectedCabang(match);
                  }}
                  className={`bg-transparent text-[11px] sm:text-xs font-semibold text-[#172B4D] focus:outline-none pr-4 appearance-none border-none outline-none py-0 truncate ${cabangList.length > 1 ? "cursor-pointer" : "cursor-default"}`}
                >
                  {cabangList.length === 0 ? (
                    <option value="" className="bg-white text-[#44546F]">
                      Pilih Cabang...
                    </option>
                  ) : (
                    cabangList.map((c) => (
                      <option
                        key={c.Cabang_ID}
                        value={c.Cabang_ID}
                        className="bg-white text-[#172B4D]"
                      >
                        {c.Nama_Cabang}
                      </option>
                    ))
                  )}
                </select>
                {cabangList.length > 1 && (
                  <ChevronDown className="w-3 h-3 text-[#44546F] pointer-events-none -ml-3.5" />
                )}
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] text-[#6B778C] hover:text-[#DC3545] hover:bg-[#FFF0F0] transition-colors duration-150 ml-2"
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold hidden sm:inline">
                  Keluar
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#DCDFE4] shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around h-14 px-1">
          {filteredBottom.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isLogout = item.href === "/logout";
            return isLogout ? (
              <button
                key={item.name}
                onClick={logout}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors text-[#6B778C] hover:text-[#DC3545]`}
              >
                <div className="p-1 rounded-md">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold">{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors ${
                  active ? "text-[#1868DB]" : "text-[#6B778C]"
                }`}
              >
                <div
                  className={`p-1 rounded-md ${active ? "bg-[#E9F2FF]" : ""}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[10px] font-semibold ${
                    active ? "text-[#1868DB]" : "text-[#6B778C]"
                  }`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
