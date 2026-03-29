import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CharacterAvatar } from "@/components/game/character-avatar";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentDashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "STUDENT") redirect("/teacher/dashboard");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "STUDENT" },
    include: { classroom: { include: { _count: { select: { members: true, quests: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  const firstMembership = memberships[0];
  let characterClass: "WARRIOR" | "MAGE" | "HEALER" = "WARRIOR";
  let equipment = {};
  let currentHp = 100, maxHp = 100, currentMp = 50, maxMp = 50;

  if (firstMembership) {
    const member = await prisma.classroomMember.findFirst({
      where: { userId: session.user.id, classroomId: firstMembership.classroomId }
    });
    if (member) {
      characterClass = (member.characterClass as typeof characterClass) || "WARRIOR";
      try { equipment = JSON.parse(member.equipment || "{}"); } catch {}
      currentHp = member.currentHp || 100; maxHp = member.maxHp || 100;
      currentMp = member.currentMp || 50; maxMp = member.maxMp || 50;
    }
  }

  const wallets = await prisma.wallet.findMany({ where: { userId: session.user.id, currency: "COINS" } });
  const totalCoins = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);

  const xp = await prisma.pointsLedger.aggregate({ where: { targetUserId: session.user.id }, _sum: { xpDelta: true } });
  const totalXp = xp._sum.xpDelta ?? 0;
  const level = Math.floor(totalXp / 1000) + 1;
  const nextLevelXp = level * 1000;
  const xpInLevel = totalXp % 1000;
  const xpProgress = Math.min(100, Math.round((xpInLevel / 1000) * 100));

  const pendingQuests = await prisma.quest.count({
    where: {
      classroomId: firstMembership?.classroomId,
      isActive: true,
      NOT: { completions: { some: { studentId: session.user.id } } }
    },
  });

  const completedQuests = await prisma.questCompletion.count({ where: { studentId: session.user.id } });

  const CLASS_INFO = {
    WARRIOR: { label: "⚔ 戰士", color: "text-red-400", glow: "rgba(220,38,38,0.4)", border: "border-red-500/40", bg: "from-red-900/20" },
    MAGE:    { label: "✦ 法師", color: "text-purple-400", glow: "rgba(124,58,237,0.4)", border: "border-purple-500/40", bg: "from-purple-900/20" },
    HEALER:  { label: "✚ 治癒者", color: "text-green-400", glow: "rgba(22,163,74,0.4)", border: "border-green-500/40", bg: "from-green-900/20" },
  };

  const classInfo = CLASS_INFO[characterClass];

  // HUD nav items
  const HUD_NAV = [
    { href: "/student/dashboard", icon: "🏰", label: "主城", active: true },
    { href: "/student/quests",    icon: "📋", label: "任務" },
    { href: "/student/skills",    icon: "⚡", label: "技能" },
    { href: "/student/inventory", icon: "🎒", label: "背包" },
    { href: "/student/profile",   icon: "🎭", label: "角色" },
    { href: "/student/team",      icon: "👥", label: "隊伍" },
    { href: "/student/shop",      icon: "🏪", label: "商店" },
  ];

  const QUICK_ACTIONS = [
    { href: "/student/quests", icon: "⚔️", label: "接受任務", sub: `${pendingQuests} 個待完成`, color: "border-amber-500/30 hover:border-amber-400/60 hover:bg-amber-900/10", glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]" },
    { href: "/student/skills", icon: "🌀", label: "技能樹",   sub: "強化你的能力",           color: "border-blue-500/30 hover:border-blue-400/60 hover:bg-blue-900/10",   glow: "hover:shadow-[0_0_20px_rgba(59,130,246,0.15)]" },
    { href: "/student/team",   icon: "🛡️", label: "我的隊伍", sub: "與夥伴並肩作戰",         color: "border-green-500/30 hover:border-green-400/60 hover:bg-green-900/10", glow: "hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]" },
    { href: "/student/profile",icon: "🎭", label: "換裝備",   sub: "紙娃娃系統",             color: "border-purple-500/30 hover:border-purple-400/60 hover:bg-purple-900/10", glow: "hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]" },
    { href: "/student/shop",   icon: "💰", label: "獎勵商店", sub: `持有 ${totalCoins} 金幣`,  color: "border-[#CA8A04]/30 hover:border-[#CA8A04]/60 hover:bg-[#CA8A04]/10",  glow: "hover:shadow-[0_0_20px_rgba(202,138,4,0.15)]" },
    { href: "/student/quests", icon: "📖", label: "冒險日誌", sub: `已完成 ${completedQuests} 任務`, color: "border-pink-500/30 hover:border-pink-400/60 hover:bg-pink-900/10",  glow: "hover:shadow-[0_0_20px_rgba(236,72,153,0.15)]" },
  ];

  return (
    <div className="min-h-screen bg-[#08070A] text-white pb-24" style={{ fontFamily: "'Exo 2', sans-serif" }}>

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: "linear-gradient(rgba(202,138,4,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(202,138,4,0.5) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        {/* Glow orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse"
          style={{ background: classInfo.glow, opacity: 0.08 }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse"
          style={{ background: "rgba(124,58,237,0.15)", animationDelay: "1.5s" }} />
        <div className="absolute top-1/2 left-0 w-64 h-64 rounded-full blur-3xl animate-pulse"
          style={{ background: "rgba(202,138,4,0.08)", animationDelay: "3s" }} />
      </div>

      {/* ── Top header bar ── */}
      <header className="relative z-50 sticky top-0 border-b border-[#CA8A04]/15 bg-[#08070A]/85 backdrop-blur-2xl px-4 py-2.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link href="/student/dashboard" className="flex items-center gap-2.5 cursor-pointer flex-shrink-0">
            <Image src="/logo.png" alt="Classcraft" width={24} height={24}
              className="drop-shadow-[0_0_8px_rgba(202,138,4,0.9)]" />
            <span className="text-sm font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>
              Classcraft
            </span>
          </Link>

          {/* Right: badges */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-[#CA8A04]/30 bg-[#CA8A04]/8 px-2.5 py-1">
              <span className="text-xs font-black text-[#CA8A04]">Lv.{level}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-900/10 px-2.5 py-1">
              <span className="text-xs font-black text-amber-400">💰 {totalCoins}</span>
            </div>
            {dbUser.image ? (
              <img src={dbUser.image} alt="" className="w-7 h-7 rounded-xl ring-2 ring-[#CA8A04]/40 object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-xl bg-[#CA8A04]/10 border border-[#CA8A04]/30 flex items-center justify-center text-xs font-black text-[#CA8A04]">
                {dbUser.name[0].toUpperCase()}
              </div>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* ═══ HERO BANNER — Character + Stats ═══ */}
        <div className={`relative rounded-3xl border ${classInfo.border} overflow-hidden`}
          style={{ background: `linear-gradient(135deg, #0E0C14 0%, #100D1A 50%, #0B0A10 100%)` }}>
          {/* Glow pulse bg */}
          <div className="absolute inset-0 opacity-20"
            style={{ background: `radial-gradient(ellipse at 15% 50%, ${classInfo.glow} 0%, transparent 60%)` }} />
          {/* Top-right decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.06]"
            style={{ background: `radial-gradient(circle at 100% 0%, ${classInfo.glow} 0%, transparent 70%)` }} />
          {/* Corner runes */}
          <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#CA8A04]/50 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#CA8A04]/50 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#CA8A04]/30 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#CA8A04]/30 rounded-br-lg" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
            {/* Character avatar with glow platform */}
            <div className="flex-shrink-0 relative">
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-28 h-4 rounded-full blur-lg"
                style={{ background: classInfo.glow, opacity: 0.5 }} />
              <div className="relative p-4 rounded-2xl border border-white/5 bg-white/3
                shadow-[0_0_40px_rgba(202,138,4,0.08)]">
                <CharacterAvatar characterClass={characterClass} equipment={equipment} size="2xl" showAnimation={true} level={level} />
              </div>
            </div>

            {/* Hero info */}
            <div className="flex-1 min-w-0 text-center sm:text-left space-y-4">
              <div>
                <p className="text-xs text-[#CA8A04]/50 tracking-[0.3em] uppercase mb-1">英雄回歸</p>
                <h1 className="text-3xl sm:text-4xl font-black text-white" style={{ fontFamily: "'Baloo 2', cursive" }}>
                  {dbUser.name}
                </h1>
                <div className={`inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full border ${classInfo.border} bg-black/30`}>
                  <span className={`text-sm font-black ${classInfo.color}`}>{classInfo.label}</span>
                </div>
              </div>

              {/* Stat bars */}
              <div className="space-y-2 max-w-sm mx-auto sm:mx-0">
                {[
                  { label: "HP", cur: currentHp, max: maxHp, color: "from-red-600 to-rose-400", track: "bg-red-900/30", lc: "text-red-400" },
                  { label: "MP", cur: currentMp, max: maxMp, color: "from-blue-600 to-cyan-400", track: "bg-blue-900/30", lc: "text-blue-400" },
                  { label: "XP", cur: xpInLevel, max: 1000, color: "from-amber-500 to-yellow-300", track: "bg-amber-900/30", lc: "text-amber-400" },
                ].map(bar => (
                  <div key={bar.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className={`font-black tracking-wider ${bar.lc}`}>{bar.label}</span>
                      <span className="text-white/25">{bar.cur} / {bar.max}</span>
                    </div>
                    <div className={`h-2.5 rounded-full ${bar.track} overflow-hidden relative`}>
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${bar.color}`}
                        style={{ width: `${Math.min(100, (bar.cur / bar.max) * 100)}%`, transition: "width 0.8s ease" }}
                      />
                      {/* Shimmer */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat cards grid */}
            <div className="grid grid-cols-2 gap-2 flex-shrink-0">
              {[
                { v: level, l: "等級", c: "text-[#CA8A04]", b: "border-[#CA8A04]/30", bg: "bg-[#CA8A04]/5" },
                { v: totalXp, l: "總XP", c: "text-amber-400", b: "border-amber-500/30", bg: "bg-amber-900/10" },
                { v: pendingQuests, l: "待任務", c: "text-green-400", b: "border-green-500/30", bg: "bg-green-900/10" },
                { v: memberships.length, l: "我的世界", c: "text-purple-400", b: "border-purple-500/30", bg: "bg-purple-900/10" },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl border ${s.b} ${s.bg} px-4 py-3 text-center min-w-[80px]`}>
                  <p className={`text-2xl font-black ${s.c}`}>{s.v}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* XP level bar at bottom */}
          <div className="relative z-10 border-t border-white/5 px-6 py-3 flex items-center gap-3">
            <span className="text-xs text-white/30 flex-shrink-0">Lv.{level}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#CA8A04] to-yellow-300"
                style={{ width: `${xpProgress}%`, transition: "width 1s ease" }} />
            </div>
            <span className="text-xs text-white/30 flex-shrink-0">Lv.{level + 1}</span>
            <span className="text-xs font-bold text-[#CA8A04]/60">{xpInLevel}/{nextLevelXp} XP</span>
          </div>
        </div>

        {/* ═══ QUICK ACTIONS — RPG Skill Panel ═══ */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-[#CA8A04]/30 to-transparent" />
            <h2 className="text-xs font-black text-[#CA8A04]/60 tracking-[0.25em] uppercase px-2">⚔ 快速行動</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-[#CA8A04]/30 to-transparent" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_ACTIONS.map((a, i) => (
              <Link key={i} href={a.href}
                className={`group relative rounded-2xl border p-4 text-center transition-all duration-200 cursor-pointer ${a.color} ${a.glow}`}>
                {/* Corner rune */}
                <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-white/10 group-hover:border-current rounded-tl-sm transition-colors" />
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/10 group-hover:border-current rounded-tr-sm transition-colors" />
                <span className="text-3xl block mb-2">{a.icon}</span>
                <p className="text-xs font-black text-white/80 group-hover:text-white transition">{a.label}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{a.sub}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ═══ MY WORLDS — RPG Map Cards ═══ */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-[#CA8A04]/30 to-transparent" />
            <h2 className="text-xs font-black text-[#CA8A04]/60 tracking-[0.25em] uppercase px-2">🗺 我的世界</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-[#CA8A04]/30 to-transparent" />
          </div>

          {memberships.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {memberships.map(({ classroom }) => (
                <div key={classroom.id}
                  className="group relative rounded-2xl border border-white/8 bg-gradient-to-br from-[#12101A] to-[#0C0A12]
                    hover:border-[#CA8A04]/40 hover:shadow-[0_0_30px_rgba(202,138,4,0.08)]
                    transition-all duration-300 overflow-hidden cursor-pointer">
                  {/* Top glow stripe */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#CA8A04]/40 to-transparent
                    opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* Corner runes */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#CA8A04]/20 group-hover:border-[#CA8A04]/60 transition-colors rounded-tl-sm" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#CA8A04]/20 group-hover:border-[#CA8A04]/60 transition-colors rounded-tr-sm" />

                  <Link href={`/student/quests?classroom=${classroom.id}`} className="absolute inset-0 z-0" />

                  <div className="relative z-10 p-5">
                    {/* World name */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className="text-[10px] text-[#CA8A04]/40 tracking-widest uppercase">WORLD</span>
                        <h3 className="font-black text-white group-hover:text-[#CA8A04] transition-colors mt-0.5 text-lg">
                          {classroom.name}
                        </h3>
                      </div>
                      <div className="px-2 py-1 rounded-lg border border-green-500/30 bg-green-900/20 text-[10px] font-black text-green-400">
                        勇者
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-xs text-white/30 mb-4">
                      <span className="flex items-center gap-1">
                        <span>👥</span> {classroom._count.members} 人
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📋</span> {classroom._count.quests} 任務
                      </span>
                    </div>

                    {/* Mini progress bar decoration */}
                    <div className="h-px bg-white/5 mb-4" />

                    {/* Action button */}
                    <Link href={`/student/quests?classroom=${classroom.id}`}
                      className="relative z-20 block w-full rounded-xl border border-[#CA8A04]/30 bg-[#CA8A04]/8
                        py-2 text-center text-xs font-black text-[#CA8A04]/80
                        hover:bg-[#CA8A04]/15 hover:text-[#CA8A04] hover:border-[#CA8A04]/50
                        transition-all duration-200 cursor-pointer">
                      進入世界 ⚔
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/15 bg-[#CA8A04]/3 p-16 text-center space-y-4">
              <div className="text-6xl opacity-20">🗺</div>
              <p className="font-black text-white/30 text-lg">你還沒有加入任何世界</p>
              <p className="text-sm text-white/20">等待教師的邀請碼，開始你的冒險</p>
            </div>
          )}
        </section>
      </div>

      {/* ══ BOTTOM HUD NAVIGATION ══ */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
        <div
          className="mx-auto max-w-lg rounded-2xl border border-[#CA8A04]/25 backdrop-blur-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(12,10,9,0.95) 0%, rgba(28,24,20,0.95) 100%)" }}
        >
          {/* Top accent line */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#CA8A04]/50 to-transparent" />

          <div className="flex items-stretch">
            {HUD_NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex-1 flex flex-col items-center justify-center py-3 px-1 gap-1 transition-all duration-200 cursor-pointer relative
                  ${item.active
                    ? "bg-[#CA8A04]/12 text-[#CA8A04]"
                    : "text-white/35 hover:text-white/70 hover:bg-white/5"
                  }`}
              >
                {/* Active indicator */}
                {item.active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#CA8A04]" />
                )}
                {/* Separator */}
                {i > 0 && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-px h-6 bg-white/8" />
                )}
                <span className="text-lg leading-none">{item.icon}</span>
                <span className={`text-[9px] font-black tracking-wider ${item.active ? "text-[#CA8A04]" : ""}`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}