"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

interface Quest {
  id: string;
  title: string;
  description: string | null;
  xpReward: number;
  coinReward: number;
  hpReward: number;
  isRequired: boolean;
  orderIndex: number;
}

export default function QuestsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newXp, setNewXp] = useState(10);
  const [newCoins, setNewCoins] = useState(5);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createQuest(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true); setError("");
    const res = await fetch(`/api/classrooms/${params.id}/quests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, xpReward: newXp, coinReward: newCoins }),
    });
    if (res.ok) {
      setNewTitle("");
      router.refresh();
    } else {
      setError("建立失敗");
    }
    setCreating(false);
  }

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="flex items-center gap-2 text-white/40 hover:text-white/80 transition cursor-pointer">
              <Image src="/logo.png" alt="Classcraft" width={22} height={22} className="opacity-60" />
              <span className="text-sm">← 返回</span>
            </button>
            <span className="text-[#CA8A04]/30">/</span>
            <span className="text-sm font-bold text-[#CA8A04]">冒險任務</span>
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>冒險任務</h1>
          <p className="text-sm text-white/40 mt-1">建立與管理班級任務</p>
        </div>

        {/* Create form */}
        <form onSubmit={createQuest} className="relative rounded-2xl border border-[#CA8A04]/20 bg-[#1C1917]/80 p-5 space-y-4">
          <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#CA8A04]/30 rounded-tl-sm" />
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">建立新任務</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="sm:col-span-4">
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="任務名稱"
                className="w-full rounded-xl border border-white/10 bg-[#0C0A09]/60 px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-[#CA8A04]/50" />
            </div>
            <div>
              <input type="number" value={newXp} onChange={e => setNewXp(Number(e.target.value))} placeholder="XP"
                className="w-full rounded-xl border border-white/10 bg-[#0C0A09]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <input type="number" value={newCoins} onChange={e => setNewCoins(Number(e.target.value))} placeholder="金幣"
                className="w-full rounded-xl border border-white/10 bg-[#0C0A09]/60 px-4 py-2.5 text-sm text-white outline-none focus:border-[#CA8A04]/50" />
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={creating || !newTitle.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-[#CA8A04] to-[#D97706] py-2.5 text-sm font-black text-[#0C0A09] tracking-wider uppercase hover:shadow-lg hover:shadow-[#CA8A04]/20 transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed">
                {creating ? "建立中..." : "✦ 建立任務"}
              </button>
            </div>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>

        {quests.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/15 p-12 text-center">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="mx-auto opacity-15 mb-3" />
            <p className="text-white/30 text-sm">尚無任務 — 功能開發中</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quests.map((quest, i) => (
              <div key={quest.id} className="relative rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 flex items-center justify-between">
                <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t border-l border-[#CA8A04]/15 rounded-tl-sm" />
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#CA8A04]/10 border border-[#CA8A04]/30 flex items-center justify-center text-xs font-black text-[#CA8A04]">{i + 1}</span>
                  <div>
                    <p className="font-bold text-sm text-white">{quest.title}</p>
                    <div className="flex gap-2 text-xs font-bold mt-0.5">
                      {quest.xpReward > 0 && <span className="text-amber-400">+{quest.xpReward} XP</span>}
                      {quest.coinReward > 0 && <span className="text-[#CA8A04]">+{quest.coinReward} 金</span>}
                    </div>
                  </div>
                </div>
                {quest.isRequired && <span className="text-xs rounded-lg border border-red-500/40 bg-red-900/20 px-2 py-0.5 text-red-400 font-bold">必修</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
