import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeacherAnalyticsPage({
  searchParams,
}: { searchParams: Promise<{ classroom?: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") redirect("/student/dashboard");

  const { classroom: classroomId } = await searchParams;
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "TEACHER" },
    include: {
      classroom: {
        include: {
          members: { where: { role: "STUDENT" }, include: { user: { select: { name: true, image: true } } } },
          courses: { select: { id: true, title: true, assignments: { select: { id: true, title: true } } } },
          quests: { select: { id: true, title: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const selectedClassroom = classroomId
    ? memberships.find(m => m.classroomId === classroomId)?.classroom
    : memberships[0]?.classroom;

  const totalStudents = memberships.reduce((sum, m) => sum + m.classroom.members.length, 0);
  const totalQuests = memberships.reduce((sum, m) => sum + m.classroom.quests.length, 0);

  let fairnessAnalysis = {
    suspicious: [] as { name: string; reason: string; severity: string }[],
    avgEngagement: 0,
    motivationScore: 0,
    engagementTrend: "stable" as const,
  };

  if (selectedClassroom) {
    const studentEngage = await Promise.all(
      selectedClassroom.members.map(async (member) => {
        const xpResult = await prisma.pointsLedger.aggregate({ where: { targetUserId: member.userId, classroomId: selectedClassroom.id }, _sum: { xpDelta: true } });
        const completedQuests = await prisma.questCompletion.count({ where: { studentId: member.userId } });
        return { name: member.user.name, xp: xpResult._sum.xpDelta ?? 0, completedQuests, totalQuests: selectedClassroom.quests.length };
      })
    );
    const avgXp = studentEngage.length > 0 ? studentEngage.reduce((s, e) => s + e.xp, 0) / studentEngage.length : 0;
    const suspicious = studentEngage
      .filter(s => s.xp > avgXp * 2.5 || (s.totalQuests > 0 && s.completedQuests > s.totalQuests * 1.2))
      .map(s => ({ name: s.name ?? "未知", reason: s.xp > avgXp * 2.5 ? "XP 異常高分" : "完成率異常", severity: s.xp > avgXp * 3 ? "high" : "medium" }));

    const activeStudents = studentEngage.filter(s => s.completedQuests > 0).length;
    const engagementRate = studentEngage.length > 0 ? (activeStudents / studentEngage.length) * 100 : 0;
    const avgCompletion = selectedClassroom.quests.length > 0
      ? (studentEngage.reduce((s, e) => s + e.completedQuests, 0) / (studentEngage.length * selectedClassroom.quests.length)) * 100 : 0;
    const motivationScore = Math.min(100, Math.max(0, Math.round((engagementRate * 0.4) + (avgCompletion * 0.4) + (20 - suspicious.length) * 2)));

    fairnessAnalysis = { suspicious, avgEngagement: Math.round(avgXp), motivationScore, engagementTrend: "stable" };
  }

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
              {["/teacher/dashboard", "/teacher/grading", "/teacher/analytics", "/teacher/store-manager"].map((href, i) => (
                <Link key={href} href={href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    href === "/teacher/analytics" ? "bg-[#CA8A04]/15 text-[#CA8A04] border border-[#CA8A04]/40" : "text-white/40 hover:text-white/70"
                  }`}>
                  {["控制台", "批改", "分析", "商店"][i]}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="rounded-lg border border-white/10 bg-[#1C1917]/80 px-3 py-1.5 text-xs text-white/60 outline-none cursor-pointer"
              defaultValue={classroomId || ""}
              onChange={e => { window.location.href = e.target.value ? `/teacher/analytics?classroom=${e.target.value}` : "/teacher/analytics"; }}>
              <option value="">全部班級</option>
              {memberships.map(({ classroom }) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
            </select>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-[#CA8A04] flex items-center gap-2" style={{ fontFamily: "'Baloo 2', cursive" }}>
            📊 戰況分析
            <span className="text-xs border border-cyan-500/40 bg-cyan-900/20 text-cyan-400 px-2.5 py-1 rounded-lg font-bold">公平與動機儀表板</span>
          </h1>
          <p className="text-sm text-white/40 mt-1">學習動機分析與反刷分檢測</p>
        </div>

        {/* Motivation dashboard */}
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Motivation score */}
          <div className="relative rounded-2xl border border-cyan-500/30 bg-cyan-900/10 p-6">
            <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-cyan-500/30 rounded-tl-sm" />
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎯</span>
              <h2 className="text-sm font-bold text-cyan-400">動機分數</h2>
            </div>
            <div className="text-center">
              <p className={`text-5xl font-black ${fairnessAnalysis.motivationScore >= 70 ? "text-green-400" : fairnessAnalysis.motivationScore >= 40 ? "text-amber-400" : "text-red-400"}`}>
                {fairnessAnalysis.motivationScore}
              </p>
              <p className="text-xs text-white/30 mt-1">/ 100</p>
            </div>
            <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${fairnessAnalysis.motivationScore >= 70 ? "bg-green-500" : fairnessAnalysis.motivationScore >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${fairnessAnalysis.motivationScore}%` }} />
            </div>
          </div>

          {/* Anti-cheat */}
          <div className={`relative rounded-2xl border p-6 ${fairnessAnalysis.suspicious.length > 0 ? "border-red-500/30 bg-red-900/10" : "border-green-500/30 bg-green-900/10"}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">⚠</span>
              <h2 className={`text-sm font-bold ${fairnessAnalysis.suspicious.length > 0 ? "text-red-400" : "text-green-400"}`}>反刷分檢測</h2>
            </div>
            {fairnessAnalysis.suspicious.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-green-400 font-bold text-sm">未檢測到異常</p>
                <p className="text-xs text-white/30 mt-1">所有學生表現正常</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-red-400 font-bold">檢測到 {fairnessAnalysis.suspicious.length} 個異常</p>
                {fairnessAnalysis.suspicious.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-red-900/20 px-3 py-2 text-xs">
                    <span className="text-white/70">{s.name}</span>
                    <span className={`font-bold rounded px-2 py-0.5 ${s.severity === "high" ? "bg-red-600/30 text-red-300" : "bg-amber-600/30 text-amber-300"}`}>{s.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Engagement */}
          <div className="relative rounded-2xl border border-purple-500/30 bg-purple-900/10 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">📈</span>
              <h2 className="text-sm font-bold text-purple-400">參與度趨勢</h2>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-3xl font-black text-purple-400">{fairnessAnalysis.avgEngagement}</p>
                <p className="text-xs text-white/30 mt-1">平均 XP</p>
              </div>
              <span className="text-3xl text-white/30">→</span>
            </div>
          </div>
        </div>

        {/* Overview stats */}
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {[
            { val: totalStudents, label: "總學生數", color: "text-green-400", border: "border-green-500/20" },
            { val: totalQuests, label: "總任務數", color: "text-purple-400", border: "border-purple-500/20" },
            { val: `100%`, label: "平均 HP", color: "text-red-400", border: "border-red-500/20" },
            { val: "Lv.1", label: "平均等級", color: "text-amber-400", border: "border-amber-500/20" },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl border ${s.border} bg-[#1C1917]/80 p-5 text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
              <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Per-classroom details */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">班級詳情</h2>
          <div className="space-y-4">
            {memberships.map(({ classroom }) => (
              <div key={classroom.id} className="relative rounded-2xl border border-white/10 bg-[#1C1917]/80 p-5">
                <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#CA8A04]/20 rounded-tl-sm" />
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-white">{classroom.name}</h3>
                    <p className="text-xs text-white/30">{classroom.members.length} 位學生 · {classroom.quests.length} 個任務</p>
                  </div>
                  <Link href={`/teacher/classes/${classroom.id}`}
                    className="text-xs text-[#CA8A04]/60 hover:text-[#CA8A04] transition cursor-pointer">查看詳情 →</Link>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "平均 HP", val: "100%", color: "text-green-400" },
                    { label: "平均等級", val: "Lv.1", color: "text-purple-400" },
                    { label: "任務完成率", val: "0%", color: "text-amber-400" },
                  ].map((s, i) => (
                    <div key={i} className="rounded-xl bg-black/20 p-3 text-center">
                      <p className={`font-black text-lg ${s.color}`}>{s.val}</p>
                      <p className="text-xs text-white/25">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
