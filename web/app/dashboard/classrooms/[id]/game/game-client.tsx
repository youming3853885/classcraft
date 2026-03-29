"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { StudentCard } from "@/components/student-card";

interface Student {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  hp: number;
  maxHp: number;
  xp: number;
  coins: number;
}

export default function GameDashboardClient({
  classroomId,
  initialStudents,
  classroomName,
  isTeacher,
}: {
  classroomId: string;
  initialStudents: Student[];
  classroomName: string;
  isTeacher: boolean;
}) {
  const router = useRouter();
  const [students, setStudents] = useState(initialStudents);

  const totalHp = students.reduce((sum, s) => sum + s.hp, 0);
  const maxTotalHp = students.reduce((sum, s) => sum + s.maxHp, 0);
  const totalXp = students.reduce((sum, s) => sum + s.xp, 0);
  const totalCoins = students.reduce((sum, s) => sum + s.coins, 0);

  function handleUpdate() {
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/dashboard/classrooms/${classroomId}`} className="text-zinc-500 hover:text-zinc-800">
              {classroomName}
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="font-semibold">遊戲儀表板</span>
          </div>
          <div className="flex items-center gap-3">
            {isTeacher && (
              <Link
                href={`/dashboard/classrooms/${classroomId}/quests`}
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
              >
                冒險任務
              </Link>
            )}
            {isTeacher && (
              <Link
                href={`/dashboard/classrooms/${classroomId}/boss`}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                魔王對決
              </Link>
            )}
            {isTeacher && (
              <Link
                href={`/dashboard/classrooms/${classroomId}/events`}
                className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
              >
                命運之輪
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-600">全班總血量</p>
            <p className="text-3xl font-bold text-red-700">{totalHp} / {maxTotalHp}</p>
            <div className="mt-2 h-2 rounded-full bg-red-200 overflow-hidden">
              <div className="h-full bg-red-500 transition-all" style={{ width: `${maxTotalHp > 0 ? (totalHp / maxTotalHp) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-600">全班總經驗值</p>
            <p className="text-3xl font-bold text-amber-700">{totalXp.toLocaleString()} XP</p>
          </div>
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-5">
            <p className="text-sm text-yellow-600">全班總金幣</p>
            <p className="text-3xl font-bold text-yellow-700">{totalCoins.toLocaleString()} Coins</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold mb-6">學生狀態</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {students.map((student) => (
            <StudentCard key={student.id} classroomId={classroomId} student={student} onUpdate={handleUpdate} />
          ))}
        </div>

        {students.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
            尚無學生加入
          </div>
        )}
      </div>
    </main>
  );
}
