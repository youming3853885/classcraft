"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function NewAssignmentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [xpReward, setXpReward] = useState(10);
  const [coinReward, setCoinReward] = useState(5);
  const [dueAt, setDueAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("請輸入作業名稱");
    setLoading(true);
    setError("");
    const res = await fetch(`/api/courses/${params.id}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, xpReward, coinReward, dueAt: dueAt || null }),
    });
    if (!res.ok) {
      const data = await res.json();
      setLoading(false);
      return setError(data.error ?? "建立失敗");
    }
    router.back();
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8">
        <h1 className="text-2xl font-bold">新增作業</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">作業名稱</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="例：課後練習 1" className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">說明（選填）</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">XP 獎勵</label>
              <input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} min={0}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Coins 獎勵</label>
              <input type="number" value={coinReward} onChange={(e) => setCoinReward(Number(e.target.value))} min={0}
                className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">截止日期（選填）</label>
            <input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500" />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">
              取消
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition disabled:opacity-50">
              {loading ? "建立中..." : "建立作業"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
