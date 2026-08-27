"use client";

import React, { useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

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
        <div className="w-6 h-6 border-2 border-[#1868DB] border-t-transparent rounded-full animate-spin" />
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
      <div className="w-full max-w-sm">
        <div className="bg-white border border-[#DCDFE4] rounded-[4px] p-8">
          <div className="flex flex-col items-center mb-6">
            <img
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
            <div>
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
            </div>

            <div>
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
            </div>

            {error && (
              <div className="bg-[#FFEBE6] border border-[#FF8F73] rounded-[4px] px-3 py-2">
                <p className="text-xs font-medium text-[#BF2600]">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full flex items-center justify-center gap-2 bg-[#1868DB] hover:bg-[#1557B0] text-white font-semibold text-sm px-4 py-2 min-h-[40px] rounded-[4px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-[#6B778C] mt-4">
          Stokis v1.0 - Sistem Stock Opname
        </p>
      </div>
    </div>
  );
}
