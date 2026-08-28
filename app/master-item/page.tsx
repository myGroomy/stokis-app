'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCabang } from '@/lib/CabangContext';
import {
  Package,
  PlusCircle,
  Edit3,
  Check,
  X,
  Loader2,
  ShieldAlert,
  Layers,
  Sliders,
  CheckCircle2,
  Trash2,
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface MasterItem {
  Item_ID: string;
  Nama_Barang: string;
  Area: string;
  Satuan: string;
  Konversi_Isi?: string;
  Konversi_Keterangan?: string;
  Threshold: number;
  Aktif: boolean;
}

const DEFAULT_AREAS = [
  'Meja Biru Depan',
  'Chiller',
  'Freezer Ayam dan Alat',
  'Barang Alat dan Kebersihan',
  'Meja Laci',
  'Gas dan Utilitas',
  'Area Umum',
];

export default function MasterItemPage() {
  const { selectedCabang } = useCabang();
  const { hasAnyRole } = useAuth();

  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [showModal, setShowModal] = useState<boolean>(false);
  const [newItem, setNewItem] = useState({
    Nama_Barang: '',
    Area: DEFAULT_AREAS[0],
    Satuan: 'pcs',
    Konversi_Isi: '',
    Konversi_Keterangan: '',
    Threshold: 0,
  });
  const [savingItem, setSavingItem] = useState<boolean>(false);

  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('Semua');

  const fetchItems = async () => {
    if (!selectedCabang) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/master-item?cabang=${selectedCabang.Cabang_ID}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setItems(json.data);
      }
    } catch (e) {
      console.error('Error fetching master items:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCabang]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCabang) return;

    try {
      setSavingItem(true);
      const res = await fetch('/api/master-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          ...newItem,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setShowModal(false);
        setNewItem({
          Nama_Barang: '',
          Area: DEFAULT_AREAS[0],
          Satuan: 'pcs',
          Konversi_Isi: '',
          Konversi_Keterangan: '',
          Threshold: 0,
        });
        fetchItems();
      } else {
        alert(json.error?.message || 'Gagal menambahkan master item');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSavingItem(false);
    }
  };

  const handleSaveThreshold = async (itemId: string) => {
    if (!selectedCabang) return;
    try {
      const res = await fetch(`/api/master-item/${itemId}/threshold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          threshold: tempThreshold,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingThreshold(null);
        fetchItems();
      }
    } catch (err: any) {
      alert('Gagal mengubah threshold: ' + err.message);
    }
  };

  const handleToggleActive = async (itemId: string, currentAktif: boolean) => {
    if (!selectedCabang) return;
    try {
      const res = await fetch(`/api/master-item/${itemId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          aktif: !currentAktif,
        }),
      });
      const json = await res.json();
      if (json.success) {
        fetchItems();
      }
    } catch (err: any) {
      alert('Gagal mengubah status item: ' + err.message);
    }
  };

  const areas = useMemo(() => {
    const areaSet = new Set(items.map(i => i.Area || 'Area Umum'));
    return Array.from(areaSet).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesArea = selectedArea === 'Semua' || (item.Area || 'Area Umum') === selectedArea;
      const query = searchQuery.toLowerCase();
      const matchesSearch = !query ||
        item.Nama_Barang.toLowerCase().includes(query) ||
        item.Item_ID.toLowerCase().includes(query) ||
        item.Area.toLowerCase().includes(query);
      return matchesArea && matchesSearch;
    });
  }, [items, selectedArea, searchQuery]);

  if (!selectedCabang) {
    return (
      <div className="text-center py-16 card bg-base-100 border border-base-300 p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-warning mx-auto" />
        <h3 className="text-base font-bold text-base-content">Pilih Cabang Terlebih Dahulu</h3>
      </div>
    );
  }

  const isAdmin = hasAnyRole(['admin']);
  const activeFilterCount = (selectedArea !== 'Semua' ? 1 : 0) + (searchQuery ? 1 : 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold flex items-center gap-2 text-base-content">
            <Package className="w-6 h-6 text-primary" />
            <span>Master Item dan Threshold Minimum</span>
          </h1>
          <p className="text-sm mt-1 text-base-content/60">
            Pengaturan batas minimum stok untuk cabang: <span className="font-semibold">{selectedCabang.Nama_Cabang}</span>
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary gap-2 px-4 py-2 text-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah Item Baru</span>
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="card bg-base-100 border border-base-300 p-4 space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
            <input
              type="text"
              placeholder="Cari nama barang, area, atau ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pl-9 pr-8 min-h-[42px] text-sm"
            />
            <AnimatePresence>
              {searchQuery && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-base-content/40 hover:text-base-content"
                >
                  <X className="w-3.5 h-3.5" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-base-content/40" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="select select-bordered pl-9 pr-8 min-h-[42px] text-sm font-medium"
            >
              <option value="Semua">Semua Area</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>
        </div>

        <AnimatePresence>
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 flex-wrap"
            >
              <span className="text-[11px] font-semibold text-base-content/60">Filter aktif:</span>
              {selectedArea !== 'Semua' && (
                <span className="badge badge-primary gap-1">
                  <Layers className="w-3 h-3" />
                  {selectedArea}
                  <button type="button" onClick={() => setSelectedArea('Semua')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="badge badge-primary gap-1">
                  <Search className="w-3 h-3" />
                  &quot;{searchQuery}&quot;
                  <button type="button" onClick={() => setSearchQuery('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => { setSelectedArea('Semua'); setSearchQuery(''); }}
                className="text-[11px] font-medium underline text-base-content/50 hover:text-base-content"
              >
                Hapus semua
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.1 }}
        className="card bg-base-100 border border-base-300 overflow-hidden"
      >
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-base-content/60">Memuat data barang...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Package className="w-12 h-12 mx-auto text-base-content/30" />
            <h3 className="text-sm font-semibold text-base-content">
              {items.length === 0
                ? 'Belum Ada Item Terdaftar di Cabang Ini'
                : 'Tidak ada item yang cocok dengan filter.'}
            </h3>
            <p className="text-sm text-base-content/60">
              {items.length === 0
                ? 'Tambahkan master barang untuk memulai pencatatan SO.'
                : 'Coba ubah filter atau kata kunci pencarian.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm mobile-card-table">
              <thead className="bg-base-200 border-b border-base-300">
                <tr className="font-semibold text-base-content/60">
                  <th className="px-5 py-3">ID Item</th>
                  <th className="px-5 py-3">Nama Barang</th>
                  <th className="px-5 py-3">Area Penempatan</th>
                  <th className="px-5 py-3">Satuan</th>
                  <th className="px-5 py-3 text-center">Batas Minimum (Threshold)</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-base-content">
                <AnimatePresence initial={false}>
                  {filteredItems.map((item) => (
                    <motion.tr
                      key={item.Item_ID}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.15 }}
                      className="transition-colors border-b border-base-300 hover:bg-base-200"
                    >
                      <td className="px-5 py-4 font-mono text-base-content/60" data-label="ID">{item.Item_ID}</td>
                      <td className="px-5 py-4 font-semibold" data-label="Nama">{item.Nama_Barang}</td>
                      <td className="px-5 py-4" data-label="Area">
                        <span className="badge badge-ghost gap-1">
                          {item.Area}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-base-content/60" data-label="Satuan">{item.Satuan}</td>
                      <td className="px-5 py-4 text-center" data-label="Threshold">
                        {editingThreshold === item.Item_ID ? (
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              value={tempThreshold}
                              onChange={(e) => setTempThreshold(Number(e.target.value))}
                              className="input input-bordered w-16 px-2 py-1 text-sm text-center tabular-nums min-h-0 h-8"
                            />
                            <button
                              onClick={() => handleSaveThreshold(item.Item_ID)}
                              className="btn btn-primary btn-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingThreshold(null)}
                              className="btn btn-ghost btn-xs"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingThreshold(item.Item_ID);
                              setTempThreshold(item.Threshold);
                            }}
                            className="inline-flex items-center gap-2 cursor-pointer group px-2 py-1 rounded-md transition-colors hover:bg-base-200"
                          >
                            <span className="font-semibold tabular-nums">{item.Threshold}</span>
                            <Edit3 className="w-3.5 h-3.5 transition-colors text-base-content/40 group-hover:text-primary" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center" data-label="Status">
                        {item.Aktif ? (
                          <span className="badge badge-success">Aktif</span>
                        ) : (
                          <span className="badge badge-ghost">Nonaktif</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right" data-label="Aksi">
                        <button
                          onClick={() => handleToggleActive(item.Item_ID, item.Aktif)}
                          title={item.Aktif ? "Nonaktifkan item dari form SO" : "Aktifkan item"}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                        >
                          {item.Aktif ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <div className="flex items-center justify-between pb-4 border-b border-base-300">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-base-content" />
                  <h3 className="text-lg font-semibold text-base-content">Tambah Master Item Baru</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4 mt-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-base-content/70">Nama Barang</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Beras Pandan Wangi 5kg"
                    value={newItem.Nama_Barang}
                    onChange={(e) => setNewItem({ ...newItem, Nama_Barang: e.target.value })}
                    className="input input-bordered w-full text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-base-content/70">Area</label>
                    <select
                      value={newItem.Area}
                      onChange={(e) => setNewItem({ ...newItem, Area: e.target.value })}
                      className="select select-bordered w-full text-sm"
                    >
                      {DEFAULT_AREAS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-base-content/70">Satuan</label>
                    <input
                      type="text"
                      required
                      placeholder="kg, pcs, liter..."
                      value={newItem.Satuan}
                      onChange={(e) => setNewItem({ ...newItem, Satuan: e.target.value })}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-base-content/70">Batas Minimum Stok (Threshold)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={newItem.Threshold}
                    onChange={(e) => setNewItem({ ...newItem, Threshold: Number(e.target.value) })}
                    className="input input-bordered w-full text-sm font-semibold tabular-nums"
                  />
                  <p className="text-xs text-base-content/50">Jika hasil SO berada di bawah atau sama dengan threshold, status otomatis menjadi Kritis.</p>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-ghost"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingItem}
                    className="btn btn-primary"
                  >
                    {savingItem ? 'Menyimpan...' : 'Simpan Master Item'}
                  </button>
                </div>
              </form>
            </div>
            <form method="dialog" className="modal-backdrop">
              <button onClick={() => setShowModal(false)}>close</button>
            </form>
          </dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
