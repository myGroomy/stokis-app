"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "./AuthContext";

export interface Cabang {
  Cabang_ID: string;
  Nama_Cabang: string;
  Alamat?: string;
  Spreadsheet_ID?: string;
  Folder_Drive_ID?: string;
  PIC_Nama?: string;
  Nomor_WA_Cabang?: string;
  Aktif: boolean;
}

interface CabangContextType {
  selectedCabang: Cabang | null;
  setSelectedCabang: (c: Cabang | null) => void;
  cabangList: Cabang[]; // Ini akan mengembalikan cabangList yang sudah difilter
  allCabangList: Cabang[]; // Menyimpan semua cabang dari API (untuk kebutuhan admin global)
  loading: boolean;
  refreshCabangList: () => Promise<void>;
}

const CabangContext = createContext<CabangContextType>({
  selectedCabang: null,
  setSelectedCabang: () => {},
  cabangList: [],
  allCabangList: [],
  loading: true,
  refreshCabangList: async () => {},
});

export function CabangProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [selectedCabang, setSelectedCabangState] = useState<Cabang | null>(
    null,
  );
  const [allCabangs, setAllCabangs] = useState<Cabang[]>([]);
  const [filteredCabangs, setFilteredCabangs] = useState<Cabang[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const initialized = useRef(false);

  const fetchCabangList = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/cabang");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAllCabangs(json.data);
      }
    } catch (e) {
      console.error("Error fetching cabang list:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchCabangList();
  }, []);

  // Filter cabang berdasarkan user yang login
  useEffect(() => {
    if (!user) {
      setFilteredCabangs([]);
      setSelectedCabangState(null);
      return;
    }

    let allowed: Cabang[] = [];
    if (user.role === "admin" && !user.cabangId) {
      // Admin global bisa melihat semua cabang
      allowed = allCabangs;
    } else {
      // Petugas atau admin cabang spesifik
      const allowedIds = user.cabangId
        ? user.cabangId.split(",").map((id) => id.trim().toUpperCase())
        : [];
      allowed = allCabangs.filter((c) =>
        allowedIds.includes(c.Cabang_ID.toUpperCase()),
      );
    }

    setFilteredCabangs(allowed);

    // Otomatis tentukan selected cabang
    if (allowed.length === 1) {
      setSelectedCabangState(allowed[0]);
    } else if (allowed.length > 0) {
      const savedId = localStorage.getItem("stokis_selected_cabang_id");
      const match = allowed.find((c) => c.Cabang_ID === savedId);
      if (match) {
        setSelectedCabangState(match);
      } else {
        setSelectedCabangState(allowed[0]);
      }
    } else {
      setSelectedCabangState(null);
    }
  }, [user, allCabangs]);

  const setSelectedCabang = (c: Cabang | null) => {
    setSelectedCabangState(c);
    if (c) localStorage.setItem("stokis_selected_cabang_id", c.Cabang_ID);
    else localStorage.removeItem("stokis_selected_cabang_id");
  };

  return (
    <CabangContext.Provider
      value={{
        selectedCabang,
        setSelectedCabang,
        cabangList: filteredCabangs,
        allCabangList: allCabangs,
        loading,
        refreshCabangList: fetchCabangList,
      }}
    >
      {children}
    </CabangContext.Provider>
  );
}

export function useCabang() {
  return useContext(CabangContext);
}
