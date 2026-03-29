"use client";

import { useState } from "react";

export function JoinClassroomButton() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/classrooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inviteCode: code }),
    });
    if (!res.ok) {
      const data = await res.json();
      setLoading(false);
      return setError(data.error ?? "加入失敗");
    }
    window.location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
      >
        🔑 加入世界
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-800 border border-zinc-700 p-6">
            <h2 className="text-lg font-bold text-white">加入新世界</h2>
            <p className="mt-1 text-sm text-zinc-400">輸入導師給你的邀請碼</p>
            <form onSubmit={handleJoin} className="mt-4 space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="例：ACEDOG"
                className="w-full rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-3 text-sm text-white outline-none focus:border-purple-500 placeholder:text-zinc-600"
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-xl border border-zinc-600 py-3 text-sm font-medium text-zinc-300 hover:bg-zinc-700"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
                >
                  {loading ? "加入中..." : "加入"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
