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
      <header
        className="sticky top-0 z-50 w-full backdrop-blur-md"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-surface) 85%, transparent)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-[60px]">
            {/* Logo */}
            <Link
              href="/"
              prefetch={false}
              className="flex items-center gap-2.5 group transition-opacity hover:opacity-90"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
              >
                S
              </div>
              <div className="flex flex-col leading-none">
                <span
                  className="text-sm font-bold tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  STOKIS
                </span>
                <span
                  className="text-[10px] font-semibold tracking-wide uppercase mt-0.5"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  Operasional
                </span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {filteredDesktop.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    prefetch={false}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150"
                    style={{
                      backgroundColor: active ? 'var(--color-primary-subtle)' : 'transparent',
                      color: active ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)';
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Branch Selector */}
              <div
                className="flex items-center rounded-md px-2.5 py-1.5 transition-colors duration-150 max-w-[160px] sm:max-w-none"
                style={{
                  backgroundColor: 'var(--color-surface-sunken)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Store className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
                <select
                  value={selectedCabang?.Cabang_ID || ""}
                  disabled={cabangList.length <= 1}
                  onChange={(e) => {
                    const match = cabangList.find((c) => c.Cabang_ID === e.target.value);
                    if (match) setSelectedCabang(match);
                  }}
                  className="bg-transparent text-xs font-semibold focus:outline-none pr-3 appearance-none border-none outline-none py-0 truncate cursor-pointer"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {cabangList.length === 0 ? (
                    <option value="">Pilih Cabang...</option>
                  ) : (
                    cabangList.map((c) => (
                      <option key={c.Cabang_ID} value={c.Cabang_ID}>
                        {c.Nama_Cabang}
                      </option>
                    ))
                  )}
                </select>
                {cabangList.length > 1 && (
                  <ChevronDown className="w-3 h-3 pointer-events-none -ml-2" style={{ color: 'var(--color-text-tertiary)' }} />
                )}
              </div>

              {/* Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors duration-150"
                style={{ color: 'var(--color-text-tertiary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-danger)';
                  e.currentTarget.style.backgroundColor = 'var(--color-danger-subtle)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-tertiary)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div className="flex items-center justify-around h-16 px-1 safe-area-pb">
          {filteredBottom.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const isLogout = item.href === "/logout";
            return isLogout ? (
              <button
                key={item.name}
                onClick={logout}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <div className="p-1.5 rounded-lg">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-semibold">{item.name}</span>
              </button>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors"
                style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
              >
                <div
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ backgroundColor: active ? 'var(--color-primary-subtle)' : 'transparent' }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-tertiary)' }}
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
