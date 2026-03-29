import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { JoinClassroomButton } from "@/components/join-classroom-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Compute level from XP
function xpToLevel(xp: number) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}
function xpForNextLevel(level: number) {
  return level * level * 100;
}

const NAV_ITEMS = [
  { href: "/dashboard/map",         icon: "🗺", label: "冒險地圖",   sub: "探索任務與進度",   color: "hover:border-purple-500 hover:shadow-purple-900/30",  tag: "text-purple-400" },
  { href: "/dashboard/assignments", icon: "📜", label: "我的作業",   sub: "完成課題獲取獎勵", color: "hover:border-amber-500  hover:shadow-amber-900/30",    tag: "text-amber-400"  },
  { href: "/dashboard/skills",      icon: "⚡", label: "技能樹",     sub: "學習技能增強實力", color: "hover:border-red-500    hover:shadow-red-900/30",      tag: "text-red-400"    },
  { href: "/dashboard/feed",        icon: "📖", label: "冒險日誌",   sub: "回顧你的輝煌戰績", color: "hover:border-blue-500   hover:shadow-blue-900/30",     tag: "text-blue-400"   },
  { href: "/dashboard/team",        icon: "👥", label: "團隊狀態",   sub: "查看隊友與救援",   color: "hover:border-green-500  hover:shadow-green-900/30",    tag: "text-green-400"  },
  { href: "/dashboard/profile",     icon: "🧙", label: "我的檔案",   sub: "角色與職業設定",   color: "hover:border-pink-500   hover:shadow-pink-900/30",     tag: "text-pink-400"   },
  { href: "/dashboard/progress",    icon: "📊", label: "我的進度",   sub: "數據統計與分析",   color: "hover:border-cyan-500   hover:shadow-cyan-900/30",     tag: "text-cyan-400"   },
  { href: "/dashboard/shop",        icon: "🛒", label: "獎勵商店",   sub: "兌換專屬獎勵",     color: "hover:border-yellow-500 hover:shadow-yellow-900/30",   tag: "text-yellow-400" },
];

