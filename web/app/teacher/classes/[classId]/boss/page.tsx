import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function TeacherBossPage({
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
      bossBattles: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          questions: { orderBy: { orderIndex: "asc" } },
          _count: { select: { answers: true } },
        },
      },
    },
  })
  if (!classroom) notFound()

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-100">
      {/* 頂部導航 */}
      <header className="border-b border-zinc-700 bg-zinc-900/80 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href={`/teacher/classes/${classId}`} className="flex items-center gap-3 hover:opacity-80">
            <span className="text-2xl">←</span>
            <span className="font-bold">返回班級</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold">{classroom.name}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>👹</span> 魔王對決
            </h1>
            <p className="text-zinc-400 mt-2">
              將課堂測驗轉化為全班打怪遊戲！
            </p>
          </div>
        </div>

        {/* 建立新魔王 */}
        <div className="rounded-2xl bg-gradient-to-r from-red-900/30 to-orange-900/30 border border-red-700 p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👹</div>
            <h2 className="text-xl font-bold">建立新的魔王挑戰</h2>
            <p className="text-sm text-zinc-400 mt-2">
              學生答對扣魔王血量，答錯扣自己血量
            </p>
          </div>

          <form action={`/api/classrooms/${classId}/boss`} method="POST" className="space-y-4 max-w-lg mx-auto">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">魔王名稱</label>
              <input
                type="text"
                name="title"
                placeholder="例如：期末惡龍"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">魔王血量</label>
                <input
                  type="number"
                  name="bossHp"
                  defaultValue={100}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">答對扣血</label>
                <input
                  type="number"
                  name="correctDamage"
                  defaultValue={10}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">答錯扣血</label>
                <input
                  type="number"
                  name="wrongDamage"
                  defaultValue={5}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 rounded-xl font-bold hover:from-red-500 hover:to-orange-500 transition"
            >
              ⚔️ 發起挑戰
            </button>
          </form>
        </div>

        {/* 歷史魔王 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>📜</span> 歷史記錄
          </h2>

          {classroom.bossBattles.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-800/30 p-12 text-center">
              <p className="text-xl font-medium">尚無魔王記錄</p>
              <p className="text-sm text-zinc-500 mt-2">建立第一個魔王來開始挑戰吧！</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {classroom.bossBattles.map((boss) => (
                <div
                  key={boss.id}
                  className={`rounded-xl border p-5 ${
                    boss.isActive
                      ? "border-red-500 bg-red-900/20"
                      : "border-zinc-700 bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">{boss.title}</h3>
                    {boss.isActive && (
                      <span className="px-2 py-1 bg-red-600 rounded-full text-xs font-bold animate-pulse">
                        進行中
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-sm text-zinc-400 mb-4">
                    <span>HP: {boss.currentHp}/{boss.bossHp}</span>
                    <span>題目: {boss.questions.length}</span>
                    <span>作答: {boss._count.answers}</span>
                  </div>
                  <div className="flex gap-2">
                    {boss.isActive ? (
                      <Link
                        href={`/teacher/classes/${classId}/boss/${boss.id}`}
                        className="flex-1 text-center py-2 bg-red-600 rounded-lg hover:bg-red-500 transition"
                      >
                        繼續主持
                      </Link>
                    ) : (
                      <Link
                        href={`/teacher/classes/${classId}/boss/${boss.id}`}
                        className="flex-1 text-center py-2 bg-zinc-700 rounded-lg hover:bg-zinc-600 transition"
                      >
                        查看詳情
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 快速連結 */}
        <div className="flex gap-4 justify-center pt-8">
          <Link
            href={`/teacher/classes/${classId}/game`}
            className="px-6 py-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition"
          >
            返回遊戲儀表板
          </Link>
          <Link
            href={`/teacher/classes/${classId}/events`}
            className="px-6 py-3 bg-yellow-600 rounded-xl hover:bg-yellow-500 transition"
          >
            命運之輪
          </Link>
        </div>
      </div>
    </main>
  )
}
