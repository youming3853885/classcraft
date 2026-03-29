import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function TeacherEventsPage({
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
      randomEvents: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })
  if (!classroom) notFound()

  // 預設事件範本
  const defaultEvents = [
    { title: "幸運日", description: "今天所有人發言正確 +20 XP", xpDelta: 20, hpDelta: 0, coinDelta: 0 },
    { title: "沉默挑戰", description: "全班安靜 10 分鐘 +50 XP", xpDelta: 50, hpDelta: 0, coinDelta: 0 },
    { title: "補血時刻", description: "今天表現好的學生 +10 HP", xpDelta: 0, hpDelta: 10, coinDelta: 0 },
    { title: "金幣大放送", description: "全班 +5 Coins", xpDelta: 0, hpDelta: 0, coinDelta: 5 },
    { title: "XP 加成", description: "所有作業獎勵 XP 翻倍", xpDelta: 100, hpDelta: 0, coinDelta: 0 },
    { title: "HP 恢復", description: "全體學生 +20 HP", xpDelta: 0, hpDelta: 20, coinDelta: 0 },
  ]

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
              <span>🎲</span> 命運之輪
            </h1>
            <p className="text-zinc-400 mt-2">
              隨機觸發特殊事件，增加遊戲樂趣！
            </p>
          </div>
        </div>

        {/* 預設事件 */}
        <div className="rounded-2xl bg-yellow-900/20 border border-yellow-700 p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎡</div>
            <h2 className="text-xl font-bold">快速觸發事件</h2>
            <p className="text-sm text-zinc-400 mt-2">
              點擊即可觸發，立即發放獎勵
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {defaultEvents.map((event, i) => (
              <div
                key={i}
                className="rounded-xl border border-yellow-700/50 bg-zinc-900/50 p-4"
              >
                <h4 className="font-bold">{event.title}</h4>
                <p className="text-sm text-zinc-400 mt-1">{event.description}</p>
                <form action={`/api/classrooms/${classId}/events`} method="POST" className="mt-3">
                  <input type="hidden" name="title" value={event.title} />
                  <input type="hidden" name="description" value={event.description} />
                  <input type="hidden" name="xpDelta" value={event.xpDelta} />
                  <input type="hidden" name="hpDelta" value={event.hpDelta} />
                  <input type="hidden" name="coinDelta" value={event.coinDelta} />
                  <input type="hidden" name="triggerNow" value="true" />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-yellow-600 py-2 text-sm font-medium hover:bg-yellow-500 transition"
                  >
                    觸發事件
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* 建立自訂事件 */}
        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-6">
          <h2 className="text-lg font-semibold mb-4">建立自訂事件</h2>
          <form action={`/api/classrooms/${classId}/events`} method="POST" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">事件名稱</label>
                <input
                  type="text"
                  name="title"
                  placeholder="輸入事件名稱"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">觸發時間</label>
                <input
                  type="datetime-local"
                  name="triggerAt"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">事件描述</label>
              <input
                type="text"
                name="description"
                placeholder="輸入事件描述"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">XP 變化</label>
                <input
                  type="number"
                  name="xpDelta"
                  defaultValue={0}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">HP 變化</label>
                <input
                  type="number"
                  name="hpDelta"
                  defaultValue={0}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">金幣變化</label>
                <input
                  type="number"
                  name="coinDelta"
                  defaultValue={0}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                name="triggerNow"
                value="false"
                className="px-6 py-2 bg-zinc-700 rounded-xl hover:bg-zinc-600 transition"
              >
                儲存事件
              </button>
              <button
                type="submit"
                name="triggerNow"
                value="true"
                className="px-6 py-2 bg-yellow-600 rounded-xl hover:bg-yellow-500 transition"
              >
                儲存並觸發
              </button>
            </div>
          </form>
        </div>

        {/* 歷史事件 */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <span>📜</span> 歷史記錄
          </h2>

          {classroom.randomEvents.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-800/30 p-12 text-center">
              <p className="text-xl font-medium">尚無事件記錄</p>
              <p className="text-sm text-zinc-500 mt-2">觸發上方事件來開始吧！</p>
            </div>
          ) : (
            <div className="space-y-2">
              {classroom.randomEvents.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-xl border p-4 ${
                    event.isTriggered
                      ? "border-green-700/50 bg-green-900/20"
                      : "border-zinc-700 bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{event.title}</h3>
                      <p className="text-sm text-zinc-400">{event.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex gap-3 text-sm">
                        {event.xpDelta !== 0 && (
                          <span className="text-purple-400">XP {event.xpDelta > 0 ? "+" : ""}{event.xpDelta}</span>
                        )}
                        {event.hpDelta !== 0 && (
                          <span className="text-green-400">HP {event.hpDelta > 0 ? "+" : ""}{event.hpDelta}</span>
                        )}
                        {event.coinDelta !== 0 && (
                          <span className="text-amber-400">Coins {event.coinDelta > 0 ? "+" : ""}{event.coinDelta}</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {event.isTriggered ? "已觸發" : new Date(event.triggerAt).toLocaleString("zh-TW")}
                      </p>
                    </div>
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
