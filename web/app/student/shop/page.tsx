import Link from "next/link"
import { redirect } from "next/navigation"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { CharacterAvatar } from "@/components/game/character-avatar"
import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function StudentShopPage() {
  const session = await getServerAuthSession()

  if (!session?.user) redirect("/signin")
  if (session.user.role !== "STUDENT") redirect("/teacher/dashboard")

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!dbUser?.name) redirect("/onboarding")

  // 取得學生的班級
  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "STUDENT" },
    include: {
      classroom: {
        include: {
          organization: true,
        },
      },
    },
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

  // 收集獎勵物品
  const rewards: { reward: unknown; classroomId: string; classroomName: string }[] = []
  const wallets: Record<string, number> = {}

  for (const m of memberships) {
    const wallet = await prisma.wallet.findUnique({
      where: {
        userId_classroomId_currency: {
          userId: session.user.id,
          classroomId: m.classroom.id,
          currency: "COINS",
        },
      },
    })
    wallets[m.classroom.id] = wallet?.balance ?? 0

    const items = await prisma.rewardItem.findMany({
      where: {
        organizationId: m.classroom.organizationId,
        isActive: true,
      },
      orderBy: { coinCost: "asc" },
    })

    for (const reward of items) {
      rewards.push({
        reward,
        classroomId: m.classroom.id,
        classroomName: m.classroom.name,
      })
    }
  }

  const totalCoins = Object.values(wallets).reduce((sum, balance) => sum + balance, 0)

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
            <Link href="/student/dashboard" className="block w-full text-center py-2 bg-[#2a2a4a] hover:bg-[#3a3a5a] text-[#f5a623] rounded-lg font-bold transition">
              返回大廳
            </Link>
            <Link href="/student/inventory" className="block w-full text-center py-2 bg-[#2a2a4a] hover:bg-[#3a3a5a] text-[#d4c4a8] rounded-lg font-bold transition">
              🎒 背包
            </Link>
          </div>
        </aside>

        {/* 主內容區域 */}
        <div className="flex-1 p-6">
          {/* 商店標題 */}
          <div className="bg-gradient-to-r from-amber-900/30 to-yellow-900/30 border-2 border-[#f5a623]/30 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#f5a623] flex items-center gap-3">
                  <span>🛒</span>
                  裝備商店
                </h1>
                <p className="text-[#8b8b8b] mt-2">
                  使用金幣購買專屬裝備與獎勵
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#8b8b8b]">可用金幣</p>
                <p className="text-3xl font-bold text-amber-400">💰 {totalCoins}</p>
              </div>
            </div>
          </div>

          {/* 沒有獎勵物品 */}
          {rewards.length === 0 ? (
            <div className="bg-[#16213e] border-2 border-dashed border-[#f5a623]/30 rounded-xl p-12 text-center">
              <p className="text-xl font-medium text-[#d4c4a8]">商店尚未開張</p>
              <p className="text-sm text-[#8b8b8b] mt-2">敬請期待教師上架獎勵</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rewards.map(({ reward, classroomId, classroomName }) => (
                <div
                  key={(reward as { id: string }).id}
                  className="group relative rounded-2xl bg-[#16213e] border-2 border-[#f5a623]/30 p-5 hover:border-amber-500 transition"
                >
                  <p className="text-xs text-[#8b8b8b]">{classroomName}</p>
                  <h3 className="font-semibold text-lg mt-1 text-[#f5a623] group-hover:text-white transition">
                    {(reward as { name: string }).name}
                  </h3>
                  {(reward as { description: string | null }).description && (
                    <p className="text-sm text-[#8b8b8b] mt-1">
                      {(reward as { description: string }).description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-amber-400">
                      {(reward as { coinCost: number }).coinCost} 金幣
                    </span>
                    {(reward as { stock: number | null }).stock !== null && (
                      <span className="text-xs text-[#8b8b8b]">
                        庫存: {(reward as { stock: number }).stock}
                      </span>
                    )}
                  </div>
                  <form action="/api/rewards/[id]/redeem" method="POST">
                    <input type="hidden" name="rewardId" value={(reward as { id: string }).id} />
                    <input type="hidden" name="classroomId" value={classroomId} />
                    <button
                      type="submit"
                      className="mt-3 w-full rounded-xl bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={wallets[classroomId] < (reward as { coinCost: number }).coinCost}
                    >
                      {wallets[classroomId] < (reward as { coinCost: number }).coinCost
                        ? "餘額不足"
                        : "兌換"}
                    </button>
                  </form>
                </div>
              ))}
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
              href="/student/inventory"
              className="bg-[#16213e] border-2 border-[#f5a623]/30 rounded-xl p-4 text-center hover:border-[#f5a623] transition"
            >
              <span className="text-3xl block mb-2">🎒</span>
              <span className="text-[#f5a623] font-bold">背包</span>
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
