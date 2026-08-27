'use client';

import React, { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';

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

  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
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

  // Inline Edit Threshold
  const [editingThreshold, setEditingThreshold] = useState<string | null>(null);
  const [tempThreshold, setTempThreshold] = useState<number>(0);

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

  if (!selectedCabang) {
    return (
      <div className="text-center py-16 surface-card rounded-3xl p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-[#7F5F01] mx-auto" />
        <h3 className="text-base font-bold text-[#172B4D]">Pilih Cabang Terlebih Dahulu</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#172B4D] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#1868DB]" />
            <span>Master Item dan Threshold Minimum</span>
          </h1>
          <p className="text-[#44546F] text-sm mt-1">
            Pengaturan batas minimum stok untuk cabang: <span className="font-semibold">{selectedCabang.Nama_Cabang}</span>
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 btn-primary px-4 py-2 text-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah Item Baru</span>
        </button>
      </div>

      {/* Items Table */}
      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 text-[#1868DB] animate-spin mx-auto mb-2" />
            <p className="text-[#44546F] text-sm">Memuat data barang...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Package className="w-12 h-12 text-[#44546F] mx-auto" />
            <h3 className="text-sm font-semibold text-[#172B4D]">Belum Ada Item Terdaftar di Cabang Ini</h3>
            <p className="text-[#44546F] text-sm">Tambahkan master barang untuk memulai pencatatan SO.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm mobile-card-table">
              <thead className="bg-[#F7F8F9] text-[#44546F] font-semibold border-b border-[#DCDFE4]">
                <tr>
                  <th className="px-5 py-3">ID Item</th>
                  <th className="px-5 py-3">Nama Barang</th>
                  <th className="px-5 py-3">Area Penempatan</th>
                  <th className="px-5 py-3">Satuan</th>
                  <th className="px-5 py-3 text-center">Batas Minimum (Threshold)</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y sm:divide-y-0 divide-[#DCDFE4] text-[#172B4D]">
                {items.map((item) => (
                  <tr key={item.Item_ID} className="hover:bg-[#F7F8F9] transition-colors">
                    <td className="px-5 py-4 font-mono text-[#44546F]" data-label="ID">{item.Item_ID}</td>
                    <td className="px-5 py-4 font-semibold" data-label="Nama">{item.Nama_Barang}</td>
                    <td className="px-5 py-4" data-label="Area">
                      <span className="bg-[#F1F2F4] text-[#44546F] px-2 py-1 rounded border border-[#DCDFE4] font-medium text-xs">
                        {item.Area}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[#44546F] font-mono" data-label="Satuan">{item.Satuan}</td>
                    <td className="px-5 py-4 text-center" data-label="Threshold">
                      {editingThreshold === item.Item_ID ? (
                        <div className="inline-flex items-center gap-1.5">
                          <input
                            type="number"
                            value={tempThreshold}
                            onChange={(e) => setTempThreshold(Number(e.target.value))}
                            className="w-16 px-2 py-1 text-sm text-center tabular-nums"
                          />
                          <button
                            onClick={() => handleSaveThreshold(item.Item_ID)}
                            className="p-1.5 bg-[#1868DB] text-white hover:bg-[#0055CC] rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingThreshold(null)}
                            className="p-1.5 bg-[#F1F2F4] text-[#44546F] hover:bg-[#DCDFE4] rounded"
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
                          className="inline-flex items-center gap-2 cursor-pointer group px-2 py-1 rounded hover:bg-[#F1F2F4]"
                        >
                          <span className="font-semibold text-[#172B4D] tabular-nums">{item.Threshold}</span>
                          <Edit3 className="w-3.5 h-3.5 text-[#44546F] group-hover:text-[#1868DB] transition-colors" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center" data-label="Status">
                      {item.Aktif ? (
                        <span className="lozenge lozenge-success">Aktif</span>
                      ) : (
                        <span className="lozenge lozenge-default">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right" data-label="Aksi">
                      <button
                        onClick={() => handleToggleActive(item.Item_ID, item.Aktif)}
                        title={item.Aktif ? "Nonaktifkan item dari form SO" : "Aktifkan item"}
                        className="text-xs text-[#CA3521] hover:text-[#AE2A19] font-medium px-2 py-1 hover:bg-[#FFEBE6] rounded transition-colors"
                      >
                        {item.Aktif ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Item */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#091E428F] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCDFE4]">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#172B4D]" />
                <h3 className="text-lg font-semibold text-[#172B4D]">Tambah Master Item Baru</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#44546F] hover:text-[#172B4D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#44546F]">Nama Barang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Beras Pandan Wangi 5kg"
                  value={newItem.Nama_Barang}
                  onChange={(e) => setNewItem({ ...newItem, Nama_Barang: e.target.value })}
                  className="w-full px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#44546F]">Area</label>
                  <select
                    value={newItem.Area}
                    onChange={(e) => setNewItem({ ...newItem, Area: e.target.value })}
                    className="w-full px-3 py-2 text-sm cursor-pointer"
                  >
                    {DEFAULT_AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#44546F]">Satuan</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, pcs, liter..."
                    value={newItem.Satuan}
                    onChange={(e) => setNewItem({ ...newItem, Satuan: e.target.value })}
                    className="w-full px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#44546F]">Batas Minimum Stok (Threshold)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={newItem.Threshold}
                  onChange={(e) => setNewItem({ ...newItem, Threshold: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm font-semibold tabular-nums"
                />
                <p className="text-xs text-[#44546F]">Jika hasil SO berada di bawah atau sama dengan threshold, status otomatis menjadi Kritis.</p>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-[#DCDFE4]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-default px-4 py-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="btn-primary px-4 py-2"
                >
                  {savingItem ? 'Menyimpan...' : 'Simpan Master Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
