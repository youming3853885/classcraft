import Link from "next/link"
import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function ParentDashboardPage() {
  const session = await getServerAuthSession()

  if (!session?.user) redirect("/signin")

  // 家長角色才能訪問
  if (session.user.role !== "PARENT") {
    redirect("/dashboard")
  }

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!dbUser?.name) redirect("/onboarding")

  // 取得家長監護的學生
  // 這裡需要 GuardianLink 模型，目前先用簡化的方式 - 取得所有與此 email 相關的學生
  const studentUsers = await prisma.user.findMany({
    where: {
      email: dbUser.email, // 假設家長與學生用同一個 email
    },
  })

  // 如果找不到，顯示引導畫面
  if (studentUsers.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-100">
        <header className="border-b border-zinc-700 bg-zinc-900/80 backdrop-blur px-6 py-4">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚔️</span>
              <span className="font-bold text-xl">Classcraft</span>
              <span className="ml-2 px-2 py-0.5 bg-blue-600 text-xs rounded-full">家長檢視</span>
            </div>
            <SignOutButton />
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-6 py-12 text-center">
          <div className="rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-800/30 p-12">
            <span className="text-6xl">👨‍👩‍👧</span>
            <h1 className="text-2xl font-bold mt-6">家長觀察模式</h1>
            <p className="text-zinc-400 mt-2">
              目前沒有關聯的學生帳戶
            </p>
            <p className="text-sm text-zinc-500 mt-4">
              請聯繫學校管理員將學生的帳戶與您的帳戶關聯
            </p>
          </div>
        </div>
      </main>
    )
  }

  // 取得每個學生的數據
  const studentData = await Promise.all(
    studentUsers.map(async (student) => {
      // 取得學生的班級
      const memberships = await prisma.classroomMember.findMany({
        where: { userId: student.id },
        include: { classroom: true },
      })

      // 取得總 XP
      const xp = await prisma.pointsLedger.aggregate({
        where: { targetUserId: student.id },
        _sum: { xpDelta: true },
      })

      // 取得已完成任務數
      const completedQuests = await prisma.questCompletion.count({
        where: { studentId: student.id },
      })

      // 取得總金幣
      const wallets = await prisma.wallet.findMany({
        where: { userId: student.id },
      })
      const totalCoins = wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0)

      return {
        student,
        memberships,
        totalXp: xp._sum.xpDelta ?? 0,
        completedQuests,
        totalCoins,
        level: Math.floor((xp._sum.xpDelta ?? 0) / 1000) + 1,
      }
    })
  )

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-100">
      {/* 頂部導航 */}
      <header className="border-b border-zinc-700 bg-zinc-900/80 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <span className="font-bold text-xl tracking-tight">Classcraft</span>
            <span className="ml-2 px-2 py-0.5 bg-blue-600 text-xs rounded-full">家長檢視</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-zinc-800 px-3 py-1">
              {dbUser.image ? (
                <img src={dbUser.image} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-zinc-600 flex items-center justify-center text-xs">
                  {(dbUser.name ?? "?")[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm">{dbUser.name}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* 歡迎區 */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-zinc-700 p-6">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span>👨‍👩‍👧</span>
            家長觀察模式
          </h1>
          <p className="text-zinc-400 mt-2">
            檢視孩子的學習進度與遊戲表現
          </p>
        </div>

        {/* 學生列表 */}
        {studentData.map(({ student, memberships, totalXp, completedQuests, totalCoins, level }) => (
          <div key={student.id} className="rounded-2xl bg-zinc-800/80 border border-zinc-700 p-6">
            {/* 學生資訊 */}
            <div className="flex items-center gap-4 mb-6">
              {student.image ? (
                <img src={student.image} alt={student.name ?? ""} className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-zinc-700 flex items-center justify-center text-2xl font-bold">
                  {(student.name ?? "?")[0].toUpperCase()}
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">{student.name}</h2>
                <p className="text-sm text-zinc-400">{student.email}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold text-purple-400">Lv.{level}</p>
                <p className="text-xs text-zinc-500">等級</p>
              </div>
            </div>

            {/* 統計數據 */}
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-zinc-900/50 p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">{totalXp}</p>
                <p className="text-xs text-zinc-500">總經驗值</p>
              </div>
              <div className="rounded-xl bg-zinc-900/50 p-4 text-center">
                <p className="text-2xl font-bold text-amber-400">{totalCoins}</p>
                <p className="text-xs text-zinc-500">金幣</p>
              </div>
              <div className="rounded-xl bg-zinc-900/50 p-4 text-center">
                <p className="text-2xl font-bold text-green-400">{completedQuests}</p>
                <p className="text-xs text-zinc-500">已完成任務</p>
              </div>
              <div className="rounded-xl bg-zinc-900/50 p-4 text-center">
                <p className="text-2xl font-bold text-blue-400">{memberships.length}</p>
                <p className="text-xs text-zinc-500">加入班級</p>
              </div>
            </div>

            {/* 班級列表 */}
            {memberships.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">所在班級</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {memberships.map(({ classroom, role }) => (
                    <div key={classroom.id} className="rounded-xl bg-zinc-900/50 p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{classroom.name}</p>
                        <p className="text-xs text-zinc-500">{role === "STUDENT" ? "學生" : role}</p>
                      </div>
                      <span className="text-2xl">🌍</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  )
}
