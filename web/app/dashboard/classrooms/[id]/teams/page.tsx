"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Student {
  id: string;
  name: string | null;
  image: string | null;
}

interface Team {
  id: string;
  name: string;
  members: { userId: string; user: { id: string; name: string | null; image: string | null } }[];
}

export default function TeamsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(true);

  // TODO: Load teams and students

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    const res = await fetch(`/api/classrooms/${params.id}/teams`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTeamName }),
    });

    if (res.ok) {
      setNewTeamName("");
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/dashboard/classrooms/${params.id}`} className="text-zinc-500 hover:text-zinc-800">
              返回班級
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="font-semibold">團隊管理</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <h1 className="text-2xl font-bold">團隊管理</h1>

        {/* 建立團隊表單 */}
        <form onSubmit={createTeam} className="flex gap-2">
          <input
            type="text"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="輸入團隊名稱"
            className="flex-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
          >
            + 新增團隊
          </button>
        </form>

        <p className="text-sm text-zinc-500">功能開發中...</p>
      </div>
    </main>
  );
}
