import Link from "next/link"
import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { CharacterAvatar } from "@/components/game/character-avatar"
import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function StudentSkillsPage() {
  const session = await getServerAuthSession()

  if (!session?.user) redirect("/signin")
  if (session.user.role !== "STUDENT") redirect("/teacher/dashboard")

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!dbUser?.name) redirect("/onboarding")

  // 取得學生的班級
  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "STUDENT" },
    orderBy: { joinedAt: "desc" },
  })

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

  // 計算等級
  const xp = await prisma.pointsLedger.aggregate({
    where: { targetUserId: session.user.id },
    _sum: { xpDelta: true },
  })
  const totalXp = xp._sum.xpDelta ?? 0
  const userLevel = Math.floor(totalXp / 1000) + 1

  // 取得用戶已解鎖的技能
  const userSkills = await prisma.userSkill.findMany({
    where: { userId: session.user.id },
    include: { skill: true },
  })

  // 取得所有可用技能
  const allSkills = await prisma.skill.findMany({
    orderBy: { levelReq: "asc" },
  })

  const unlockedSkillIds = new Set(userSkills.map((us) => us.skillId))

  // 按類型分組技能
  const skillTypes = [
    { id: "BUFF", name: "增益技能", emoji: "💪" },
    { id: "HEAL", name: "治療技能", emoji: "❤️" },
    { id: "ATTACK", name: "攻擊技能", emoji: "⚔️" },
    { id: "PASSIVE", name: "被動技能", emoji: "✨" },
  ]

  // 取得錢包數據
  const wallets = await prisma.wallet.findMany({
    where: { userId: session.user.id, currency: "COINS" }
  })
  const totalCoins = wallets.reduce((sum, w) => sum + (w.balance ?? 0), 0)

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
            <Link href="/student/skills" className="px-4 py-2 bg-[#f5a623] text-[#0a0a1a] font-bold rounded-t-lg">
              技能
            </Link>
            <Link href="/student/inventory" className="px-4 py-2 text-[#d4c4a8] hover:text-[#f5a623] font-bold">
              背包
            </Link>
            <Link href="/student/team" className="px-4 py-2 text-[#d4c4a8] hover:text-[#f5a623] font-bold">
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
            <span className="text-[#9b59b6] font-bold">Lv.{userLevel}</span>
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
          {/* 技能樹標題 */}
          <div className="bg-gradient-to-r from-red-900/30 to-purple-900/30 border-2 border-[#f5a623]/30 rounded-xl p-6 mb-6">
            <h1 className="text-3xl font-bold text-[#f5a623] flex items-center gap-3">
              <span>⚡</span> 技能樹
            </h1>
            <p className="text-[#8b8b8b] mt-2">
              升級後學習新技能，解鎖更強大的能力！
            </p>
            <div className="mt-4 flex items-center gap-4">
              <span className="text-purple-400">✨ 當前等級: Lv.{userLevel}</span>
              <span className="text-[#8b8b8b]">|</span>
              <span className="text-green-400">已解鎖 {userSkills.length} 個技能</span>
            </div>
          </div>

          {/* 技能列表 */}
          {skillTypes.map(({ id: typeId, name, emoji }) => {
            const typeSkills = allSkills.filter((s) => s.skillType === typeId)
            if (typeSkills.length === 0) return null

            return (
              <section key={typeId} className="mb-6">
                <h2 className="text-xl font-semibold text-[#f5a623] flex items-center gap-2 mb-4">
                  <span>{emoji}</span> {name}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {typeSkills.map((skill) => {
                    const unlocked = unlockedSkillIds.has(skill.id)
                    const canUnlock = userLevel >= skill.levelReq && !unlocked

                    return (
                      <div
                        key={skill.id}
                        className={`relative rounded-xl border-2 p-5 transition ${
                          unlocked
                            ? "bg-[#1a3a1a] border-green-500"
                            : canUnlock
                              ? "bg-[#16213e] border-[#f5a623]/30 hover:border-purple-500"
                              : "bg-[#0a0a1a] border-[#f5a623]/20 opacity-60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-3xl">{skill.icon}</span>
                          <div className="flex-1">
                            <h3 className="font-bold text-[#f5a623]">{skill.name}</h3>
                            <p className="text-sm text-[#8b8b8b] mt-1">{skill.description}</p>
                          </div>
                        </div>

                        <div className="mt-3 p-2 bg-[#0a0a1a] rounded-lg">
                          <p className="text-sm text-[#d4c4a8]">{skill.effect}</p>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          {unlocked ? (
                            <span className="text-sm text-green-400 font-bold">✓ 已解鎖</span>
                          ) : canUnlock ? (
                            <form action="/api/skills/unlock" method="POST">
                              <input type="hidden" name="skillId" value={skill.id} />
                              <button
                                type="submit"
                                className="px-4 py-1.5 bg-purple-600 rounded-lg text-sm font-bold hover:bg-purple-500 transition"
                              >
                                解鎖技能
                              </button>
                            </form>
                          ) : (
                            <span className="text-sm text-[#8b8b8b]">
                              需要 Lv.{skill.levelReq}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )
          })}

          {/* 沒有技能 */}
          {allSkills.length === 0 && (
            <div className="bg-[#16213e] border-2 border-dashed border-[#f5a623]/30 rounded-xl p-12 text-center">
              <p className="text-xl font-medium text-[#d4c4a8]">技能系統尚未開放</p>
              <p className="text-sm text-[#8b8b8b] mt-2">請耐心等待教師添加技能</p>
            </div>
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
              href="/student/inventory"
              className="bg-[#16213e] border-2 border-[#f5a623]/30 rounded-xl p-4 text-center hover:border-[#f5a623] transition"
            >
              <span className="text-3xl block mb-2">🎒</span>
              <span className="text-[#f5a623] font-bold">背包</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
