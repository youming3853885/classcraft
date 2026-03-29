"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCoursePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError("請輸入課程名稱");
    setLoading(true);
    setError("");
    const res = await fetch(`/api/classrooms/${params.id}/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });
    if (!res.ok) {
      const data = await res.json();
      setLoading(false);
      return setError(data.error ?? "建立失敗");
    }
    router.push(`/dashboard/classrooms/${params.id}`);
  }

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-zinc-200 bg-white p-8">
        <h1 className="text-2xl font-bold">新增課程</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">課程名稱</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：第一章 基礎概念"
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">說明（選填）</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-300 px-4 py-3 text-sm outline-none focus:border-zinc-500 resize-none"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => router.back()}
              className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition">
              取消
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 transition disabled:opacity-50">
              {loading ? "建立中..." : "建立課程"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
