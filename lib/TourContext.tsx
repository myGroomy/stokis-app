"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { OnboardingTour } from "@/components/OnboardingTour";
import { isTourDone } from "@/lib/tour";

interface TourContextValue {
  openTour: () => void;
  closeTour: () => void;
  isTourOpen: boolean;
}

const TourContext = createContext<TourContextValue | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  const openTour = useCallback(() => setOpen(true), []);
  const closeTour = useCallback(() => setOpen(false), []);

  // Muncul otomatis pada login pertama pengguna (disimpan di localStorage).
  useEffect(() => {
    if (user && !isTourDone()) {
      // Beri sedikit jeda agar halaman selesai dirender.
      const t = window.setTimeout(() => setOpen(true), 800);
      return () => window.clearTimeout(t);
    }
  }, [user]);

  return (
    <TourContext.Provider value={{ openTour, closeTour, isTourOpen: open }}>
      {children}
      {open && <OnboardingTour onClose={closeTour} />}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used within TourProvider");
  return ctx;
}
