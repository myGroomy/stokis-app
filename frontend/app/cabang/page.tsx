'use client';

import React, { useState, useEffect } from 'react';
import { useCabang } from '@/lib/CabangContext';
import { 
  Building2, 
  PlusCircle, 
  Store, 
  Phone, 
  User, 
  Edit2, 
  X, 
  Loader2, 
  CheckCircle2, 
  ExternalLink,
  Zap,
  Folder,
  FileSpreadsheet
} from 'lucide-react';

interface CabangFull {
  Cabang_ID: string;
  Nama_Cabang: string;
  Alamat?: string;
  Spreadsheet_ID?: string;
  Folder_Drive_ID?: string;
  PIC_Nama?: string;
  Nomor_WA_Cabang?: string;
  Aktif: boolean;
}

export default function CabangAdminPage() {
  const { refreshCabangList } = useCabang();

  const [cabangList, setCabangList] = useState<CabangFull[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCabang, setEditingCabang] = useState<CabangFull | null>(null);
  const [namaCabang, setNamaCabang] = useState<string>('');
  const [alamat, setAlamat] = useState<string>('');
  const [picNama, setPicNama] = useState<string>('');
  const [nomorWa, setNomorWa] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [successInfo, setSuccessInfo] = useState<string>('');

  const fetchAllCabang = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cabang');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setCabangList(json.data);
      }
    } catch (e) {
      console.error('Error fetching all cabang:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCabang();
  }, []);

  const handleOpenAdd = () => {
    setEditingCabang(null);
    setNamaCabang('');
    setAlamat('');
    setPicNama('');
    setNomorWa('');
    setSuccessInfo('');
    setShowModal(true);
  };

  const handleOpenEdit = (c: CabangFull) => {
    setEditingCabang(c);
    setNamaCabang(c.Nama_Cabang);
    setAlamat(c.Alamat || '');
    setPicNama(c.PIC_Nama || '');
    setNomorWa(c.Nomor_WA_Cabang || '');
    setSuccessInfo('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccessInfo('');

      if (editingCabang) {
        const res = await fetch(`/api/cabang/${editingCabang.Cabang_ID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Nama_Cabang: namaCabang,
            Alamat: alamat,
            PIC_Nama: picNama,
            Nomor_WA_Cabang: nomorWa,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setShowModal(false);
          fetchAllCabang();
          refreshCabangList();
        } else {
          alert(json.error?.message || 'Gagal mengubah data cabang');
        }
      } else {
        const res = await fetch('/api/cabang', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            Nama_Cabang: namaCabang,
            Alamat: alamat,
            PIC_Nama: picNama,
            Nomor_WA_Cabang: nomorWa,
          }),
        });
        const json = await res.json();
        if (json.success) {
          setSuccessInfo(`Cabang "${namaCabang}" berhasil dibuat secara otomatis dengan spreadsheet Google Sheets dan folder PDF baru.`);
          setShowModal(false);
          fetchAllCabang();
          refreshCabangList();
        } else {
          alert(json.error?.message || 'Gagal membuat cabang baru');
        }
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (c: CabangFull) => {
    try {
      await fetch(`/api/cabang/${c.Cabang_ID}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aktif: !c.Aktif }),
      });
      fetchAllCabang();
      refreshCabangList();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#172B4D] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#1868DB]" />
            <span>Administrasi Cabang Operasional</span>
          </h1>
          <p className="text-[#44546F] text-sm mt-1">
            Penambahan cabang otomatis: template Google Sheets dan folder Drive disalin tanpa perlu coding.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 btn-primary px-4 py-2 text-sm self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah Cabang Baru</span>
        </button>
      </div>

      {successInfo && (
        <div className="p-4 bg-[#E3FCEF] border border-[#BAF3DB] rounded text-[#216E4E] text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successInfo}</span>
        </div>
      )}

      {/* Cabang Table */}
      <div className="surface-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 text-[#1868DB] animate-spin mx-auto mb-2" />
            <p className="text-[#44546F] text-sm">Memuat data cabang...</p>
          </div>
        ) : cabangList.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Store className="w-12 h-12 text-[#44546F] mx-auto" />
            <h3 className="text-sm font-semibold text-[#172B4D]">Belum Ada Cabang Terdaftar</h3>
            <p className="text-[#44546F] text-sm">Klik tombol di atas untuk mendaftarkan cabang perdana.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F8F9] text-[#44546F] font-semibold border-b border-[#DCDFE4]">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Nama Cabang</th>
                  <th className="px-5 py-3">PIC dan Kontak</th>
                  <th className="px-5 py-3">Alamat</th>
                  <th className="px-5 py-3 text-center">Database dan Drive</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCDFE4] text-[#172B4D]">
                {cabangList.map((c) => (
                  <tr key={c.Cabang_ID} className="hover:bg-[#F7F8F9] transition-colors">
                    <td className="px-5 py-4 font-mono text-[#44546F]">{c.Cabang_ID}</td>
                    <td className="px-5 py-4 font-semibold">{c.Nama_Cabang}</td>
                    <td className="px-5 py-4 text-[#44546F]">
                      <div className="font-medium text-[#172B4D]">PIC: {c.PIC_Nama || 'Belum diatur'}</div>
                      <div className="mt-0.5">{c.Nomor_WA_Cabang || 'Belum diatur'}</div>
                    </td>
                    <td className="px-5 py-4 text-[#44546F] max-w-xs truncate">
                      {c.Alamat || 'Belum diatur'}
                    </td>
                    <td className="px-5 py-4 text-center space-x-2">
                      {c.Spreadsheet_ID && (
                        <a
                          href={`https://docs.google.com/spreadsheets/d/${c.Spreadsheet_ID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka Database Spreadsheet Cabang"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#216E4E] bg-[#E3FCEF] hover:bg-[#BAF3DB] px-2 py-1 rounded transition-colors"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Sheets</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {c.Folder_Drive_ID && (
                        <a
                          href={`https://drive.google.com/drive/folders/${c.Folder_Drive_ID}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Buka Folder PDF Google Drive"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1868DB] bg-[#E9F2FF] hover:bg-[#CCE0FF] px-2 py-1 rounded transition-colors"
                        >
                          <Folder className="w-3.5 h-3.5" />
                          <span>Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {c.Aktif ? (
                        <span className="lozenge lozenge-success">Aktif</span>
                      ) : (
                        <span className="lozenge lozenge-default">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="inline-flex p-1.5 text-[#44546F] hover:text-[#1868DB] hover:bg-[#F1F2F4] rounded transition-colors"
                        title="Edit Data Cabang"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(c)}
                        className="text-xs text-[#CA3521] hover:text-[#AE2A19] font-medium px-2 py-1 hover:bg-[#FFEBE6] rounded transition-colors"
                        title={c.Aktif ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {c.Aktif ? "Nonaktifkan" : "Aktifkan"}
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
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#DCDFE4]">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#172B4D]" />
                <h3 className="text-lg font-semibold text-[#172B4D]">
                  {editingCabang ? 'Edit Informasi Cabang' : 'Tambah Cabang Baru Otomatis'}
                </h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#44546F] hover:text-[#172B4D]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#44546F]">Nama Cabang</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SO Bandung Malam"
                  value={namaCabang}
                  onChange={(e) => setNamaCabang(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#44546F]">Alamat Cabang</label>
                <textarea
                  rows={2}
                  placeholder="Alamat lengkap lokasi..."
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                  className="w-full px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#44546F]">Nama PIC Cabang</label>
                  <input
                    type="text"
                    placeholder="Nama staf PIC..."
                    value={picNama}
                    onChange={(e) => setPicNama(e.target.value)}
                    className="w-full px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#44546F]">Nomor WhatsApp Cabang</label>
                  <input
                    type="text"
                    placeholder="628123456789"
                    value={nomorWa}
                    onChange={(e) => setNomorWa(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono"
                  />
                </div>
              </div>

              {!editingCabang && (
                <div className="p-3 bg-[#E6FCFF] border border-[#B3F5FF] rounded text-sm text-[#165561] flex items-start gap-2">
                  <Zap className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>Sistem akan menyalin template spreadsheet Google Sheets mandiri dan membuat folder Drive PDF khusus untuk cabang ini.</span>
                </div>
              )}

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
                  className="btn-primary px-4 py-2 flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{saving ? 'Menyiapkan Database...' : 'Simpan Cabang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
