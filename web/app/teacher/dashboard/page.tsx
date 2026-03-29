import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Shared teacher RPG navbar
function TeacherNav({ active, dbUser, pendingGrading }: { active: string; dbUser: any; pendingGrading: number }) {
  const LINKS = [
    { href: "/teacher/dashboard", label: "控制台" },
    { href: "/teacher/grading", label: `批改 (${pendingGrading})` },
    { href: "/teacher/analytics", label: "分析" },
    { href: "/teacher/store-manager", label: "商店" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/teacher/dashboard" className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
            <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
            <span className="text-xs border border-purple-500/50 bg-purple-900/30 px-2 py-0.5 rounded-md text-purple-400 font-bold">GM</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {LINKS.map(l => (
              <Link key={l.href} href={l.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  active === l.href ? "bg-[#CA8A04]/15 text-[#CA8A04] border border-[#CA8A04]/40" : "text-white/40 hover:text-white/70"
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
                {dbUser.name[0].toUpperCase()}
              </div>
            )}
            <span className="text-xs text-white/60">{dbUser.name}</span>
            <span className="text-xs text-purple-400 font-bold">GM</span>
          </div>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

export default async function TeacherDashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") redirect("/student/dashboard");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "TEACHER" },
    include: { classroom: { include: { _count: { select: { members: true, courses: true, quests: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  const classroomIds = memberships.map(m => m.classroomId);
  const pendingGrading = await prisma.assignmentSubmission.count({
    where: { assignment: { course: { classroomId: { in: classroomIds } } }, grade: null },
  });

  let avgHp = 100;
  if (memberships.length > 0) {
    const students = await prisma.classroomMember.findMany({
      where: { classroomId: { in: classroomIds }, role: "STUDENT" }, select: { currentHp: true },
    });
    if (students.length > 0) avgHp = Math.round(students.reduce((s, st) => s + st.currentHp, 0) / students.length);
  }

  const rewardItems = await prisma.rewardItem.findMany({
    where: { organizationId: { in: memberships.map(m => m.classroom.organizationId) } },
    select: { id: true, isActive: true, coinCost: true },
  });
  const activeRewards = rewardItems.filter(r => r.isActive).length;
  const equipmentCount = await prisma.equipment.count();
  const consumableCount = await prisma.consumable.count();

  const totalStudents = memberships.reduce((s, m) => s + m.classroom._count.members, 0);

  const QUICK_ACTIONS = [
    { href: "/teacher/store-manager", icon: "➕", label: "新增獎勵", color: "hover:border-purple-500/50" },
    { href: "/teacher/grading", icon: "📝", label: "批改作業", color: "hover:border-amber-500/50" },
    { href: "/teacher/quests", icon: "📜", label: "創建任務", color: "hover:border-green-500/50" },
    { href: "/teacher/analytics", icon: "📊", label: "查看數據", color: "hover:border-cyan-500/50" },
  ];

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />
      <TeacherNav active="/teacher/dashboard" dbUser={dbUser} pendingGrading={pendingGrading} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8 space-y-8">
        {/* Hero banner */}
        <div className="relative rounded-2xl border border-[#CA8A04]/30 bg-gradient-to-r from-[#1C1108] to-[#120D1E] p-6 overflow-hidden">
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#CA8A04]/50 rounded-tl-md" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#CA8A04]/50 rounded-tr-md" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Baloo 2', cursive" }}>
                GM 控制台，
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#CA8A04] to-[#D97706]">{dbUser.name}</span>
              </h1>
              <p className="text-sm text-white/40 mt-1">你正在管理 {memberships.length} 個班級世界</p>
            </div>
            <Link href="/teacher/classes/new"
              className="rounded-xl border border-purple-500/50 bg-purple-900/20 px-5 py-2.5 text-sm font-bold text-purple-300 hover:bg-purple-900/40 transition shadow-lg shadow-purple-900/20 cursor-pointer flex-shrink-0">
              + 建立新班級
            </Link>
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { v: totalStudents, l: "總學生數", c: "text-green-400" },
              { v: `${avgHp}%`, l: "平均 HP", c: "text-red-400" },
              { v: pendingGrading, l: "待批改", c: "text-amber-400" },
              { v: memberships.length, l: "管理班級", c: "text-purple-400" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-black/30 px-4 py-3 text-center">
                <p className={`text-xl font-black ${s.c}`}>{s.v}</p>
                <p className="text-xs text-white/25">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Store management */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">獎勵商店管理</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { href: "/teacher/store-manager", icon: "⚔", label: "虛擬裝備", sub: "武器、防具、飾品", count: equipmentCount, color: "border-purple-500/30 hover:border-purple-400/50 text-purple-400" },
              { href: "/teacher/store-manager", icon: "🧪", label: "消耗品", sub: "藥水、卷軸、道具", count: consumableCount, color: "border-green-500/30 hover:border-green-400/50 text-green-400" },
              { href: "/teacher/store-manager", icon: "🎁", label: "實體獎勵", sub: "兌換券、禮物、獎品", count: activeRewards, color: "border-amber-500/30 hover:border-amber-400/50 text-amber-400" },
            ].map(item => (
              <Link key={item.href + item.label} href={item.href}
                className={`relative rounded-xl border bg-[#1C1917]/80 p-5 hover:shadow-lg transition group cursor-pointer ${item.color}`}>
                <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t border-l border-current opacity-20 group-hover:opacity-40 rounded-tl-sm transition-opacity" />
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className={`font-bold ${item.color.split(" ")[3]}`}>{item.label}</p>
                    <p className="text-xs text-white/25">{item.sub}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/40">{item.count} 件上架中</span>
                  <span className="text-xs text-white/30 group-hover:text-white/60 transition">管理 →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">快速操作</h2>
          <div className="grid gap-4 sm:grid-cols-4">
            {QUICK_ACTIONS.map(item => (
              <Link key={item.href + item.label} href={item.href}
                className={`rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 text-center transition cursor-pointer ${item.color} hover:bg-white/5`}>
                <span className="text-2xl block mb-2">{item.icon}</span>
                <span className="font-bold text-sm text-white/70">{item.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Class list */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">我的班級</h2>
          {memberships.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 bg-[#CA8A04]/5 p-12 text-center">
              <Image src="/logo.png" alt="logo" width={48} height={48} className="mx-auto opacity-20 mb-3" />
              <p className="text-white/40">尚未建立任何班級</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {memberships.map(({ classroom }) => (
                <Link key={classroom.id} href={`/teacher/classes/${classroom.id}`}
                  className="relative group rounded-2xl border border-white/10 bg-[#1C1917]/80 p-5 hover:border-[#CA8A04]/40 hover:shadow-[0_0_20px_rgba(202,138,4,0.05)] transition-all cursor-pointer">
                  <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#CA8A04]/20 group-hover:border-[#CA8A04]/50 rounded-tl-sm transition-colors" />
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-black text-white group-hover:text-[#CA8A04] transition-colors">{classroom.name}</h3>
                      <p className="text-xs text-white/30 mt-0.5">{classroom._count.members} 位學生 · {classroom._count.quests} 個任務</p>
                    </div>
                    <span className="text-xs border border-purple-500/40 bg-purple-900/20 text-purple-400 px-2 py-0.5 rounded-md font-bold">導師</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                    {["📊 遊戲", "📋 任務", "👥 隊伍"].map(t => (
                      <span key={t} className="rounded-lg border border-white/5 bg-white/5 py-1.5">{t}</span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}