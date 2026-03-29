import Link from "next/link"
import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { CharacterAvatar } from "@/components/game/character-avatar"
import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function StudentTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ classroom?: string }>
}) {
  const session = await getServerAuthSession()

  if (!session?.user) redirect("/signin")
  if (session.user.role !== "STUDENT") redirect("/teacher/dashboard")

  const { classroom: classroomId } = await searchParams

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!dbUser?.name) redirect("/onboarding")

  // 取得學生的班級
  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "STUDENT" },
    include: {
      classroom: true,
    },
    orderBy: { joinedAt: "desc" },
  })

  // 選擇要顯示的班級
  const selectedClassroomId = classroomId || memberships[0]?.classroomId
  const selectedClassroom = memberships.find(m => m.classroomId === selectedClassroomId)?.classroom

  // 取得角色資料
  let characterClass: "WARRIOR" | "MAGE" | "HEALER" = "WARRIOR"
  let equipment = { helmet: null, armor: null, weapon: null, cape: null, pet: null }
  let currentHp = 100
  let maxHp = 100

  if (memberships[0]) {
    const member = await prisma.classroomMember.findFirst({
      where: { userId: session.user.id, classroomId: memberships[0].classroomId },
    })
    if (member) {
      characterClass = (member.characterClass as "WARRIOR" | "MAGE" | "HEALER") || "WARRIOR"
      try {
        equipment = JSON.parse(member.equipment || "{}")
      } catch {}
      currentHp = member.currentHp || 100
      maxHp = member.maxHp || 100
    }
  }

  // 取得用戶所屬的團隊
  let teamMembership = null
  let team = null
  let classroom = null
  let memberStats: {
    id: string
    userId: string
    name: string | null
    image: string | null
    email: string | null
    hp: number
    maxHp: number
    xp: number
    coins: number
    isMe: boolean
  }[] = []
  let teamTotalXp = 0
  let teamTotalCoins = 0

  if (selectedClassroomId) {
    teamMembership = await prisma.teamMember.findFirst({
      where: { userId: session.user.id },
      include: {
        team: {
          include: {
            classroom: true,
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, image: true } },
              },
            },
          },
        },
      },
    })

    if (teamMembership) {
      team = teamMembership.team
      classroom = team.classroom

      memberStats = await Promise.all(
        team.members.map(async (m) => {
          const xpResult = await prisma.pointsLedger.aggregate({
            where: { targetUserId: m.userId, classroomId: classroom!.id },
            _sum: { xpDelta: true },
          })
          const hpResult = await prisma.pointsLedger.aggregate({
            where: { targetUserId: m.userId, classroomId: classroom!.id },
            _sum: { hpDelta: true },
          })
          const wallet = await prisma.wallet.findUnique({
            where: {
              userId_classroomId_currency: { userId: m.userId, classroomId: classroom!.id, currency: "COINS" },
            },
          })

          const totalXp = classroom!.initialXp + (xpResult._sum.xpDelta ?? 0)
          const totalHp = Math.min(classroom!.maxHp, classroom!.initialHp + (hpResult._sum.hpDelta ?? 0))
          const totalCoins = wallet?.balance ?? 0

          return {
            id: m.id,
            userId: m.userId,
            name: m.user.name,
            image: m.user.image,
            email: m.user.email,
            hp: totalHp,
            maxHp: classroom!.maxHp,
            xp: totalXp,
            coins: totalCoins,
            isMe: m.userId === session.user.id,
          }
        })
      )

      teamTotalXp = memberStats.reduce((sum, m) => sum + m.xp, 0)
      teamTotalCoins = memberStats.reduce((sum, m) => sum + m.coins, 0)
    }
  }

  // 錢包餘額
  const wallet = selectedClassroomId
    ? await prisma.wallet.findUnique({
        where: {
          userId_classroomId_currency: { userId: session.user.id, classroomId: selectedClassroomId, currency: "COINS" },
        },
      })
    : null
  const totalCoins = wallet?.balance ?? 0

  // 計算 XP 和等級
  const xp = await prisma.pointsLedger.aggregate({
    where: { targetUserId: session.user.id },
    _sum: { xpDelta: true }
  })
  const totalXp = xp._sum.xpDelta ?? 0
  const level = Math.floor(totalXp / 1000) + 1

  return (
    <main className="min-h-screen bg-[#0a0a1a]">
      {/* 頂部導航 - CodeCombat 風格 */}
      <header className="h-14 bg-[#1a1a2e] border-b-2 border-[#f5a623] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/student" className="flex items-center gap-2">
            <span className="text-2xl">⚔️</span>
            <span className="text-[#f5a623] font-bold text-xl">Classcraft</span>
          </Link>
          <nav className="flex items-center ml-8 gap-1">
            <Link href="/student/dashboard" className="px-4 py-2 text-[#d4c4a8] hover:text-[#f5a623] font-bold">
              主頁
            </Link>
            <Link href="/student/quests" className="px-4 py-2 text-[#d4c4a8] hover:text-[#f5a623] font-bold">
              任務
            </Link>
            <Link href="/student/skills" className="px-4 py-2 text-[#d4c4a8] hover:text-[#f5a623] font-bold">
              技能
            </Link>
            <Link href="/student/inventory" className="px-4 py-2 text-[#d4c4a8] hover:text-[#f5a623] font-bold">
              背包
            </Link>
            <Link href="/student/team" className="px-4 py-2 bg-[#f5a623] text-[#0a0a1a] font-bold rounded-t-lg">
              隊伍
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#2a2a4a] px-3 py-1.5 rounded-full">
            <span className="text-lg">🪙</span>
            <span className="text-[#f5a623] font-bold">{totalCoins}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#2a2a4a] px-3 py-1.5 rounded-full">
            <span className="text-[#9b59b6]">⭐</span>
            <span className="text-[#9b59b6] font-bold">Lv.{level}</span>
          </div>
          {dbUser.image ? (
            <img src={dbUser.image} alt="" className="w-8 h-8 rounded-full border-2 border-[#f5a623]" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#2a2a4a] flex items-center justify-center text-[#f5a623] font-bold border-2 border-[#f5a623]">
              {(dbUser.name ?? "?")[0].toUpperCase()}
            </div>
          )}
          <SignOutButton />
        </div>
      </header>

      <div className="flex">
        {/* 左側邊欄 - 角色狀態 */}
        <aside className="w-64 bg-[#16213e] border-r border-[#f5a623]/30 p-4 flex-shrink-0">
          <div className="text-center mb-4">
            <div className="inline-block p-2 bg-[#0f3460] rounded-xl border-2 border-[#f5a623]">
              <CharacterAvatar
                characterClass={characterClass}
                equipment={equipment}
                size="xl"
                showAnimation={true}
              />
            </div>
            <h2 className="text-[#f5a623] font-bold mt-2">{dbUser.name}</h2>
            <span className={`text-sm ${
              characterClass === "WARRIOR" ? "text-red-400" :
              characterClass === "MAGE" ? "text-purple-400" : "text-green-400"
            }`}>
              {characterClass === "WARRIOR" ? "⚔️ 戰士" : characterClass === "MAGE" ? "🔮 法師" : "💚 治癒者"}
            </span>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-400 font-bold">❤️ HP</span>
              <span className="text-[#d4c4a8]">{currentHp} / {maxHp}</span>
            </div>
            <div className="h-4 bg-[#0a0a1a] rounded-full border border-red-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all"
                style={{ width: `${(currentHp / maxHp) * 100}%` }}
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-purple-400 font-bold">✨ XP</span>
              <span className="text-[#d4c4a8]">{totalXp}</span>
            </div>
            <div className="h-3 bg-[#0a0a1a] rounded-full border border-purple-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                style={{ width: `${(totalXp % 1000) / 1000 * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Link href="/student/profile" className="block w-full text-center py-2 bg-[#2a2a4a] hover:bg-[#3a3a5a] text-[#f5a623] rounded-lg font-bold transition">
              查看角色
            </Link>
            <Link href="/student/shop" className="block w-full text-center py-2 bg-[#2a2a4a] hover:bg-[#3a3a5a] text-[#d4c4a8] rounded-lg font-bold transition">
              🏪 商店
            </Link>
          </div>
        </aside>

        {/* 主內容區域 */}
        <div className="flex-1 p-6">
          {/* 頁面標題 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-[#f5a623] flex items-center gap-3">
                <span>👥</span>
                隊伍與公會
              </h1>
              <p className="text-[#8b8b8b] mt-2">
                {selectedClassroom ? `查看 ${selectedClassroom.name} 的隊伍` : "選擇一個世界"}
              </p>
            </div>

            <select
              className="bg-[#16213e] border border-[#f5a623]/30 rounded-lg px-4 py-2 text-sm text-[#d4c4a8]"
              defaultValue={classroomId || ""}
              onChange={(e) => {
                const value = e.target.value
                if (value) {
                  window.location.href = `/student/team?classroom=${value}`
                } else {
                  window.location.href = "/student/team"
                }
              }}
            >
              <option value="">選擇世界</option>
              {memberships.map(({ classroom }) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>

          {/* 沒有選擇班級 */}
          {!selectedClassroom ? (
            <div className="bg-[#16213e] border-2 border-dashed border-[#f5a623]/30 rounded-xl p-12 text-center">
              <p className="text-xl font-medium text-[#d4c4a8]">請選擇一個世界</p>
            </div>
          ) : !team ? (
            <div className="bg-[#16213e] border-2 border-dashed border-[#f5a623]/30 rounded-xl p-12 text-center">
              <p className="text-xl font-medium text-[#d4c4a8]">你還沒加入任何隊伍</p>
              <p className="text-sm text-[#8b8b8b] mt-2">請聯繫你的教師（GM）將你分配到隊伍</p>
              <Link
                href={`/student/dashboard?classroom=${selectedClassroom.id}`}
                className="inline-block mt-6 px-6 py-3 bg-purple-600 rounded-xl hover:bg-purple-500 transition"
              >
                返回勇者大廳
              </Link>
            </div>
          ) : (
            <>
              {/* 團隊資訊 */}
              <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border-2 border-[#f5a623]/30 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#f5a623] flex items-center gap-2">
                      <span>⚔️</span> {team.name}
                    </h2>
                    <p className="text-[#8b8b8b] mt-1">{classroom?.name}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-[#0a0a1a] p-4 text-center">
                    <p className="text-sm text-purple-400">團隊總 XP</p>
                    <p className="text-2xl font-bold text-purple-400">{teamTotalXp.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-[#0a0a1a] p-4 text-center">
                    <p className="text-sm text-amber-400">團隊總金幣</p>
                    <p className="text-2xl font-bold text-amber-400">{teamTotalCoins.toLocaleString()}</p>
                  </div>
                  <div className="rounded-xl bg-[#0a0a1a] p-4 text-center">
                    <p className="text-sm text-green-400">團隊人數</p>
                    <p className="text-2xl font-bold text-green-400">{memberStats.length}</p>
                  </div>
                </div>
              </div>

              {/* 隊員列表 */}
              <section>
                <h2 className="text-xl font-semibold text-[#f5a623] flex items-center gap-2 mb-4">
                  <span>🧙</span> 隊員狀態
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {memberStats.map((member) => {
                    const hpPercent = (member.hp / member.maxHp) * 100
                    const isLowHp = hpPercent <= 20

                    return (
                      <div
                        key={member.id}
                        className={`rounded-xl border-2 p-5 transition ${
                          member.isMe
                            ? "border-purple-500 bg-purple-900/20"
                            : "bg-[#16213e] border-[#f5a623]/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {member.image ? (
                            <img src={member.image} alt={member.name ?? ""} className="w-12 h-12 rounded-full border-2 border-[#f5a623]" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#2a2a4a] flex items-center justify-center text-xl font-bold text-[#f5a623] border-2 border-[#f5a623]">
                              {(member.name ?? "?")[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[#f5a623]">{member.name ?? "未命名"}</p>
                              {member.isMe && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-600 text-white">
                                  你
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#8b8b8b]">{member.email}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className={isLowHp ? "text-red-400" : "text-[#d4c4a8]"}>HP</span>
                            <span className="text-[#d4c4a8]">{member.hp} / {member.maxHp}</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#0a0a1a] overflow-hidden">
                            <div
                              className={`h-full transition-all ${isLowHp ? "bg-red-500" : "bg-green-500"}`}
                              style={{ width: `${hpPercent}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex justify-between text-sm">
                          <span className="text-purple-400">{member.xp.toLocaleString()} XP</span>
                          <span className="text-amber-400">{member.coins} 金幣</span>
                        </div>

                        {isLowHp && !member.isMe && (
                          <form action="/api/team/skill" method="POST" className="mt-3">
                            <input type="hidden" name="targetUserId" value={member.userId} />
                            <input type="hidden" name="skillType" value="HEAL" />
                            <button
                              type="submit"
                              className="w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-500 transition"
                            >
                              救援隊友 (+20 HP)
                            </button>
                          </form>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>
            </>
          )}

          {/* 快捷操作 */}
          <div className="mt-8 grid grid-cols-3 gap-4">
            <Link
              href="/student/dashboard"
              className="bg-[#16213e] border-2 border-[#f5a623]/30 rounded-xl p-4 text-center hover:border-[#f5a623] transition"
            >
              <span className="text-3xl block mb-2">🏠</span>
              <span className="text-[#f5a623] font-bold">勇者大廳</span>
            </Link>
            <Link
              href="/student/quests"
              className="bg-[#16213e] border-2 border-[#f5a623]/30 rounded-xl p-4 text-center hover:border-[#f5a623] transition"
            >
              <span className="text-3xl block mb-2">🗺️</span>
              <span className="text-[#f5a623] font-bold">任務</span>
            </Link>
            <Link
              href="/student/skills"
              className="bg-[#16213e] border-2 border-[#f5a623]/30 rounded-xl p-4 text-center hover:border-[#f5a623] transition"
            >
              <span className="text-3xl block mb-2">⚡</span>
              <span className="text-[#f5a623] font-bold">技能樹</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
