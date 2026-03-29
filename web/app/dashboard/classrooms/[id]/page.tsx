import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { InviteCodeButton } from "@/components/invite-code-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");

  const { id } = await params;

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId: id, userId: session.user.id } },
  });
  if (!member) notFound();

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true, role: true } } },
        orderBy: { joinedAt: "asc" },
      },
      courses: {
        include: { assignments: { select: { id: true, title: true, dueAt: true, xpReward: true, coinReward: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!classroom) notFound();

  const isTeacher = member.role === "TEACHER" || member.role === "ASSISTANT";

  const NAV_ACTIONS = [
    { href: `/dashboard/classrooms/${id}/game`, icon: "📊", label: "遊戲儀表板", sub: "全班狀態監控", color: "hover:border-red-500/50 hover:bg-red-900/10" },
    { href: `/dashboard/classrooms/${id}/quests`, icon: "📋", label: "任務管理", sub: "建立與發布任務", color: "hover:border-purple-500/50 hover:bg-purple-900/10" },
    { href: `/dashboard/classrooms/${id}/boss`, icon: "👹", label: "魔王對決", sub: "答題打怪遊戲", color: "hover:border-red-500/50 hover:bg-red-900/10" },
    { href: `/dashboard/classrooms/${id}/events`, icon: "🎡", label: "命運之輪", sub: "隨機事件", color: "hover:border-amber-500/50 hover:bg-amber-900/10" },
  ];

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white/80 transition cursor-pointer">
              <Image src="/logo.png" alt="logo" width={22} height={22} className="opacity-60" />
              <span className="text-sm hidden sm:inline">← 返回</span>
            </Link>
            <span className="text-[#CA8A04]/30">/</span>
            <span className="text-sm font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>{classroom.name}</span>
            <span className={`text-xs px-2 py-1 rounded-lg font-bold ${
              isTeacher ? "border border-purple-500/50 bg-purple-900/20 text-purple-400" : "border border-green-500/50 bg-green-900/20 text-green-400"
            }`}>
              {isTeacher ? "導師" : "勇者"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isTeacher && classroom.inviteCode && (
              <InviteCodeButton code={classroom.inviteCode} />
            )}
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 space-y-8">
        {/* Function nav */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {NAV_ACTIONS.map(item => (
            <Link key={item.href} href={item.href}
              className={`group relative rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 transition-all duration-200 ${item.color} cursor-pointer`}>
              <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-white/10 group-hover:border-[#CA8A04]/30 rounded-tr-sm transition-colors" />
              <span className="text-2xl mb-2 block">{item.icon}</span>
              <p className="font-bold text-sm text-white">{item.label}</p>
              <p className="text-xs text-white/30 mt-0.5">{item.sub}</p>
            </Link>
          ))}
        </div>

        {/* Courses */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">任務線</h2>
            {isTeacher && (
              <Link href={`/dashboard/classrooms/${id}/courses/new`}
                className="rounded-xl border border-[#CA8A04]/40 bg-[#CA8A04]/10 px-4 py-1.5 text-xs font-bold text-[#CA8A04] hover:bg-[#CA8A04]/20 transition cursor-pointer">
                + 建立課程
              </Link>
            )}
          </div>

          {classroom.courses.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-white/10 p-8 text-center text-white/30 text-sm">
              {isTeacher ? "點擊「建立課程」新增第一個任務線" : "尚無任務發布"}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {classroom.courses.map(course => (
                <div key={course.id} className="relative rounded-xl border border-white/10 bg-[#1C1917]/80 p-5 hover:border-[#CA8A04]/20 transition-all">
                  <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-[#CA8A04]/20 rounded-tl-sm" />
                  <h3 className="font-bold text-white">{course.title}</h3>
                  {course.description && <p className="text-xs text-white/30 mt-1">{course.description}</p>}
                  <div className="mt-3 space-y-2">
                    {course.assignments.map(a => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-[#0C0A09]/40 px-3 py-2 text-xs">
                        <span className="text-white/70">{a.title}</span>
                        <div className="flex gap-2 font-bold">
                          <span className="text-amber-400">+{a.xpReward} XP</span>
                          <span className="text-[#CA8A04]">+{a.coinReward} 金</span>
                        </div>
                      </div>
                    ))}
                    {isTeacher && (
                      <Link href={`/dashboard/courses/${course.id}/assignments/new`}
                        className="block text-center text-xs text-[#CA8A04]/50 hover:text-[#CA8A04] py-1.5 transition cursor-pointer">
                        + 新增任務
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Members */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">
            冒險者們 ({classroom.members.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classroom.members.map(({ user, role }) => (
              <div key={user.id} className="rounded-xl border border-white/10 bg-[#1C1917]/80 px-4 py-3 flex items-center gap-3">
                {user.image ? (
                  <img src={user.image} alt={user.name ?? ""} className="w-9 h-9 rounded-xl ring-1 ring-[#CA8A04]/20" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#CA8A04]/10 border border-[#CA8A04]/30 flex items-center justify-center text-sm font-black text-[#CA8A04]">
                    {(user.name ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">{user.name ?? "未命名"}</p>
                  <p className="text-xs text-white/30 truncate">{user.email}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                  role === "TEACHER" ? "border border-purple-500/40 text-purple-400" : "border border-green-500/40 text-green-400"
                }`}>
                  {role === "TEACHER" ? "導師" : "勇者"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Teacher tools */}
        {isTeacher && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">導師工具</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { href: `/dashboard/classrooms/${id}/teams`, label: "團隊管理", sub: "分組與隊伍管理" },
                { href: `/dashboard/classrooms/${id}/courses/new`, label: "建立課程", sub: "新增任務線" },
                { href: `/teacher/grading?classroom=${id}`, label: "批改作業", sub: "查看學生提交" },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="rounded-xl border border-purple-500/20 bg-purple-900/10 px-4 py-3 hover:border-purple-500/50 hover:bg-purple-900/20 transition cursor-pointer">
                  <p className="font-bold text-sm text-purple-300">{item.label}</p>
                  <p className="text-xs text-white/30 mt-0.5">{item.sub}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
