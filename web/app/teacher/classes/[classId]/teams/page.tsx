import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function TeacherTeamsPage({
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
      teams: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, image: true, email: true } },
            },
          },
        },
      },
      members: {
        where: { role: "STUDENT" },
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      },
    },
  })
  if (!classroom) notFound()

  const unassignedStudents = classroom.members.filter(
    (m) => !classroom.teams.some((t) => t.members.some((tm) => tm.userId === m.userId))
  )

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
              <span>👥</span> 隊伍管理
            </h1>
            <p className="text-zinc-400 mt-2">
              建立並管理隊伍，將學生分配到不同小組
            </p>
          </div>
        </div>

        {/* 建立新隊伍 */}
        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-6">
          <h2 className="text-lg font-semibold mb-4">建立新隊伍</h2>
          <form action={`/api/classrooms/${classId}/teams`} method="POST" className="flex gap-3">
            <input
              type="text"
              name="name"
              placeholder="輸入隊伍名稱"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
              required
            />
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 rounded-xl font-semibold hover:bg-green-500 transition"
            >
              + 建立隊伍
            </button>
          </form>
        </div>

        {/* 未分配學生 */}
        {unassignedStudents.length > 0 && (
          <div className="rounded-2xl bg-yellow-900/20 border border-yellow-700 p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚠️</span> 未分配學生 ({unassignedStudents.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {unassignedStudents.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-lg"
                >
                  {m.user.image ? (
                    <img src={m.user.image} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center text-xs">
                      {(m.user.name ?? "?")[0]}
                    </div>
                  )}
                  <span className="text-sm">{m.user.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 現有隊伍 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>⚔️</span> 現有隊伍 ({classroom.teams.length})
          </h2>

          {classroom.teams.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-800/30 p-12 text-center">
              <p className="text-xl font-medium">尚未建立任何隊伍</p>
              <p className="text-sm text-zinc-500 mt-2">使用上方表單建立第一個隊伍</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {classroom.teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-xl border border-zinc-700 bg-zinc-800/50 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{team.name}</h3>
                    <span className="text-sm text-zinc-500">
                      {team.members.length} 位成員
                    </span>
                  </div>

                  {/* 隊員列表 */}
                  <div className="space-y-2 mb-4">
                    {team.members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-2 bg-zinc-900/50 rounded-lg"
                      >
                        {m.user.image ? (
                          <img src={m.user.image} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center">
                            {(m.user.name ?? "?")[0]}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.user.name}</p>
                          <p className="text-xs text-zinc-500 truncate">{m.user.email}</p>
                        </div>
                        <form
                          action={`/api/teams/${team.id}/members?removeUserId=${m.userId}`}
                          method="POST"
                        >
                          <button
                            type="submit"
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            移除
                          </button>
                        </form>
                      </div>
                    ))}
                  </div>

                  {/* 添加隊員 */}
                  <form
                    action={`/api/teams/${team.id}/members`}
                    method="POST"
                    className="flex gap-2"
                  >
                    <select
                      name="userId"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm"
                      required
                    >
                      <option value="">選擇學生...</option>
                      {unassignedStudents.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-purple-600 rounded-lg text-sm hover:bg-purple-500"
                    >
                      + 加入
                    </button>
                  </form>
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
            href={`/teacher/classes/${classId}/boss`}
            className="px-6 py-3 bg-red-600 rounded-xl hover:bg-red-500 transition"
          >
            魔王對決
          </Link>
        </div>
      </div>
    </main>
  )
}
