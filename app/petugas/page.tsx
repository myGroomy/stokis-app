'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCabang } from '@/lib/CabangContext';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  X, 
  ShieldAlert,
  Shield,
  Key,
} from 'lucide-react';
import { QuantumLoaderFull } from '@/components/ui/QuantumLoader';

interface User {
  User_ID: string;
  Username: string;
  Nama: string;
  Role: string;
  Cabang_ID: string;
  Aktif: boolean;
}

export default function PetugasPage() {
  const { selectedCabang } = useCabang();

  const [usersList, setUsersList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState<string>('');
  const [formPin, setFormPin] = useState<string>('');
  const [formNama, setFormNama] = useState<string>('');
  const [formRole, setFormRole] = useState<string>('petugas');
  const [saving, setSaving] = useState<boolean>(false);

  const fetchUsers = async () => {
    if (!selectedCabang) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/users`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const filtered = json.data.filter((u: any) =>
          String(u.Cabang_ID || '').includes(selectedCabang.Cabang_ID)
        );
        setUsersList(filtered);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedCabang]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormPin('');
    setFormNama('');
    setFormRole('petugas');
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormUsername(u.Username);
    setFormPin('');
    setFormNama(u.Nama);
    setFormRole(u.Role);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCabang) return;

    try {
      setSaving(true);
      if (editingUser) {
        const payload: any = {
          userId: editingUser.User_ID,
          nama: formNama,
          role: formRole,
        };
        if (formPin) payload.pin = formPin;
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formUsername,
            pin: formPin,
            nama: formNama,
            role: formRole,
            cabangId: selectedCabang.Cabang_ID,
          }),
        });
      }
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: u.User_ID,
          aktif: !u.Aktif,
        }),
      });
      fetchUsers();
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

  if (loading) {
    return <QuantumLoaderFull text="Memuat daftar pengguna" />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-[#172B4D] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#1868DB]" />
            <span>Manajemen Pengguna</span>
          </h1>
          <p className="text-[#44546F] text-sm mt-1">
            Daftar akun pengguna untuk cabang: <span className="text-[#172B4D] font-semibold">{selectedCabang.Nama_Cabang}</span>
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 btn-primary px-4 py-2 text-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </motion.button>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="surface-card overflow-hidden"
      >
        {usersList.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Users className="w-12 h-12 text-[#44546F] mx-auto" />
            <h3 className="text-sm font-semibold text-[#172B4D]">Belum Ada Pengguna</h3>
            <p className="text-[#44546F] text-sm">Tambahkan pengguna baru untuk cabang ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm mobile-card-table">
              <thead className="bg-[#F7F8F9] text-[#44546F] font-semibold border-b border-[#DCDFE4]">
                <tr>
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Nama Lengkap</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y sm:divide-y-0 divide-[#DCDFE4] text-[#172B4D]">
                {usersList.map((u) => (
                  <motion.tr
                    key={u.User_ID}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    className="hover:bg-[#F7F8F9] transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-[#44546F]" data-label="ID">{u.User_ID}</td>
                    <td className="px-5 py-4 font-semibold text-[#1868DB]" data-label="Username">{u.Username}</td>
                    <td className="px-5 py-4" data-label="Nama">{u.Nama}</td>
                    <td className="px-5 py-4" data-label="Role">
                      {u.Role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 lozenge lozenge-new">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 lozenge lozenge-default">
                          <Key className="w-3 h-3" /> Petugas
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center" data-label="Status">
                      {u.Aktif ? (
                        <span className="lozenge lozenge-success">Aktif</span>
                      ) : (
                        <span className="lozenge lozenge-default">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2" data-label="Aksi">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleOpenEdit(u)}
                        className="inline-flex p-1.5 text-[#44546F] hover:text-[#1868DB] hover:bg-[#F1F2F4] rounded transition-colors"
                        title="Edit Pengguna"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <button
                        onClick={() => handleToggleActive(u)}
                        className="text-xs text-[#CA3521] hover:text-[#AE2A19] font-medium px-2 py-1 hover:bg-[#FFEBE6] rounded transition-colors"
                        title={u.Aktif ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {u.Aktif ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal Tambah / Edit */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#091E428F] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg max-w-md w-full p-6 space-y-4 shadow-sm"
            >
              <div className="flex items-center justify-between pb-4 border-b border-[#DCDFE4]">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#172B4D]" />
                  <h3 className="text-lg font-semibold text-[#172B4D]">
                    {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-[#44546F] hover:text-[#172B4D]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingUser && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-[#44546F]">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="Username untuk login"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full px-3 py-2 text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#44546F]">
                    {editingUser ? 'PIN Baru (kosongkan jika tidak diubah)' : 'PIN (6 digit)'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder="123456"
                    maxLength={6}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#44546F]">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="w-full px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-[#44546F]">Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 text-sm"
                  >
                    <option value="petugas">Petugas</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-[#DCDFE4]">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-default px-4 py-2"
                  >
                    Batal
                  </button>
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="btn-primary px-4 py-2"
                  >
                    {saving ? (
                      <>
                        <div className="quantum-mini-loader">
                          <span />
                          <span />
                          <span />
                        </div>
                        <span>Menyimpan...</span>
                      </>
                    ) : editingUser ? (
                      'Simpan Perubahan'
                    ) : (
                      'Tambah Pengguna'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
