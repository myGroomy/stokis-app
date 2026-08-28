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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <div
          className="p-8 rounded-xl"
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl mb-4"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-text-inverse)' }}
            >
              S
            </motion.div>
            <h1
              className="text-xl font-bold"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Masuk ke Stokis
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Masukkan username dan PIN Anda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <label
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                autoComplete="username"
                className="w-full px-3 py-2.5 min-h-[42px] text-sm"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <label
                className="block text-xs font-semibold mb-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
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
                    className="w-12 h-13 text-center text-lg font-bold font-mono tabular-nums"
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
                  className="rounded-lg px-4 py-3"
                  style={{
                    backgroundColor: 'var(--color-danger-subtle)',
                    border: '1px solid var(--color-danger-border)',
                  }}
                >
                  <p className="text-xs font-medium" style={{ color: 'var(--color-danger)' }}>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              type="submit"
              disabled={submitting || loading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 btn-primary px-4 py-2.5 min-h-[42px] text-sm"
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
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-center text-[11px] mt-5"
          style={{ color: 'var(--color-text-disabled)' }}
        >
          Stokis v1.0 &middot; Sistem Stock Opname
        </motion.p>
      </motion.div>
    </div>
  );
}
