"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function BossPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [bossHp, setBossHp] = useState(100);
  const [correctDamage, setCorrectDamage] = useState(10);
  const [wrongDamage, setWrongDamage] = useState(5);
  const [creating, setCreating] = useState(false);

  async function createBoss(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);

    // TODO: Call API to create boss battle

    setCreating(false);
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-800">
              ← 返回
            </button>
            <span className="text-zinc-300">/</span>
            <span className="font-semibold">魔王對決</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold">魔王對決</h1>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">👹</div>
            <h2 className="text-xl font-bold text-red-800">建立新的魔王挑戰</h2>
            <p className="text-sm text-red-600 mt-2">
              將課堂測驗轉化為全班打怪遊戲！學生答對扣魔王血量，答錯扣自己血量。
            </p>
          </div>

          <form onSubmit={createBoss} className="mt-6 space-y-4 max-w-md mx-auto">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">魔王名稱</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：期末惡龍"
                className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">魔王血量</label>
                <input
                  type="number"
                  value={bossHp}
                  onChange={(e) => setBossHp(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">答對扣血</label>
                <input
                  type="number"
                  value={correctDamage}
                  onChange={(e) => setCorrectDamage(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">答錯扣血</label>
                <input
                  type="number"
                  value={wrongDamage}
                  onChange={(e) => setWrongDamage(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {creating ? "建立中..." : "發起挑戰"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-zinc-500">功能開發中...</p>
      </div>
    </main>
  );
}
