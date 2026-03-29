import Link from "next/link"
import Image from "next/image"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { PaperDollEditor } from "@/components/game/paper-doll-editor"
import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EQUIPMENT_REGISTRY } from "@/components/game/character-avatar"

const CHARACTER_CLASSES = {
  WARRIOR: { name: "戰士",   emoji: "⚔",  color: "text-red-400",    border: "border-red-500/30",    bg: "from-red-900/20 to-orange-900/20"    },
  MAGE:    { name: "法師",   emoji: "✦",  color: "text-purple-400", border: "border-purple-500/30", bg: "from-purple-900/20 to-blue-900/20"   },
  HEALER:  { name: "治癒者", emoji: "✚",  color: "text-green-400",  border: "border-green-500/30",  bg: "from-green-900/20 to-teal-900/20"    },
}

const NAV_LINKS = [
  { href: "/student/dashboard", label: "主頁" },
  { href: "/student/quests",    label: "任務" },
  { href: "/student/skills",    label: "技能" },
  { href: "/student/inventory", label: "背包" },
  { href: "/student/team",      label: "隊伍" },
]

export default async function StudentProfilePage() {
  const session = await getServerAuthSession()
  if (!session?.user) redirect("/signin")
  if (session.user.role !== "STUDENT") redirect("/teacher/dashboard")

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!dbUser?.name) redirect("/onboarding")

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "STUDENT" },
    include: { classroom: true },
    orderBy: { joinedAt: "desc" },
  })

  // Character data from first classroom
  let characterClass: "WARRIOR" | "MAGE" | "HEALER" = "WARRIOR"
  let equipmentJson: Record<string, string | null> = {}
  let currentHp = 100, maxHp = 100, currentMp = 50, maxMp = 50
  let primaryClassroomId = ""

  if (memberships[0]) {
    const member = await prisma.classroomMember.findFirst({
      where: { userId: session.user.id, classroomId: memberships[0].classroomId },
    })
    if (member) {
      characterClass = (member.characterClass as typeof characterClass) || "WARRIOR"
      try { equipmentJson = JSON.parse(member.equipment || "{}") } catch {}
      currentHp = member.currentHp || 100
      maxHp = member.maxHp || 100
      currentMp = member.currentMp || 50
      maxMp = member.maxMp || 50
      primaryClassroomId = memberships[0].classroomId
    }
  }

  // XP / level
  const xpAgg = await prisma.pointsLedger.aggregate({
    where: { targetUserId: session.user.id }, _sum: { xpDelta: true },
  })
  const totalXp = xpAgg._sum.xpDelta ?? 0
  const level = Math.floor(totalXp / 1000) + 1
  const xpInLevel = totalXp % 1000

  // Gold
  const wallets = await prisma.wallet.findMany({ where: { userId: session.user.id } })
  const totalCoins = wallets.reduce((s, w) => s + (w.balance ?? 0), 0)

  // Owned equipment keys (from UserEquipment table → map to registry keys by name)
  const userEquipment = await prisma.userEquipment.findMany({
    where: { userId: session.user.id },
    include: { equipment: true },
  })
  // Try to match DB equipment names to registry keys
  const ownedItemKeys = userEquipment
    .map(ue => {
      const nameLC = ue.equipment.name.toLowerCase().replace(/\s+/g, "-")
      const exactMatch = EQUIPMENT_REGISTRY[nameLC]
      if (exactMatch) return nameLC
      // Fuzzy: find registry entry whose name matches
      const fuzzy = Object.entries(EQUIPMENT_REGISTRY).find(
        ([, def]) => def.name === ue.equipment.name
      )
      return fuzzy?.[0] ?? null
    })
    .filter(Boolean) as string[]
  // If nothing owned, pass [] to show full registry (demo mode)

  // Badges, quests
  const userBadges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    include: { badge: true },
    orderBy: { earnedAt: "desc" },
  })
  const completedQuests = await prisma.questCompletion.count({ where: { studentId: session.user.id } })

  const classCfg = CHARACTER_CLASSES[characterClass]

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      {/* CRT scanline */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/student/dashboard" className="flex items-center gap-2 cursor-pointer flex-shrink-0">
              <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
              <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(nl => (
                <Link key={nl.href} href={nl.href}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer text-white/40 hover:text-white/70">
                  {nl.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#CA8A04]/40 bg-[#CA8A04]/10 px-3 py-1.5">
              <span className="text-xs font-black text-[#CA8A04]">金 {totalCoins}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-900/20 px-3 py-1.5">
              <span className="text-xs font-black text-purple-400">Lv.{level}</span>
            </div>
            {dbUser.image
              ? <img src={dbUser.image} alt="" className="w-7 h-7 rounded-xl ring-2 ring-[#CA8A04]/30" />
              : <div className="w-7 h-7 rounded-xl bg-[#CA8A04]/10 border border-[#CA8A04]/30 flex items-center justify-center text-xs font-black text-[#CA8A04]">
                  {dbUser.name[0].toUpperCase()}
                </div>}
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* ── Page body ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-6">

        {/* Hero banner */}
        <div className={`relative rounded-2xl border ${classCfg.border} bg-gradient-to-r ${classCfg.bg} p-6 overflow-hidden`}>
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#CA8A04]/40 rounded-tl-md" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#CA8A04]/40 rounded-tr-md" />
          <div className="flex items-start gap-5">
            {/* Avatar pill */}
            <div className="flex-shrink-0">
              {dbUser.image
                ? <img src={dbUser.image} alt="" className="w-20 h-20 rounded-2xl ring-4 ring-[#CA8A04]/30 object-cover" />
                : <div className="w-20 h-20 rounded-2xl bg-[#CA8A04]/10 border-2 border-[#CA8A04]/30 flex items-center justify-center text-4xl font-black text-[#CA8A04]">
                    {dbUser.name[0].toUpperCase()}
                  </div>}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Baloo 2', cursive" }}>{dbUser.name}</h1>
              <div className={`inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full border ${classCfg.border} bg-black/20`}>
                <span className="text-base">{classCfg.emoji}</span>
                <span className={`text-sm font-black ${classCfg.color}`}>{classCfg.name}</span>
              </div>
              {/* XP bar */}
              <div className="mt-3 max-w-xs">
                <div className="flex justify-between text-xs text-white/30 mb-1">
                  <span>Lv.{level}</span>
                  <span>{xpInLevel} / 1000 XP</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
                    style={{ width: `${(xpInLevel / 1000) * 100}%`, transition: "width 0.5s" }} />
                </div>
              </div>
            </div>
            {/* Stats pill grid */}
            <div className="hidden sm:grid grid-cols-2 gap-2 flex-shrink-0">
              {[
                { v: `${currentHp}/${maxHp}`, l: "HP", c: "text-red-400" },
                { v: `${currentMp}/${maxMp}`, l: "MP", c: "text-blue-400" },
                { v: totalCoins,              l: "金幣", c: "text-[#CA8A04]" },
                { v: completedQuests,         l: "任務", c: "text-green-400" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl bg-black/30 px-4 py-2 text-center">
                  <p className={`text-lg font-black ${s.c}`}>{s.v}</p>
                  <p className="text-[10px] text-white/25">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PAPER DOLL EDITOR (full width) ── */}
        {primaryClassroomId ? (
          <PaperDollEditor
            classroomId={primaryClassroomId}
            characterClass={characterClass}
            initialEquipment={equipmentJson}
            ownedItemKeys={ownedItemKeys}
            level={level}
            playerName={dbUser.name}
          />
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 p-10 text-center space-y-2">
            <span className="text-4xl block">🎭</span>
            <p className="text-white/30 text-sm">請先加入一個班級，才能使用裝備系統</p>
          </div>
        )}

        {/* ── Badges ── */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">🏆 徽章牆</h2>
          {userBadges.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-white/10 p-8 text-center text-white/20 text-sm">
              尚未獲得任何徽章，完成任務來解鎖！
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {userBadges.map(ub => (
                <div key={ub.id} className="relative rounded-xl border border-amber-500/20 bg-amber-900/5 p-4 text-center hover:border-amber-400/40 transition">
                  <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-amber-500/20 rounded-tl-sm" />
                  <span className="text-3xl block mb-2">🏆</span>
                  <p className="font-black text-xs text-[#CA8A04]">{ub.badge.name}</p>
                  <p className="text-xs text-white/25 mt-0.5">{new Date(ub.earnedAt).toLocaleDateString("zh-TW")}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Quick nav ── */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { href: "/student/dashboard", icon: "🏠", label: "勇者大廳" },
            { href: "/student/inventory", icon: "🎒", label: "背包" },
            { href: "/student/skills",    icon: "⚡", label: "技能樹" },
          ].map(a => (
            <Link key={a.href} href={a.href}
              className="rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 text-center hover:border-[#CA8A04]/30 transition cursor-pointer">
              <span className="text-2xl block mb-1">{a.icon}</span>
              <span className="text-xs font-black text-[#CA8A04]">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
