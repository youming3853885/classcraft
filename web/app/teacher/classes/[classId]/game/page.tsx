import { notFound, redirect } from "next/navigation"

import Link from "next/link"
import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function TeacherGameDashboardPage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const session = await getServerAuthSession()
  if (!session?.user) redirect("/signin")

  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    redirect("/student/dashboard")
  }

  const { classId } = await params

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!dbUser?.name) redirect("/onboarding")

  // 驗證權限
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId: classId, userId: session.user.id } },
  })
  if (!member || member.role !== "TEACHER") {
    redirect("/teacher/classes")
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  })
  if (!classroom) notFound()

  const students = await Promise.all(
    classroom.members
      .filter((m) => m.role === "STUDENT")
      .map(async (m) => {
        const xpResult = await prisma.pointsLedger.aggregate({
          where: { targetUserId: m.userId, classroomId: classId },
          _sum: { xpDelta: true },
        })
        const hpResult = await prisma.pointsLedger.aggregate({
          where: { targetUserId: m.userId, classroomId: classId },
          _sum: { hpDelta: true },
        })
        const wallet = await prisma.wallet.findUnique({
          where: {
            userId_classroomId_currency: { userId: m.userId, classroomId: classId, currency: "COINS" },
          },
        })

        const totalXp = classroom.initialXp + (xpResult._sum.xpDelta ?? 0)
        const totalHp = Math.min(classroom.maxHp, classroom.initialHp + (hpResult._sum.hpDelta ?? 0))
        const totalCoins = wallet?.balance ?? 0

        return {
          id: m.userId,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
          hp: totalHp,
          maxHp: classroom.maxHp,
          xp: totalXp,
          coins: totalCoins,
        }
      })
  )

  const totalHp = students.reduce((sum, s) => sum + s.hp, 0)
  const maxTotalHp = students.reduce((sum, s) => sum + s.maxHp, 0)
  const totalXp = students.reduce((sum, s) => sum + s.xp, 0)
  const totalCoins = students.reduce((sum, s) => sum + s.coins, 0)

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-100">
      {/* 頂部導航 */}
      <header className="border-b border-zinc-700 bg-zinc-900/80 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href={`/teacher/classes/${classId}`} className="flex items-center gap-3 hover:opacity-80">
            <span className="text-2xl">←</span>
            <span className="font-bold">{classroom.name}</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={`/teacher/classes/${classId}/quests`}
              className="px-4 py-2 bg-purple-600 rounded-lg text-sm font-semibold hover:bg-purple-500"
            >
              冒險任務
            </Link>
            <Link
              href={`/teacher/classes/${classId}/boss`}
              className="px-4 py-2 bg-red-600 rounded-lg text-sm font-semibold hover:bg-red-500"
            >
              魔王對決
            </Link>
            <Link
              href={`/teacher/classes/${classId}/events`}
              className="px-4 py-2 bg-yellow-600 rounded-lg text-sm font-semibold hover:bg-yellow-500"
            >
              命運之輪
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* 總覽卡片 */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-red-500/30 bg-red-900/20 p-5">
            <p className="text-sm text-red-400">全班總血量</p>
            <p className="text-3xl font-bold text-red-400">{totalHp} / {maxTotalHp}</p>
            <div className="mt-2 h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
                style={{ width: `${maxTotalHp > 0 ? (totalHp / maxTotalHp) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-purple-500/30 bg-purple-900/20 p-5">
            <p className="text-sm text-purple-400">全班總經驗值</p>
            <p className="text-3xl font-bold text-purple-400">{totalXp.toLocaleString()} XP</p>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-900/20 p-5">
            <p className="text-sm text-amber-400">全班總金幣</p>
            <p className="text-3xl font-bold text-amber-400">{totalCoins.toLocaleString()} Coins</p>
          </div>
        </div>

        {/* 學生狀態列表 */}
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>🧙</span> 英雄狀態
        </h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {students.map((student) => {
            const hpPercent = (student.hp / student.maxHp) * 100
            const isLowHp = hpPercent <= 30

            return (
              <div
                key={student.id}
                className={`rounded-xl border p-4 transition ${
                  isLowHp
                    ? "border-red-500/50 bg-red-900/20"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-purple-500"
                }`}
              >
                <div className="flex items-center gap-3">
                  {student.image ? (
                    <img src={student.image} alt={student.name ?? ""} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-bold">
                      {(student.name ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{student.name ?? "未命名"}</p>
                    <p className="text-xs text-zinc-500 truncate">{student.email}</p>
                  </div>
                </div>

                {/* HP 條 */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className={isLowHp ? "text-red-400" : "text-zinc-400"}>HP</span>
                    <span className="text-zinc-400">{student.hp} / {student.maxHp}</span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-900 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isLowHp
                          ? "bg-gradient-to-r from-red-600 to-red-400"
                          : "bg-gradient-to-r from-green-600 to-green-400"
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    />
                  </div>
                </div>

                {/* XP & Coins */}
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-purple-400">{student.xp.toLocaleString()} XP</span>
                  <span className="text-amber-400">{student.coins} Coins</span>
                </div>

                {/* 快速調整 */}
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/teacher/grading?classroom=${classId}&student=${student.id}`}
                    className="flex-1 text-center text-xs py-1.5 bg-zinc-700 rounded hover:bg-zinc-600 transition"
                  >
                    作業
                  </Link>
                  <Link
                    href={`/api/classrooms/${classId}/adjust?userId=${student.id}`}
                    className="flex-1 text-center text-xs py-1.5 bg-purple-700 rounded hover:bg-purple-600 transition"
                  >
                    調整
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {students.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-800/30 p-12 text-center text-zinc-500">
            尚無學生加入
          </div>
        )}
      </div>
    </main>
  )
}
