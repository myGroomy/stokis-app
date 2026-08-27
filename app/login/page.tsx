"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { QuantumLoaderMini } from "@/components/ui/QuantumLoader";

const PIN_LENGTH = 6;

export default function LoginPage() {
  const { login, loading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <QuantumLoaderMini />
        <span className="ml-3 text-[#1868DB] text-sm font-medium">Memuat...</span>
      </div>
    );
  }

  const pin = digits.join("");

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (!/^\d*$/.test(value)) return;

    const next = [...digits];
    next[index] = value;
    setDigits(next);

    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);
    const focusIdx = Math.min(pasted.length, PIN_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || pin.length < PIN_LENGTH) {
      setError("Username dan PIN 6 digit wajib diisi");
      return;
    }
    setSubmitting(true);
    const result = await login(username.trim(), pin);
    setSubmitting(false);
    if (result.success) {
      router.push("/");
      router.refresh();
    } else {
      setError(result.error || "Login gagal");
      setDigits(Array(PIN_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="bg-white border border-[#DCDFE4] rounded-[4px] p-8 shadow-sm"
        >
          <div className="flex flex-col items-center mb-6">
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              src="/favicon.jpg"
              alt="Stokis"
              className="w-14 h-14 rounded-lg shadow-sm object-cover mb-3"
            />
            <h1 className="text-lg font-bold text-[#172B4D]">
              Masuk ke Stokis
            </h1>
            <p className="text-xs text-[#6B778C] mt-1">
              Masukkan username dan PIN Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <label className="block text-xs font-semibold text-[#44546F] mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                autoComplete="username"
                className="w-full px-3 py-2 min-h-[40px] text-sm border border-[#DCDFE4] rounded-[4px] focus:border-[#1868DB] focus:ring-1 focus:ring-[#1868DB] outline-none transition-colors bg-[#FAFBFC]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
            >
              <label className="block text-xs font-semibold text-[#44546F] mb-2">
                PIN (6 Digit)
              </label>
              <div
                className="flex items-center justify-center gap-2"
                onPaste={handlePaste}
              >
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleDigitChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-bold font-mono border border-[#DCDFE4] rounded-[4px] focus:border-[#1868DB] focus:ring-1 focus:ring-[#1868DB] outline-none transition-colors bg-[#FAFBFC] tabular-nums"
                  />
                ))}
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#FFEBE6] border border-[#FF8F73] rounded-[4px] px-3 py-2"
                >
                  <p className="text-xs font-medium text-[#BF2600]">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting || loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 bg-[#1868DB] hover:bg-[#1557B0] text-white font-semibold text-sm px-4 py-2 min-h-[40px] rounded-[4px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <QuantumLoaderMini />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Masuk</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="text-center text-[10px] text-[#6B778C] mt-4"
        >
          Stokis v1.0 - Sistem Stock Opname
        </motion.p>
      </motion.div>
    </div>
  );
}
