"use client";

import React from "react";
import { useAuth } from "@/lib/AuthContext";
import { usePathname } from "next/navigation";
import LoginPage from "@/app/login/page";

const PUBLIC_PATHS = ["/login", "/"];
const ADMIN_ONLY_PATHS = ["/master-item", "/petugas", "/cabang"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8F9]">
        <div className="flex flex-col items-center gap-3">
          <img
            src="/logo.jpg"
            alt="Stokis"
            className="w-12 h-12 rounded-lg shadow-sm object-cover animate-pulse"
          />
          <div className="w-5 h-5 border-2 border-[#1868DB] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // Jika path publik, izinkan akses langsung
  if (PUBLIC_PATHS.includes(pathname)) {
    // Tapi jika di /login dan user sudah masuk, alihkan ke /
    if (pathname === "/login" && user) {
      window.location.href = "/";
      return null;
    }
    return <>{children}</>;
  }

  // Jika bukan path publik dan belum login, tampilkan halaman login
  if (!user) {
    return <LoginPage />;
  }

  // Guard admin saja
  if (!isAdmin && ADMIN_ONLY_PATHS.some((p) => pathname.startsWith(p))) {
    window.location.href = "/";
    return null;
  }

  return <>{children}</>;
}
