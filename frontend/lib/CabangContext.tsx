'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

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
  cabangList: Cabang[];
  loading: boolean;
  refreshCabangList: () => Promise<void>;
}

const CabangContext = createContext<CabangContextType>({
  selectedCabang: null,
  setSelectedCabang: () => {},
  cabangList: [],
  loading: true,
  refreshCabangList: async () => {},
});

export function CabangProvider({ children }: { children: React.ReactNode }) {
  const [selectedCabang, setSelectedCabangState] = useState<Cabang | null>(null);
  const [cabangList, setCabangList] = useState<Cabang[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCabangList = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cabang');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCabangList(json.data);
        const savedId = localStorage.getItem('stokis_selected_cabang_id');
        if (savedId) {
          const match = json.data.find((c: Cabang) => c.Cabang_ID === savedId);
          if (match) setSelectedCabangState(match);
          else if (json.data.length > 0) setSelectedCabangState(json.data[0]);
        } else if (json.data.length > 0) {
          setSelectedCabangState(json.data[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching cabang list:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCabangList();
  }, []);

  const setSelectedCabang = (c: Cabang | null) => {
    setSelectedCabangState(c);
    if (c) localStorage.setItem('stokis_selected_cabang_id', c.Cabang_ID);
    else localStorage.removeItem('stokis_selected_cabang_id');
  };

  return (
    <CabangContext.Provider
      value={{
        selectedCabang,
        setSelectedCabang,
        cabangList,
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
