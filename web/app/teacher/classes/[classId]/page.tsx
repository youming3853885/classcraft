import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeacherClassroomPage({ params }: { params: Promise<{ classId: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") redirect("/student/dashboard");
  const { classId } = await params;
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const member = await prisma.classroomMember.findUnique({ where: { classroomId_userId: { classroomId: classId, userId: session.user.id } } });
  if (!member || member.role !== "TEACHER") redirect("/teacher/classes");

  const classroom = await prisma.classroom.findUnique({
    where: { id: classId },
    include: {
      members: { include: { user: { select: { id: true, name: true, email: true, image: true } } }, orderBy: { joinedAt: "asc" } },
      quests: { orderBy: { orderIndex: "asc" }, where: { isActive: true } },
      teams: { include: { members: { include: { user: { select: { name: true } } } } } },
      _count: { select: { members: true, quests: true, teams: true } },
    },
  });
  if (!classroom) notFound();

  const studentMembers = classroom.members.filter(m => m.role === "STUDENT");
  const studentStats = await Promise.all(
    studentMembers.map(async (m) => {
      const xpResult = await prisma.pointsLedger.aggregate({ where: { targetUserId: m.userId, classroomId: classId }, _sum: { xpDelta: true, hpDelta: true } });
      const completedQuests = await prisma.questCompletion.count({ where: { studentId: m.userId } });
      return { ...m, totalXp: xpResult._sum.xpDelta ?? 0, totalHp: xpResult._sum.hpDelta ?? 0, completedQuests };
    })
  );
  const avgXp = studentStats.length > 0 ? Math.round(studentStats.reduce((s, m) => s + m.totalXp, 0) / studentStats.length) : 0;
  const avgHp = studentStats.length > 0 ? Math.round(classroom.initialHp + studentStats.reduce((s, m) => s + m.totalHp, 0) / studentStats.length) : classroom.initialHp;

  const NAV_ACTIONS = [
    { href: `/teacher/classes/${classId}/game`, icon: "🎮", label: "遊戲儀表板", color: "hover:border-purple-500/50 hover:bg-purple-900/10" },
    { href: `/teacher/classes/${classId}/teams`, icon: "👥", label: "隊伍管理", color: "hover:border-green-500/50 hover:bg-green-900/10" },
    { href: `/teacher/classes/${classId}/boss`, icon: "👹", label: "魔王對決", color: "hover:border-red-500/50 hover:bg-red-900/10" },
    { href: `/teacher/classes/${classId}/events`, icon: "🎲", label: "命運之輪", color: "hover:border-amber-500/50 hover:bg-amber-900/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/teacher/classes" className="flex items-center gap-2 text-white/40 hover:text-white/80 transition cursor-pointer">
              <Image src="/logo.png" alt="logo" width={22} height={22} className="opacity-60" />
              <span className="text-sm hidden sm:inline">← 班級列表</span>
            </Link>
            <span className="text-[#CA8A04]/30">/</span>
            <span className="text-sm font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>{classroom.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {[
              { href: `/teacher/classes/${classId}/quests`, label: "任務管理", color: "text-green-400 border-green-500/40 bg-green-900/10 hover:bg-green-900/25" },
              { href: `/teacher/grading?classroom=${classId}`, label: "批改作業", color: "text-amber-400 border-amber-500/40 bg-amber-900/10 hover:bg-amber-900/25" },
            ].map(btn => (
              <Link key={btn.href} href={btn.href}
                className={`hidden sm:inline-block rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${btn.color}`}>
                {btn.label}
              </Link>
            ))}
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Hero banner */}
        <div className="relative rounded-2xl border border-[#CA8A04]/30 bg-gradient-to-r from-[#1C1108] to-[#1C1917] p-6 overflow-hidden">
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#CA8A04]/50 rounded-tl-md" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#CA8A04]/50 rounded-tr-md" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Baloo 2', cursive" }}>{classroom.name}</h1>
              <p className="text-sm text-white/40 mt-1">
                {classroom._count.members} 位學生 · {classroom._count.quests} 個任務 · {classroom._count.teams} 個隊伍
              </p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: avgXp, label: "平均 XP", color: "text-purple-400" },
                { value: avgHp, label: "平均 HP", color: "text-green-400" },
                { value: classroom._count.quests, label: "任務數", color: "text-amber-400" },
                { value: classroom._count.teams, label: "隊伍數", color: "text-cyan-400" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl bg-black/30 px-3 py-3 text-center">
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-white/25">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {NAV_ACTIONS.map(item => (
            <Link key={item.href} href={item.href}
              className={`group relative rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 text-center transition-all duration-200 ${item.color} cursor-pointer`}>
              <div className="text-2xl mb-2">{item.icon}</div>
              <p className="font-bold text-sm text-white">{item.label}</p>
            </Link>
          ))}
        </div>

        {/* Student list */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">英雄列表 ({studentMembers.length})</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {studentMembers.map((member) => {
              const stats = studentStats.find(s => s.userId === member.userId);
              return (
                <div key={member.id} className="relative rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 hover:border-[#CA8A04]/20 transition-all">
                  <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-[#CA8A04]/15 rounded-tl-sm" />
                  <div className="flex items-center gap-3 mb-3">
                    {member.user.image ? (
                      <img src={member.user.image} alt="" className="w-9 h-9 rounded-xl ring-1 ring-[#CA8A04]/20" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-[#CA8A04]/10 border border-[#CA8A04]/30 flex items-center justify-center text-sm font-black text-[#CA8A04]">
                        {(member.user.name ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-white">{member.user.name}</p>
                      <p className="text-xs text-white/30 truncate">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-purple-400">✨ {stats?.totalXp ?? 0} XP</span>
                    <span className="text-green-400">❤ {classroom.initialHp + (stats?.totalHp ?? 0)} HP</span>
                    <span className="text-amber-400">🏆 {stats?.completedQuests ?? 0}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Teams */}
        {classroom.teams.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">隊伍 ({classroom.teams.length})</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {classroom.teams.map(team => (
                <div key={team.id} className="relative rounded-xl border border-white/10 bg-[#1C1917]/80 p-4">
                  <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-[#CA8A04]/15 rounded-tl-sm" />
                  <h3 className="font-bold text-white mb-2">{team.name}</h3>
                  <p className="text-xs text-white/30 mb-2">{team.members.length} 位成員</p>
                  <div className="flex flex-wrap gap-1.5">
                    {team.members.map(m => (
                      <span key={m.id} className="text-xs rounded-lg border border-white/10 bg-white/5 px-2 py-0.5 text-white/50">{m.user.name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
