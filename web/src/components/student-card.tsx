"use client";

import { useState } from "react";

interface Student {
  id: string;
  name: string | null;
  image: string | null;
  hp: number;
  maxHp: number;
  xp: number;
  coins: number;
}

export function StudentCard({ classroomId, student, onUpdate }: { classroomId: string; student: Student; onUpdate: () => void }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function adjustPoints(action: string, amount: number = 10) {
    setLoading(action);
    const res = await fetch(`/api/classrooms/${classroomId}/adjust`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: student.id, action, amount }),
    });

    if (res.ok) {
      onUpdate();
    }
    setLoading(null);
  }

  const hpPercent = (student.hp / student.maxHp) * 100;
  const hpColor = hpPercent <= 20 ? "bg-red-600" : hpPercent <= 50 ? "bg-yellow-500" : "bg-green-500";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center gap-3">
        {student.image ? (
          <img src={student.image} alt={student.name ?? ""} className="w-12 h-12 rounded-full" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center text-xl font-bold text-zinc-500">
            {(student.name ?? "?")[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-semibold">{student.name ?? "未命名"}</p>
        </div>
      </div>

      {/* HP 血條 */}
      <div className="mt-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-red-600">HP</span>
          <span className="text-zinc-500">{student.hp} / {student.maxHp}</span>
        </div>
        <div className="h-3 rounded-full bg-red-100 overflow-hidden">
          <div className={`h-full transition-all ${hpColor}`} style={{ width: `${hpPercent}%` }} />
        </div>
      </div>

      {/* XP */}
      <div className="mt-3 flex justify-between text-sm">
        <span className="text-amber-600">XP</span>
        <span className="font-semibold">{student.xp.toLocaleString()}</span>
      </div>

      {/* Coins */}
      <div className="mt-2 flex justify-between text-sm">
        <span className="text-yellow-600">Coins</span>
        <span className="font-semibold">{student.coins.toLocaleString()}</span>
      </div>

      {/* 快速操作 */}
      <div className="mt-4 pt-4 border-t border-zinc-100">
        <p className="text-xs text-zinc-400 mb-2">快速調整</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => adjustPoints("ADD_XP")}
            disabled={loading !== null}
            className="rounded-lg bg-green-100 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
          >
            {loading === "ADD_XP" ? "..." : "+XP"}
          </button>
          <button
            onClick={() => adjustPoints("ADD_HP")}
            disabled={loading !== null}
            className="rounded-lg bg-green-100 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
          >
            {loading === "ADD_HP" ? "..." : "+HP"}
          </button>
          <button
            onClick={() => adjustPoints("ADD_COINS")}
            disabled={loading !== null}
            className="rounded-lg bg-green-100 py-1.5 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
          >
            {loading === "ADD_COINS" ? "..." : "+Coins"}
          </button>
          <button
            onClick={() => adjustPoints("SUB_HP")}
            disabled={loading !== null}
            className="rounded-lg bg-red-100 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
          >
            {loading === "SUB_HP" ? "..." : "-HP"}
          </button>
          <button
            onClick={() => adjustPoints("SUB_COINS")}
            disabled={loading !== null}
            className="rounded-lg bg-red-100 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
          >
            {loading === "SUB_COINS" ? "..." : "-Coins"}
          </button>
          <button
            onClick={() => adjustPoints("ADD_XP", 50)}
            disabled={loading !== null}
            className="rounded-lg bg-purple-100 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-200 disabled:opacity-50"
          >
            {loading === "ADD_XP" ? "..." : "+50XP"}
          </button>
        </div>
      </div>
    </div>
  );
}