export default async function DashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id },
    include: { classroom: { include: { _count: { select: { members: true, courses: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  const isTeacher = dbUser.role === "TEACHER" || dbUser.role === "ADMIN";

  const totalXp = await prisma.pointsLedger.aggregate({
    where: { targetUserId: session.user.id },
    _sum: { xpDelta: true },
  });
  const totalCoins = await prisma.wallet.aggregate({
    where: { userId: session.user.id },
    _sum: { balance: true },
  });
  const completedQuests = await prisma.questCompletion.count({
    where: { studentId: session.user.id },
  });

  const xp = totalXp._sum.xpDelta ?? 0;
  const coins = totalCoins._sum.balance ?? 0;
  const level = xpToLevel(xp);
  const nextLevelXp = xpForNextLevel(level);
  const prevLevelXp = xpForNextLevel(level - 1);
  const progress = Math.min(100, Math.round(((xp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white overflow-x-hidden" style={{ fontFamily: "'Exo 2', sans-serif" }}>

      {/* ── Retro scanline overlay ── */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }}
      />

      {/* ── Top Navigation ── */}
      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 cursor-pointer">
            <Image src="/logo.png" alt="Classcraft" width={32} height={32} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
            <span className="text-lg font-black text-[#CA8A04] tracking-wide" style={{ fontFamily: "'Baloo 2', cursive" }}>
              Classcraft
            </span>
          </Link>

          {/* Right: stats + user */}
          <div className="flex items-center gap-3">
            {/* Level badge */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-purple-500/50 bg-purple-900/30 px-3 py-1.5">
              <span className="text-xs text-purple-400 font-black tracking-wider">Lv.{level}</span>
            </div>

            {/* Coins */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#CA8A04]/50 bg-[#CA8A04]/10 px-3 py-1.5">
              <svg className="w-3.5 h-3.5 text-[#CA8A04]" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="7" fill="#0C0A09"/>
                <text x="12" y="16" textAnchor="middle" fill="#CA8A04" fontSize="8" fontWeight="bold">G</text>
              </svg>
              <span className="text-xs text-[#CA8A04] font-black">{coins}</span>
            </div>

            {/* User avatar */}
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
              {dbUser.image ? (
                <img src={dbUser.image} alt="" className="w-5 h-5 rounded-full ring-1 ring-[#CA8A04]/50" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-[#CA8A04]/20 border border-[#CA8A04]/40 flex items-center justify-center text-[10px] font-black text-[#CA8A04]">
                  {(dbUser.name ?? "?")[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs text-white/70 hidden md:inline">{dbUser.name}</span>
            </div>

            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8">

        {/* ── Hero Welcome Banner ── */}
        <div className="relative rounded-2xl overflow-hidden border border-[#CA8A04]/30 bg-gradient-to-r from-[#1C1108] via-[#1C1917] to-[#0C0A1A] p-6">
          {/* Glow orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#CA8A04]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          {/* Corner runes */}
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#CA8A04]/50 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#CA8A04]/50 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-[#CA8A04]/50 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-[#CA8A04]/50 rounded-br-lg" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-[#CA8A04]/60 tracking-widest uppercase mb-1">歡迎回來，英雄</p>
                <h1 className="text-3xl font-black text-white" style={{ fontFamily: "'Baloo 2', cursive" }}>
                  {dbUser.name}
                  <span className="ml-2 text-xl text-[#CA8A04]">✦</span>
                </h1>
                <p className="text-sm text-white/40 mt-1">
                  {memberships.length > 0
                    ? `你正在 ${memberships.length} 個世界中冒險`
                    : "開始你的冒險之旅吧！"}
                </p>
              </div>

              {/* XP progress bar */}
              <div className="max-w-xs space-y-1">
                <div className="flex justify-between text-xs text-white/40">
                  <span>Lv.{level}</span>
                  <span>{xp} / {nextLevelXp} XP</span>
                  <span>Lv.{level + 1}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#CA8A04] to-yellow-400 shadow-[0_0_8px_rgba(202,138,4,0.6)] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { value: xp,             label: "總經驗值", color: "text-amber-400",  border: "border-amber-500/30"  },
                { value: completedQuests,label: "完成任務", color: "text-green-400",  border: "border-green-500/30"  },
                { value: memberships.length, label: "所在世界", color: "text-purple-400", border: "border-purple-500/30" },
              ].map((stat, i) => (
                <div key={i} className={`rounded-xl border ${stat.border} bg-[#0C0A09]/50 px-4 py-3 text-center`}>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-white/30 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="relative z-10 mt-4 flex flex-wrap gap-3">
            <div className="rounded-xl border border-[#CA8A04]/20 bg-[#CA8A04]/5 p-1">
              <JoinClassroomButton />
            </div>
            {isTeacher && (
              <Link
                href="/dashboard/classrooms/new"
                className="inline-flex items-center gap-2 rounded-xl border border-purple-500/50 bg-purple-900/30 px-4 py-2.5 text-sm font-bold text-purple-300 transition-all hover:bg-purple-900/50 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-900/30 cursor-pointer"
              >
                <span className="text-lg">+</span> 建立新世界
              </Link>
            )}
          </div>
        </div>

        {/* ── Navigation Grid ── */}
        <div>
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase mb-4">冒險選單</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative rounded-2xl border border-white/10 bg-[#1C1917]/80 p-5 transition-all duration-200 ${item.color} hover:shadow-lg hover:scale-[1.02] cursor-pointer`}
              >
                {/* Corner rune */}
                <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/10 group-hover:border-current rounded-tr-sm transition-colors" />

                <div className="text-3xl mb-3">{item.icon}</div>
                <p className={`font-black text-sm text-white group-hover:${item.tag.replace("text-", "text-")} transition-colors`}>{item.label}</p>
                <p className="text-xs text-white/30 mt-0.5">{item.sub}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Teacher Zone ── */}
        {isTeacher && (
          <div className="rounded-2xl border border-purple-500/30 bg-purple-900/10 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Image src="/teacher-hero.png" alt="Teacher" width={32} height={32} className="rounded-lg" />
              <h2 className="font-black text-purple-300 text-sm tracking-wider uppercase" style={{ fontFamily: "'Baloo 2', cursive" }}>
                教師專區
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { href: "/dashboard/classrooms/new", label: "建立新班級", sub: "開創新的冒險世界" },
                { href: "/dashboard/classrooms",     label: "管理班級",   sub: "查看所有世界"   },
                { href: "/dashboard/courses",        label: "課程管理",   sub: "新增任務與課程" },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="rounded-xl border border-purple-500/20 bg-[#0C0A09]/50 px-4 py-3 text-sm transition-all hover:border-purple-400 hover:bg-purple-900/20 cursor-pointer">
                  <p className="font-bold text-purple-300">{item.label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{item.sub}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── My Worlds (Classrooms) ── */}
        <div>
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase mb-4">我的世界</h2>
          {memberships.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 bg-[#CA8A04]/5 p-12 text-center space-y-3">
              <Image src="/logo.png" alt="logo" width={48} height={48} className="mx-auto opacity-30" />
              <p className="text-lg font-black text-white/40">尚未加入任何世界</p>
              <p className="text-sm text-white/25">
                {isTeacher ? "點擊上方「建立新世界」創建你的第一個班級" : "等待教師邀請你加入，或使用邀請碼加入班級"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {memberships.map(({ classroom, role }) => (
                <div
                  key={classroom.id}
                  className="group relative rounded-2xl border border-white/10 bg-[#1C1917]/80 p-5 hover:border-[#CA8A04]/40 hover:shadow-lg hover:shadow-[#CA8A04]/10 transition-all duration-200 cursor-pointer"
                >
                  {/* Corner runes */}
                  <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#CA8A04]/20 group-hover:border-[#CA8A04]/60 rounded-tl-sm transition-colors" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#CA8A04]/20 group-hover:border-[#CA8A04]/60 rounded-tr-sm transition-colors" />

                  <Link href={`/dashboard/classrooms/${classroom.id}`} className="absolute inset-0 rounded-2xl" />

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-black text-white group-hover:text-[#CA8A04] transition-colors">{classroom.name}</h3>
                      <p className="text-xs text-white/30 mt-0.5">
                        {classroom._count.members} 位冒險者 · {classroom._count.courses} 個任務
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-bold ${
                      role === "TEACHER"
                        ? "border border-purple-500/50 bg-purple-900/30 text-purple-400"
                        : "border border-green-500/50 bg-green-900/30 text-green-400"
                    }`}>
                      {role === "TEACHER" ? "導師" : "勇者"}
                    </span>
                  </div>

                  <div className="relative z-10 flex gap-2">
                    {role === "TEACHER" && (
                      <Link
                        href={`/dashboard/classrooms/${classroom.id}/game`}
                        className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-center text-xs text-white/60 hover:bg-white/10 hover:text-white transition cursor-pointer"
                      >
                        遊戲儀表板
                      </Link>
                    )}
                    <Link
                      href={`/dashboard/classrooms/${classroom.id}/quests`}
                      className={`rounded-lg border border-[#CA8A04]/20 bg-[#CA8A04]/10 py-2 text-center text-xs text-[#CA8A04]/80 hover:bg-[#CA8A04]/20 hover:text-[#CA8A04] transition cursor-pointer ${role === "TEACHER" ? "flex-1" : "flex-1"}`}
                    >
                      任務列表
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
