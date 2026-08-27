"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type UserRole = "admin" | "petugas";

interface User {
  username: string;
  nama: string;
  role: UserRole;
  cabangId: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("stokis_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("stokis_user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, pin: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, pin }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        localStorage.setItem("stokis_user", JSON.stringify(data.data));
        return { success: true };
      }
      return { success: false, error: data.error?.message || "Username atau PIN salah" };
    } catch (err: any) {
      return { success: false, error: "Gagal terhubung ke server: " + err.message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("stokis_user");
  };

  const hasAnyRole = (roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasAnyRole, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
