'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useLanguage } from '@/lib/LanguageContext';
import {
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
  Table,
  Share2,
  RefreshCcw,
  Globe,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react';

export default function PanduanPage() {
  const { lang, toggleLang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'workflow' | 'threshold' | 'faq'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const isEn = lang === 'en';

  const faqList = [
    {
      q: isEn
        ? 'Why does the button say "File XLSX Belum Tersedia" (File XLSX Not Available)?'
        : 'Mengapa tombol "File XLSX Belum Tersedia" / berwarna abu-abu?',
      a: isEn
        ? 'This occurs when network latency to Google Apps Script / Drive delayed generation. Click the "Regenerate Spreadsheet" button on the receipt page to regenerate the XLSX file automatically.'
        : 'Hal ini terjadi jika koneksi jaringan ke Google Apps Script/Drive mengalami keterlambatan saat submit. Klik tombol "Regenerate Spreadsheet" di halaman Struk Konfirmasi untuk memicu pembuatannya ulang secara otomatis.',
    },
    {
      q: isEn
        ? 'What happens if my phone dies or the browser refreshes while entering SO?'
        : 'Bagaimana jika HP petugas mati atau browser ter-refresh saat mengisi SO?',
      a: isEn
        ? 'Do not worry! The app features Auto-Save Draft. When you re-open /so/input, click "Lanjutkan Draft" to restore all your Step 1, Step 2, and Notes values.'
        : 'Data Anda tetap aman! Aplikasi memiliki fitur Auto-Save Draft lokal. Saat Anda membuka kembali halaman /so/input, klik "Lanjutkan Draft" untuk mengembalikan seluruh angka S1, S2, dan Keterangan.',
    },
    {
      q: isEn
        ? 'Why does an item show "Tidak Dipantau" (Unmonitored)?'
        : 'Mengapa status barang muncul "Tidak Dipantau"?',
      a: isEn
        ? 'An item shows "Tidak Dipantau" only if its Threshold in Master Item is left blank (empty). If set to 0 or higher, the system evaluates it as a valid threshold.'
        : 'Status "Tidak Dipantau" hanya muncul jika kolom Threshold barang tersebut di Master Item dibiarkan kosong/blank. Jika diisi angka 0 atau lebih, sistem akan menghitung statusnya secara acak/normal.',
    },
    {
      q: isEn
        ? 'How are decimal thresholds like 0,5 handled?'
        : 'Bagaimana penanganan angka desimal koma seperti 0,5?',
      a: isEn
        ? 'The system automatically recognizes Indonesian comma format (0,5) and converts it to decimal 0.5 without turning it into zero.'
        : 'Sistem secara otomatis mengenali penulisan koma desimal Indonesia (0,5) dan mengonversinya menjadi 0.5 tanpa membuatnya menjadi nol.',
    },
  ];

  return (
    <div className="min-h-screen bg-base-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/90 via-primary to-primary/80 text-primary-content p-8 sm:p-12 shadow-2xl">
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('DOKUMENTASI OPERASIONAL', 'OPERATIONAL MANUAL')}</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              {t('Panduan Penggunaan & Training Stokis', 'Stokis User & Training Guide')}
            </h1>
            <p className="text-primary-content/80 text-sm sm:text-base leading-relaxed">
              {t(
                'Panduan lengkap operasional Stock Opname (SO) harian multi-cabang dari input data, draft otomatis, struk transaksi, hingga laporan XLSX & WhatsApp.',
                'Complete operational guide for daily multi-branch Stock Opname (SO), auto-save drafts, receipt cards, XLSX reports, and WhatsApp integration.'
              )}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/so/input"
                className="btn bg-white text-primary hover:bg-white/90 border-none font-bold text-xs shadow-md"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>{t('Mulai Input SO', 'Start SO Input')}</span>
              </Link>
              <button
                onClick={toggleLang}
                className="btn btn-outline border-white/40 text-white hover:bg-white/20 text-xs font-bold gap-2"
              >
                <Globe className="w-4 h-4" />
                <span>{lang === 'id' ? 'English Version' : 'Versi Bahasa Indonesia'}</span>
              </button>
            </div>
          </div>
          {/* Background Graphic Circle */}
          <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-base-300 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'overview', labelId: '📌 Ringkasan Workflow', labelEn: '📌 Workflow Overview' },
            { id: 'roles', labelId: '👥 Peran User (Roles)', labelEn: '👥 User Roles' },
            { id: 'workflow', labelId: '📝 Form Input & Struk', labelEn: '📝 Input & Receipt' },
            { id: 'threshold', labelId: '📊 Logika Status Stok', labelEn: '📊 Stock Status Logic' },
            { id: 'faq', labelId: '❓ Troubleshooting (FAQ)', labelEn: '❓ FAQ & Solutions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-content shadow-md'
                  : 'bg-base-200 text-base-content/70 hover:bg-base-300'
              }`}
            >
              <span>{isEn ? tab.labelEn : tab.labelId}</span>
            </button>
          ))}
        </div>

        {/* SECTION 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-base-300">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-base-content">
                    {t('Tujuan Utama Sistem Stokis', 'Main Objectives of Stokis System')}
                  </h2>
                  <p className="text-xs text-base-content/60">
                    {t('Otomatisasi pencatatan stok fisik cabang real-time', 'Real-time branch physical stock recording automation')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-base-200/60 border border-base-300 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-error/15 text-error flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h3 className="font-bold text-sm text-base-content">
                    {t('Cegah Stok Kosong (Stockout)', 'Prevent Stockout')}
                  </h3>
                  <p className="text-xs text-base-content/60 leading-relaxed">
                    {t(
                      'Sistem menandai otomatis barang bernilai Kritis dan Hampir Habis untuk percepatan restock.',
                      'System automatically flags Critical and Low Stock items for expedited restocking.'
                    )}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-base-200/60 border border-base-300 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-warning/15 text-warning flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h3 className="font-bold text-sm text-base-content">
                    {t('Hitung Ganda (S1 & S2)', 'Dual Calculation (S1 & S2)')}
                  </h3>
                  <p className="text-xs text-base-content/60 leading-relaxed">
                    {t(
                      'Step 1 (lokasi display) & Step 2 (lokasi gudang/freezer) dihitung terpisah untuk akurasi tinggi.',
                      'Step 1 (display area) & Step 2 (freezer/storage) are calculated separately for high accuracy.'
                    )}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-base-200/60 border border-base-300 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-success/15 text-success flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h3 className="font-bold text-sm text-base-content">
                    {t('Laporan XLSX & WhatsApp', 'XLSX & WhatsApp Report')}
                  </h3>
                  <p className="text-xs text-base-content/60 leading-relaxed">
                    {t(
                      'Otomatis tergenerasi di Google Drive dan terformat rapi untuk dibagikan ke grup WhatsApp.',
                      'Automatically generated on Google Drive and formatted for instant WhatsApp sharing.'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 2: ROLES */}
        {activeTab === 'roles' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Petugas Role */}
              <div className="card bg-base-100 border border-base-300 p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-3 pb-3 border-b border-base-300">
                  <div className="p-3 rounded-xl bg-info/15 text-info">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="badge badge-info text-[10px] font-extrabold uppercase">
                      Role: petugas
                    </span>
                    <h3 className="text-lg font-bold text-base-content">
                      {t('Staff Operasional / Petugas Shift', 'Operational Staff / Shift Officer')}
                    </h3>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-base-content/80">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>{t('Mengisi perhitungan fisik barang (Step 1 & Step 2).', 'Enter physical counts (Step 1 & Step 2).')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>{t('Menyimpan draft lokal otomatis saat proses hitung.', 'Save local drafts automatically during count.')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>{t('Membagikan struk transaksi SO ke grup WhatsApp.', 'Share SO transaction receipt to WhatsApp group.')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
                    <span>{t('Melihat riwayat laporan cabang tempat bertugas.', 'View history reports for assigned branch.')}</span>
                  </li>
                </ul>
              </div>

              {/* Admin Role */}
              <div className="card bg-base-100 border border-base-300 p-6 space-y-4 shadow-sm">
                <div className="flex items-center gap-3 pb-3 border-b border-base-300">
                  <div className="p-3 rounded-xl bg-primary/15 text-primary">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="badge badge-primary text-[10px] font-extrabold uppercase">
                      Role: admin
                    </span>
                    <h3 className="text-lg font-bold text-base-content">
                      {t('Kepala Cabang / Admin / Owner', 'Branch Manager / Admin / Owner')}
                    </h3>
                  </div>
                </div>

                <ul className="space-y-2.5 text-xs text-base-content/80">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{t('Memiliki seluruh hak akses Petugas.', 'Has all privileges of Staff Officers.')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{t('Mengakses Dashboard Analitik Harian & Mingguan.', 'Access Daily & Weekly Analytics Dashboard.')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{t('Mengelola Master Item & mengeset Threshold Minimum.', 'Manage Master Items & set Minimum Thresholds.')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{t('Fitur Regenerate Spreadsheet & Cabang Switcher.', 'Regenerate Spreadsheet & Branch Switcher features.')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 3: WORKFLOW & RECEIPT */}
        {activeTab === 'workflow' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>{t('Alur Pengisian SO & Struk Transaksi Digital', 'SO Input Workflow & Digital Receipt')}</span>
              </h2>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-base-200/60 border border-base-300 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary text-primary-content font-mono font-bold text-xs">
                    01
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-base-content">{t('Isi Header Sesi SO', 'Fill SO Session Header')}</h4>
                    <p className="text-xs text-base-content/60">{t('Pilih Tanggal Operasional, Shift (OPENING/CLOSING), dan Nama Petugas.', 'Select Operational Date, Shift (OPENING/CLOSING), and Staff Name.')}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-base-200/60 border border-base-300 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary text-primary-content font-mono font-bold text-xs">
                    02
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-base-content">{t('Input Perhitungan S1 & S2', 'Enter S1 & S2 Counts')}</h4>
                    <p className="text-xs text-base-content/60">{t('S1 = Display Kasir/Meja Utama, S2 = Freezer/Chiller/Gudang. Sistem otomatis menjumlahkan Total = S1 + S2.', 'S1 = Display Area, S2 = Storage/Freezer. System calculates Total = S1 + S2.')}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-base-200/60 border border-base-300 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary text-primary-content font-mono font-bold text-xs">
                    03
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-base-content">{t('Fitur Auto-Save Draft Lokal', 'Auto-Save Local Draft Feature')}</h4>
                    <p className="text-xs text-base-content/60">{t('Jika browser tertutup atau HP mati saat mengisi 136 item, sistem menyimpan draft lokal otomatis. Klik "Lanjutkan Draft" saat membuka kembali.', 'If browser closes or phone turns off during input, draft is saved locally. Click "Restore Draft" upon re-opening.')}</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-base-200/60 border border-base-300 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary text-primary-content font-mono font-bold text-xs">
                    04
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-base-content">{t('Struk Transaksi & WhatsApp Share', 'Transaction Receipt & WhatsApp Share')}</h4>
                    <p className="text-xs text-base-content/60">{t('Setelah submit, halaman konfirmasi menampilkan Struk Transaksi Digital. Klik "Siapkan Pesan WhatsApp" untuk membagikan ke grup cabang.', 'After submission, confirmation page displays a Digital Transaction Receipt. Click "Prepare WhatsApp Message" to share.')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 4: THRESHOLD LOGIC */}
        {activeTab === 'threshold' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
                <Table className="w-5 h-5 text-primary" />
                <span>{t('Aturan Logika Penentuan Status Stok', 'Stock Status Rules & Logic')}</span>
              </h2>

              <div className="overflow-x-auto">
                <table className="table w-full text-xs">
                  <thead>
                    <tr className="bg-base-200">
                      <th>{t('Nilai Threshold', 'Threshold Value')}</th>
                      <th>{t('Stok Fisik Total (T)', 'Total Physical Stock (T)')}</th>
                      <th>{t('Status Hasil', 'Resulting Status')}</th>
                      <th>{t('Warna Badge', 'Badge Color')}</th>
                      <th>{t('Arti Operasional', 'Operational Meaning')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-mono font-bold">0</td>
                      <td className="font-mono">T = 0</td>
                      <td><span className="badge badge-error font-bold">KRITIS</span></td>
                      <td>🔴 Red</td>
                      <td>{t('Threshold 0, stok habis (0) -> Kritis', 'Threshold 0, zero stock -> Critical')}</td>
                    </tr>
                    <tr>
                      <td className="font-mono font-bold">0</td>
                      <td className="font-mono">T &gt; 0</td>
                      <td><span className="badge badge-success font-bold">AMAN</span></td>
                      <td>🟢 Green</td>
                      <td>{t('Threshold 0, ada stok fisik -> Aman', 'Threshold 0, physical stock available -> Safe')}</td>
                    </tr>
                    <tr>
                      <td className="font-mono font-bold">100</td>
                      <td className="font-mono">T &le; 100</td>
                      <td><span className="badge badge-error font-bold">KRITIS</span></td>
                      <td>🔴 Red</td>
                      <td>{t('Stok di bawah batas minimum -> Restock Urgent!', 'Stock below minimum limit -> Urgent Restock!')}</td>
                    </tr>
                    <tr>
                      <td className="font-mono font-bold">100</td>
                      <td className="font-mono">100 &lt; T &le; 200</td>
                      <td><span className="badge badge-warning font-bold">HAMPIR HABIS</span></td>
                      <td>🟡 Yellow</td>
                      <td>{t('Stok mendekati batas minimum (T <= Threshold x 2)', 'Stock near minimum limit (T <= Threshold x 2)')}</td>
                    </tr>
                    <tr>
                      <td className="font-mono font-bold">Blank / null</td>
                      <td className="font-mono">Any</td>
                      <td><span className="badge badge-ghost font-bold">Tidak Dipantau</span></td>
                      <td>⚪ Gray</td>
                      <td>{t('Threshold tidak di-set di Master Item', 'Threshold not set in Master Items')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* SECTION 5: FAQ & TROUBLESHOOTING */}
        {activeTab === 'faq' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="card bg-base-100 border border-base-300 p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-xl font-bold text-base-content flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary" />
                <span>{t('Troubleshooting & Pertanyaan Sering Diajukan', 'Troubleshooting & Frequently Asked Questions')}</span>
              </h2>

              <div className="space-y-3">
                {faqList.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-base-300 rounded-xl overflow-hidden transition-colors bg-base-100"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full p-4 text-left font-bold text-sm text-base-content flex items-center justify-between gap-3 hover:bg-base-200/50"
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          openFaq === idx ? 'rotate-180 text-primary' : 'text-base-content/50'
                        }`}
                      />
                    </button>
                    {openFaq === idx && (
                      <div className="p-4 pt-0 text-xs text-base-content/70 leading-relaxed border-t border-base-200 bg-base-200/30">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
