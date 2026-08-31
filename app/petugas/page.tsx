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
  AlertTriangle,
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

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState<string>('');
  const [formPin, setFormPin] = useState<string>('');
  const [formNama, setFormNama] = useState<string>('');
  const [formRole, setFormRole] = useState<string>('petugas');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const fetchUsers = async () => {
    if (!selectedCabang) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/users`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const filtered = json.data.filter((u: any) =>
          String(u.Cabang_ID || '') === selectedCabang.Cabang_ID
        );
        setUsersList(filtered);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
      setErrorMsg('Gagal memuat daftar pengguna. Periksa koneksi internet Anda.');
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
      setErrorMsg('Error: ' + err.message);
    } finally {
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
      setErrorMsg('Error: ' + err.message);
    }
  };

  if (!selectedCabang) {
    return (
      <div className="text-center py-16 card bg-base-100 border border-base-300 p-8 space-y-3">
        <ShieldAlert className="w-12 h-12 text-warning mx-auto" />
        <h3 className="text-base font-bold text-base-content">Pilih Cabang Terlebih Dahulu</h3>
      </div>
    );
  }

  if (loading) {
    return <QuantumLoaderFull text="Memuat daftar pengguna" />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-base-content flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>Manajemen Pengguna</span>
          </h1>
          <p className="text-base-content/60 text-sm mt-1">
            Daftar akun pengguna untuk cabang: <span className="text-base-content font-semibold">{selectedCabang.Nama_Cabang}</span>
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenAdd}
          className="btn btn-primary gap-2 px-4 py-2 text-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </motion.button>
      </motion.div>

      {errorMsg && (
        <div className="alert alert-error text-sm" role="alert">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => { setErrorMsg(''); fetchUsers(); }} className="btn btn-ghost btn-xs">Coba Lagi</button>
        </div>
      )}

      <motion.div
      >
        {usersList.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <Users className="w-12 h-12 text-base-content/40 mx-auto" />
            <h3 className="text-sm font-semibold text-base-content">Belum Ada Pengguna</h3>
            <p className="text-base-content/60 text-sm">Tambahkan pengguna baru untuk cabang ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm mobile-card-table">
              <thead className="bg-base-200 border-b border-base-300">
                <tr className="font-semibold text-base-content/60">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Username</th>
                  <th className="px-5 py-3">Nama Lengkap</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-base-content">
                {usersList.map((u) => (
                  <motion.tr
                    key={u.User_ID}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.1 }}
                    className="border-b border-base-300 hover:bg-base-200 transition-colors"
                  >
                    <td className="px-5 py-4 font-mono text-base-content/60" data-label="ID">{u.User_ID}</td>
                    <td className="px-5 py-4 font-semibold text-primary" data-label="Username">{u.Username}</td>
                    <td className="px-5 py-4" data-label="Nama">{u.Nama}</td>
                    <td className="px-5 py-4" data-label="Role">
                      {u.Role === 'admin' ? (
                        <span className="badge badge-primary gap-1">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="badge badge-ghost gap-1">
                          <Key className="w-3 h-3" /> Petugas
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center" data-label="Status">
                      {u.Aktif ? (
                        <span className="badge badge-success">Aktif</span>
                      ) : (
                        <span className="badge badge-ghost">Nonaktif</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right space-x-2" data-label="Aksi">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleOpenEdit(u)}
                        className="btn btn-ghost btn-xs text-base-content/60 hover:text-primary"
                        title="Edit Pengguna"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <button
                        onClick={() => handleToggleActive(u)}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10"
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

      <AnimatePresence>
        {showModal && (
          <dialog className="modal modal-open">
            <div className="modal-box">
              <div className="flex items-center justify-between pb-4 border-b border-base-300">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-base-content" />
                  <h3 className="text-lg font-semibold text-base-content">
                    {editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                </div>
                <button onClick={() => setShowModal(false)} className="btn btn-ghost btn-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                {!editingUser && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-base-content/70">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="Username untuk login"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="input input-bordered w-full text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-base-content/70">
                    {editingUser ? 'PIN Baru (kosongkan jika tidak diubah)' : 'PIN (6 digit)'}
                  </label>
                  <input
                    type="password"
                    required={!editingUser}
                    placeholder="123456"
                    maxLength={6}
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                    className="input input-bordered w-full text-sm font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-base-content/70">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    className="input input-bordered w-full text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold text-base-content/70">Role</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="select select-bordered w-full text-sm"
                  >
                    <option value="petugas">Petugas</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-base-300">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn btn-ghost"
                  >
                    Batal
                  </button>
                  <motion.button
                    type="submit"
                    disabled={saving}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="btn btn-primary"
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
