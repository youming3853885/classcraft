import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeacherGradingPage() {
  const session = await getServerAuthSession();
  if (!session?.user || (session.user.role !== "TEACHER" && session.user.role !== "ADMIN")) redirect("/signin");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser) redirect("/onboarding");

  const pendingSubmissions = await prisma.assignmentSubmission.findMany({
    where: { grade: null, assignment: { course: { classroom: { members: { some: { userId: session.user.id, role: "TEACHER" } } } } } },
    include: { student: { select: { id: true, name: true, image: true } }, assignment: { select: { id: true, title: true, xpReward: true, coinReward: true, dueAt: true } } },
    orderBy: { submittedAt: "asc" },
  });

  const gradedSubmissions = await prisma.assignmentSubmission.findMany({
    where: { NOT: { grade: null }, assignment: { course: { classroom: { members: { some: { userId: session.user.id, role: "TEACHER" } } } } } },
    include: { student: { select: { id: true, name: true, image: true } }, assignment: { select: { id: true, title: true, xpReward: true, coinReward: true } } },
    orderBy: { gradedAt: "desc" },
    take: 20,
  });

  const pendingCount = pendingSubmissions.length;
  const gradedCount = gradedSubmissions.length;

  const SIDEBAR_LINKS = [
    { href: "/teacher/classes", label: "班級列表", icon: "👥" },
    { href: "/teacher/grading", label: `待批改 (${pendingCount})`, icon: "📝", active: true },
    { href: "/teacher/quests", label: "任務編輯", icon: "📜" },
    { href: "/teacher/analytics", label: "戰況分析", icon: "📈" },
    { href: "/teacher/store-manager", label: "商店管理", icon: "🏪" },
  ];

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/teacher/dashboard" className="flex items-center gap-2 cursor-pointer">
              <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
              <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
              <span className="text-xs border border-purple-500/50 bg-purple-900/30 px-2 py-0.5 rounded-md text-purple-400 font-bold">GM</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: "/teacher/dashboard", label: "控制台" },
                { href: "/teacher/grading", label: `批改 (${pendingCount})` },
                { href: "/teacher/analytics", label: "分析" },
                { href: "/teacher/store-manager", label: "商店" },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    l.href === "/teacher/grading" ? "bg-[#CA8A04]/15 text-[#CA8A04] border border-[#CA8A04]/40" : "text-white/40 hover:text-white/70"
                  }`}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
              {dbUser.image ? (
                <img src={dbUser.image} alt="" className="w-4 h-4 rounded-full" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-[#CA8A04]/20 flex items-center justify-center text-[9px] font-black text-[#CA8A04]">
                  {(dbUser.name ?? "?")[0].toUpperCase()}
                </div>
              )}
              <span className="text-xs text-white/60">{dbUser.name}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="hidden md:block w-52 flex-shrink-0 border-r border-[#CA8A04]/10 bg-[#0C0A09] p-4 pt-6 min-h-screen">
          <p className="text-xs font-bold text-[#CA8A04]/40 tracking-widest uppercase mb-3">GM 功能</p>
          <div className="space-y-1.5">
            {SIDEBAR_LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition cursor-pointer ${
                  l.active ? "bg-[#CA8A04]/10 text-[#CA8A04] border border-[#CA8A04]/30" : "text-white/40 hover:text-white/70 hover:bg-white/5"
                }`}>
                <span>{l.icon}</span> {l.label}
              </Link>
            ))}
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 px-6 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>⚖ 戰鬥結算所</h1>
              <p className="text-sm text-white/40 mt-1">批改學生作業，發放獎勵</p>
            </div>
            <div className="flex gap-3">
              {[
                { value: pendingCount, label: "待批改", color: "text-amber-400 border-amber-500/40 bg-amber-900/10" },
                { value: gradedCount, label: "已完成", color: "text-green-400 border-green-500/40 bg-green-900/10" },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl border px-4 py-2 text-center ${s.color}`}>
                  <p className="text-xl font-black">{s.value}</p>
                  <p className="text-xs opacity-60">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Pending */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-amber-400/70 tracking-widest uppercase">⏳ 待批改 ({pendingCount})</h2>
            {pendingSubmissions.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 p-8 text-center">
                <Image src="/logo.png" alt="logo" width={36} height={36} className="mx-auto opacity-10 mb-2" />
                <p className="text-white/30 text-sm">目前沒有待批改的作業</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingSubmissions.map(sub => (
                  <Link key={sub.id} href={`/teacher/grading/${sub.id}`}
                    className="relative group block rounded-xl border border-amber-500/20 bg-amber-900/5 p-4 hover:border-amber-500/50 hover:bg-amber-900/10 transition cursor-pointer">
                    <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t border-l border-amber-500/20 group-hover:border-amber-500/50 rounded-tl-sm transition-colors" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {sub.student.image ? (
                          <img src={sub.student.image} alt="" className="w-9 h-9 rounded-xl ring-1 ring-amber-500/30" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-amber-900/30 border border-amber-500/40 flex items-center justify-center text-sm font-black text-amber-400">
                            {(sub.student.name ?? "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-amber-300 group-hover:text-white transition text-sm">{sub.student.name}</p>
                          <p className="text-xs text-white/30">{sub.assignment.title}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-2 text-xs font-bold">
                          <span className="text-amber-400">+{sub.assignment.xpReward} XP</span>
                          <span className="text-[#CA8A04]">+{sub.assignment.coinReward} 金</span>
                        </div>
                        <p className="text-xs text-white/25 mt-0.5">{sub.submittedAt?.toLocaleDateString("zh-TW")}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Graded */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-green-400/70 tracking-widest uppercase">✓ 最近批改 ({gradedCount})</h2>
            {gradedSubmissions.length === 0 ? (
              <p className="text-xs text-white/25">暫無已批改的作業</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {gradedSubmissions.map(sub => (
                  <div key={sub.id} className="rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {sub.student.image ? (
                        <img src={sub.student.image} alt="" className="w-8 h-8 rounded-xl" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-white/40">
                          {(sub.student.name ?? "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-sm text-white/80">{sub.student.name}</p>
                        <p className="text-xs text-white/30">{sub.assignment.title}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${(sub.score ?? 0) >= 90 ? "text-green-400" : (sub.score ?? 0) >= 70 ? "text-blue-400" : "text-amber-400"}`}>
                        {sub.score ?? 0}分
                      </p>
                      <p className="text-xs text-white/25">{sub.gradedAt?.toLocaleDateString("zh-TW")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
