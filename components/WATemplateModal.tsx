'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, FileText, User, Calendar, Clock } from 'lucide-react';
import { fadeIn, scaleIn } from './PageTransition';

interface WATemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabangNama: string;
  tanggal: string;
  shift: string;
  petugas: string;
  totalItem: number;
  jumlahKritis: number;
  jumlahHampirHabis: number;
  linkPDF: string;
}

export function WATemplateModal({ isOpen, onClose, ...data }: WATemplateModalProps) {
  const [copied, setCopied] = React.useState(false);

  const templateText = `
📊 *LAPORAN STOCK OPNAME*
━━━━━━━━━━━━━━━━━━━━
📍 *Cabang:* ${data.cabangNama}
📅 *Tanggal:* ${data.tanggal}
⏰ *Shift:* ${data.shift.toUpperCase()}
👤 *Petugas:* ${data.petugas}
━━━━━━━━━━━━━━━━━━━━
📦 *Total Item:* ${data.totalItem}
🔴 *Kritis:* ${data.jumlahKritis}
🟡 *Hampir Habis:* ${data.jumlahHampirHabis}
━━━━━━━━━━━━━━━━━━━━
📄 *Laporan PDF:*
${data.linkPDF}
━━━━━━━━━━━━━━━━━━━━
Kirim via *WhatsApp*
`.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(templateText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        variants={fadeIn}
        className="bg-white rounded-xl border border-[#DCDFE4] shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#DCDFE4] bg-[#E9F2FF]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#22A06B]">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-[#172B4D] text-base">Siapkan Pesan WhatsApp</h2>
              <p className="text-xs text-[#44546F]">Salin teks laporan untuk dikirim</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#44546F] hover:text-[#CA3521] hover:bg-[#FFEBE6] rounded transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Preview cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#44546F] uppercase">
                <Calendar className="w-3.5 h-3.5" /> Tanggal
              </div>
              <div className="px-3 py-2 bg-[#F1F2F4] rounded text-sm font-semibold text-[#172B4D]">{data.tanggal}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#44546F] uppercase">
                <Clock className="w-3.5 h-3.5" /> Shift
              </div>
              <div className="px-3 py-2 bg-[#F1F2F4] rounded text-sm font-semibold text-[#172B4D]">{data.shift}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#44546F] uppercase">
                <User className="w-3.5 h-3.5" /> Petugas
              </div>
              <div className="px-3 py-2 bg-[#F1F2F4] rounded text-sm font-semibold text-[#172B4D] truncate">{data.petugas}</div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-[#44546F] uppercase">
                <FileText className="w-3.5 h-3.5" /> Status
              </div>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#F1F2F4] rounded">
                <span className="text-xs font-bold text-[#CA3521]">{data.jumlahKritis} Kritis</span>
                <span className="text-xs font-bold text-[#B38600]">{data.jumlahHampirHabis} Hampir Habis</span>
              </div>
            </div>
          </div>

          {/* Template Text Area */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#44546F] uppercase">Template Pesan</label>
            <div className="relative">
              <textarea
                value={templateText}
                readOnly
                className="w-full h-32 px-3 py-2 text-xs font-mono border border-[#DCDFE4] rounded-[4px] focus:ring-1 focus:ring-[#1868DB] focus:border-[#1868DB] outline-none bg-[#FAFBFC]"
              />
              <button
                onClick={handleCopy}
                className="absolute right-2 top-2 p-1.5 text-[#44546F] hover:text-[#1868DB] bg-white border border-[#DCDFE4] rounded hover:bg-[#E9F2FF] transition-colors"
                title="Salin ke Clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-[#216E4E]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {copied && (
            <div className="flex items-center gap-2 text-xs text-[#216E4E] font-medium bg-[#E3FCEF] px-3 py-2 rounded border border-[#BAF3DB] animate-in fade-in slide-in-from-top-1 duration-200">
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Pesan berhasil disalin!</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0 border-t border-[#DCDFE4]">
          <button
            onClick={onClose}
            className="flex-1 btn-default px-4 py-2.5 text-sm font-medium min-h-[42px]"
          >
            Tutup
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(templateText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#22A06B] hover:bg-[#216E4E] text-white px-4 py-2.5 rounded font-medium text-sm transition-colors min-h-[42px]"
          >
            <FileText className="w-4 h-4" />
            Kirim ke WhatsApp
          </a>
        </div>
      </motion.div>
    </motion.div>
  );
}
