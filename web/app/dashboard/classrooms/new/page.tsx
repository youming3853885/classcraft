"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewClassroomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("請輸入班級名稱");
    setLoading(true); setError("");
    const res = await fetch("/api/classrooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await res.json();
      setLoading(false);
      return setError(data.error ?? "建立失敗");
    }
    const classroom = await res.json();
    router.push(`/dashboard/classrooms/${classroom.id}`);
  }

  return (
    <main className="relative min-h-screen bg-[#0C0A09] flex items-center justify-center px-4 overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Back link */}
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-white/40 hover:text-[#CA8A04] transition-colors cursor-pointer w-fit">
          ← 返回主頁
        </Link>

        {/* Card */}
        <div className="relative rounded-2xl border border-[#CA8A04]/30 bg-[#1C1917]/90 p-8 space-y-6 shadow-[0_0_40px_rgba(202,138,4,0.1)]">
          {/* Corner runes */}
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#CA8A04]/50 rounded-tl-md" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#CA8A04]/50 rounded-tr-md" />
          <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#CA8A04]/50 rounded-bl-md" />
          <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#CA8A04]/50 rounded-br-md" />

          <div className="text-center">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="mx-auto mb-3 drop-shadow-[0_0_12px_rgba(202,138,4,0.7)]" />
            <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>建立新世界</h1>
            <p className="text-xs text-white/40 mt-1">為你的學生創建一個全新的冒險班級</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#CA8A04]/70 tracking-wider uppercase">班級名稱</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例：高一甲班 2026"
                className="w-full rounded-xl border border-white/10 bg-[#0C0A09]/60 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#CA8A04]/60 focus:ring-1 focus:ring-[#CA8A04]/30 transition-all"
                style={{ fontFamily: "'Exo 2', sans-serif" }}
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-900/10 px-4 py-3 text-sm text-red-400">
                ⚠ {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/50 hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#CA8A04] to-[#D97706] py-3 text-sm font-black text-[#0C0A09] tracking-wider uppercase hover:shadow-lg hover:shadow-[#CA8A04]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "建立中..." : "✦ 建立班級"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
