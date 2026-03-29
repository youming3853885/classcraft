import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeacherClassesPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") redirect("/student/dashboard");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "TEACHER" },
    include: {
      classroom: {
        include: {
          organization: true,
          _count: { select: { members: true, quests: true, teams: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/teacher/dashboard" className="flex items-center gap-2 cursor-pointer">
              <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
              <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
              <span className="text-xs border border-purple-500/50 bg-purple-900/30 px-2 py-0.5 rounded-md text-purple-400 font-bold">GM 控制台</span>
            </Link>
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
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>班級與英雄管理</h1>
            <p className="text-sm text-white/40 mt-1">管理你的班級世界與學生英雄</p>
          </div>
          <Link href="/teacher/classes/new"
            className="rounded-xl border border-purple-500/50 bg-purple-900/20 px-5 py-2.5 text-sm font-bold text-purple-300 hover:bg-purple-900/40 hover:border-purple-400 transition shadow-lg shadow-purple-900/20 cursor-pointer">
            + 建立新班級
          </Link>
        </div>

        {memberships.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 bg-[#CA8A04]/5 p-12 text-center space-y-4">
            <Image src="/logo.png" alt="logo" width={48} height={48} className="mx-auto opacity-20" />
            <p className="text-xl font-black text-white/40">尚未建立任何班級</p>
            <p className="text-sm text-white/25">點擊上方「建立新班級」創建你的第一個班級</p>
            <Link href="/teacher/classes/new" className="inline-block mt-2 px-6 py-3 rounded-xl border border-purple-500/50 bg-purple-900/20 text-purple-300 font-bold hover:bg-purple-900/40 transition cursor-pointer">
              建立班級
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {memberships.map(({ classroom }) => (
              <div key={classroom.id} className="relative rounded-2xl border border-white/10 bg-[#1C1917]/80 p-5 hover:border-[#CA8A04]/40 hover:shadow-lg hover:shadow-[#CA8A04]/5 transition-all group">
                <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#CA8A04]/20 group-hover:border-[#CA8A04]/50 rounded-tl-sm transition-colors" />
                <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#CA8A04]/20 group-hover:border-[#CA8A04]/50 rounded-tr-sm transition-colors" />

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-black text-white group-hover:text-[#CA8A04] transition-colors">{classroom.name}</h3>
                    <p className="text-xs text-white/30 mt-0.5">
                      {classroom._count.members} 位英雄 · {classroom._count.quests} 個任務 · {classroom._count.teams} 隊
                    </p>
                  </div>
                  <span className="text-xs border border-purple-500/40 bg-purple-900/20 text-purple-400 px-2 py-0.5 rounded-md font-bold">導師</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold mb-4 py-2 border-t border-white/5">
                  <div><span className="text-green-400">HP {classroom.initialHp}</span><br /><span className="text-white/20">初始</span></div>
                  <div><span className="text-purple-400">AP {classroom.dailyAp}</span><br /><span className="text-white/20">每日</span></div>
                  <div><span className="text-[#CA8A04]">隊伍 {classroom._count.teams}</span><br /><span className="text-white/20">分組</span></div>
                </div>

                <div className="flex gap-2">
                  {[
                    { href: `/teacher/classes/${classroom.id}`, label: "管理", color: "border-purple-500/30 text-purple-400 hover:bg-purple-900/20" },
                    { href: `/teacher/classes/${classroom.id}/quests`, label: "任務", color: "border-white/10 text-white/50 hover:border-white/20" },
                    { href: `/teacher/grading?classroom=${classroom.id}`, label: "批改", color: "border-white/10 text-white/50 hover:border-white/20" },
                  ].map(btn => (
                    <Link key={btn.href} href={btn.href}
                      className={`flex-1 rounded-lg border py-2 text-center text-xs font-bold transition cursor-pointer ${btn.color}`}>
                      {btn.label}
                    </Link>
                  ))}
                </div>

                {classroom.inviteCode && (
                  <div className="mt-3 rounded-lg border border-[#CA8A04]/20 bg-[#CA8A04]/5 px-3 py-2 text-center">
                    <p className="text-xs text-white/25 mb-0.5">邀請碼</p>
                    <p className="font-mono text-sm font-black text-[#CA8A04]">{classroom.inviteCode}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Footer nav */}
        <div className="flex gap-3 justify-center pt-4">
          {[
            { href: "/teacher/dashboard", label: "← GM 控制台" },
            { href: "/teacher/analytics", label: "戰況分析" },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-white/50 hover:border-white/20 hover:text-white transition cursor-pointer">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
