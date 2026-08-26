'use client';

import React, { useState, useEffect } from 'react';
import { useCabang } from '@/lib/CabangContext';
import { 
  Users, 
  UserPlus, 
  Phone, 
  Edit2, 
  X, 
  Loader2, 
  ShieldAlert
} from 'lucide-react';

interface Petugas {
  Petugas_ID: string;
  Nama: string;
  Nomor_WA?: string;
  Aktif: boolean;
}

export default function PetugasPage() {
  const { selectedCabang } = useCabang();

  const [petugasList, setPetugasList] = useState<Petugas[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingPetugas, setEditingPetugas] = useState<Petugas | null>(null);
  const [formNama, setFormNama] = useState<string>('');
  const [formNomorWa, setFormNomorWa] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const fetchPetugas = async () => {
    if (!selectedCabang) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/petugas?cabang=${selectedCabang.Cabang_ID}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPetugasList(json.data);
      }
    } catch (e) {
      console.error('Error fetching petugas:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetugas();
  }, [selectedCabang]);

  const handleOpenAdd = () => {
    setEditingPetugas(null);
    setFormNama('');
    setFormNomorWa('');
    setShowModal(true);
  };

  const handleOpenEdit = (p: Petugas) => {
    setEditingPetugas(p);
    setFormNama(p.Nama);
    setFormNomorWa(p.Nomor_WA || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCabang) return;

    try {
      setSaving(true);
      if (editingPetugas) {
        await fetch(`/api/petugas/${editingPetugas.Petugas_ID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cabangId: selectedCabang.Cabang_ID,
            Nama: formNama,
            Nomor_WA: formNomorWa,
          }),
        });
      } else {
        await fetch('/api/petugas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cabangId: selectedCabang.Cabang_ID,
            Nama: formNama,
            Nomor_WA: formNomorWa,
          }),
        });
      }
      setShowModal(false);
      fetchPetugas();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (p: Petugas) => {
    if (!selectedCabang) return;
    try {
      await fetch(`/api/petugas/${p.Petugas_ID}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangId: selectedCabang.Cabang_ID,
          aktif: !p.Aktif,
        }),
      });
      fetchPetugas();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  if (!selectedCabang) {
    return (
      <div className="text-center py-16 surface-card rounded-3xl p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-[#B38600] mx-auto" />
        <h3 className="text-base font-bold text-[#172B4D]">Pilih Cabang Terlebih Dahulu</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#172B4D] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1868DB]" />
            <span>Administrasi Petugas Stock Opname</span>
          </h1>
          <p className="text-[#44546F] text-sm mt-1">
            Daftar karyawan yang berwenang melakukan SO di: <span className="text-[#172B4D] font-semibold">{selectedCabang.Nama_Cabang}</span>
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 btn-primary px-4 py-2 text-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Petugas Baru</span>
        </button>
      </div>

      {/* Petugas Table */}
      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 text-[#1868DB] animate-spin mx-auto mb-2" />
            <p className="text-[#44546F] text-sm">Memuat daftar petugas...</p>
          </div>
        ) : petugasList.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Users className="w-12 h-12 text-[#44546F] mx-auto" />
            <h3 className="text-sm font-semibold text-[#172B4D]">Belum Ada Petugas Terdaftar</h3>
            <p className="text-[#44546F] text-sm">Tambahkan petugas untuk keperluan pencatatan sesi SO.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8F9] text-[#44546F] font-semibold border-b border-[#DCDFE4]">
                <tr>
                  <th className="px-5 py-3">ID Petugas</th>
                  <th className="px-5 py-3">Nama Lengkap</th>
                  <th className="px-5 py-3">Nomor WhatsApp</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCDFE4] text-[#172B4D]">
                {petugasList.map((p) => (
                  <tr key={p.Petugas_ID} className="hover:bg-[#F7F8F9] transition-colors">
                    <td className="px-5 py-4 font-mono text-[#44546F]">{p.Petugas_ID}</td>
                    <td className="px-5 py-4 font-semibold">{p.Nama}</td>
                    <td className="px-5 py-4 text-[#44546F]">
                      {p.Nomor_WA ? (
                        <div className="flex items-center gap-1.5 font-mono text-[#172B4D]">
                          <Phone className="w-3.5 h-3.5 text-[#216E4E]" />
                          <span>{p.Nomor_WA}</span>
                        </div>
                      ) : (
                        <span className="text-[#44546F]">Tidak ada nomor</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {p.Aktif ? (
                        <span className="lozenge lozenge-success">Aktif</span>
                      ) : (
                        <span className="lozenge lozenge-default">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="inline-flex p-1.5 text-[#44546F] hover:text-[#1868DB] hover:bg-[#F1F2F4] rounded transition-colors"
                        title="Edit Petugas"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(p)}
                        className="text-xs text-[#CA3521] hover:text-[#AE2A19] font-medium px-2 py-1 hover:bg-[#FFEBE6] rounded transition-colors"
                        title={p.Aktif ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {p.Aktif ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#091E428F] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCDFE4]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#172B4D]" />
                <h3 className="text-lg font-semibold text-[#172B4D]">
                  {editingPetugas ? 'Edit Informasi Petugas' : 'Tambah Petugas Baru'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#44546F] hover:text-[#172B4D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#44546F]">Nama Lengkap Petugas</label>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama lengkap..."
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#44546F]">Nomor WhatsApp</label>
                <input
                  type="text"
                  placeholder="Contoh: 628123456789"
                  value={formNomorWa}
                  onChange={(e) => setFormNomorWa(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono"
                />
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
                  disabled={saving}
                  className="btn-primary px-4 py-2"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Petugas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
