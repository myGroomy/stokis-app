"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCabang } from "@/lib/CabangContext";
import {
  ClipboardCheck,
  Package,
  Users,
  Building2,
  FileText,
  BarChart3,
  Store,
  ChevronDown,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { selectedCabang, cabangList, setSelectedCabang } = useCabang();

  const navItems = [
    { name: "Input SO", href: "/so/input", icon: ClipboardCheck },
    { name: "Laporan", href: "/laporan", icon: FileText },
    { name: "Item", href: "/master-item", icon: Package },
    { name: "Petugas", href: "/petugas", icon: Users },
    { name: "Cabang", href: "/cabang", icon: Building2 },
    { name: "Dashboard", href: "/dashboard/harian", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#DCDFE4] shadow-xs">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
          >
            <div className="w-8 h-8 bg-[#1868DB] rounded-[3px] flex items-center justify-center shadow-xs">
              <ClipboardCheck className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-[#172B4D] tracking-tight">
                STOKIS
              </span>
              <span className="text-[10px] text-[#44546F] font-semibold tracking-wide uppercase mt-0.5">
                Operasional
              </span>
            </div>
          </Link>

          {/* Center: Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-xs font-semibold transition-colors duration-150 ${
                    isActive
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

          {/* Right: Cabang Selector */}
          <div className="hidden sm:flex items-center">
            <div className="flex items-center bg-[#F7F8F9] border border-[#DCDFE4] hover:border-[#1868DB] rounded-[4px] px-3 py-1.5 transition-colors duration-150">
              <Store className="w-3.5 h-3.5 text-[#1868DB] mr-2 flex-shrink-0" />
              <select
                value={selectedCabang?.Cabang_ID || ""}
                onChange={(e) => {
                  const match = cabangList.find(
                    (c) => c.Cabang_ID === e.target.value,
                  );
                  if (match) setSelectedCabang(match);
                }}
                className="bg-transparent text-xs font-medium text-[#172B4D] focus:outline-none cursor-pointer pr-5 appearance-none border-none outline-none py-0"
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
              <ChevronDown className="w-3 h-3 text-[#44546F] pointer-events-none -ml-4" />
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden flex items-center gap-1 pb-2.5 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#E9F2FF] text-[#1868DB]"
                    : "text-[#44546F] bg-[#F7F8F9] border border-[#DCDFE4]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
