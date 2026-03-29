import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeacherQuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ classroom?: string }>;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") redirect("/student/dashboard");

  const { classroom: classroomId } = await searchParams;
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "TEACHER" },
    include: { classroom: { include: { _count: { select: { members: true, quests: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  const selectedClassroom = classroomId
    ? memberships.find(m => m.classroomId === classroomId)?.classroom
    : memberships[0]?.classroom;

  let quests: any[] = [];
  if (selectedClassroom) {
    quests = await prisma.quest.findMany({
      where: { classroomId: selectedClassroom.id },
      orderBy: { orderIndex: "asc" },
      include: { _count: { select: { completions: true } } },
    });
  }

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
              <span className="text-xs border border-purple-500/50 bg-purple-900/30 px-2 py-0.5 rounded-md text-purple-400 font-bold">GM</span>
            </Link>
            <span className="text-[#CA8A04]/30">/</span>
            <span className="text-sm font-bold text-[#CA8A04]">任務編輯器</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>任務編輯器</h1>
            <p className="text-sm text-white/40 mt-1">建立與管理班級任務</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Class select */}
            <select
              className="rounded-xl border border-white/10 bg-[#1C1917]/80 px-4 py-2 text-sm text-white/70 outline-none focus:border-[#CA8A04]/50 cursor-pointer"
              defaultValue={classroomId || ""}
              onChange={(e) => {
                const v = e.target.value;
                window.location.href = v ? `/teacher/quests?classroom=${v}` : "/teacher/quests";
              }}
            >
              <option value="">選擇班級</option>
              {memberships.map(({ classroom }) => (
                <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
              ))}
            </select>
            {selectedClassroom && (
              <Link href={`/teacher/classes/${selectedClassroom.id}/quests/new`}
                className="rounded-xl border border-green-500/50 bg-green-900/20 px-5 py-2 text-sm font-bold text-green-300 hover:bg-green-900/40 transition cursor-pointer">
                + 新建任務
              </Link>
            )}
          </div>
        </div>

        {!selectedClassroom ? (
          <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 bg-[#CA8A04]/5 p-12 text-center">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="mx-auto opacity-20 mb-3" />
            <p className="text-white/40">請選擇一個班級來管理任務</p>
          </div>
        ) : quests.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 bg-[#CA8A04]/5 p-12 text-center space-y-3">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="mx-auto opacity-20" />
            <p className="text-white/40">尚未建立任務</p>
            <Link href={`/teacher/classes/${selectedClassroom.id}/quests/new`}
              className="inline-block px-6 py-2.5 rounded-xl border border-green-500/50 bg-green-900/20 text-green-300 font-bold hover:bg-green-900/40 transition cursor-pointer">
              新建任務
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {quests.map((quest, index) => (
              <div key={quest.id} className={`relative rounded-2xl border p-5 transition-all ${
                quest.isActive ? "border-white/10 bg-[#1C1917]/80 hover:border-[#CA8A04]/20" : "border-white/5 bg-[#1C1917]/30 opacity-50"
              }`}>
                <div className="absolute top-3 left-3 w-3.5 h-3.5 border-t border-l border-[#CA8A04]/20 rounded-tl-sm" />
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#CA8A04]/10 border border-[#CA8A04]/30 flex items-center justify-center font-black text-[#CA8A04] text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-white">{quest.title}</h3>
                        {quest.isRequired && <span className="text-xs rounded-lg border border-amber-500/40 bg-amber-900/20 text-amber-400 px-2 py-0.5 font-bold">必做</span>}
                        {!quest.isActive && <span className="text-xs rounded-lg border border-white/10 bg-white/5 text-white/30 px-2 py-0.5 font-bold">已停用</span>}
                      </div>
                      <p className="text-sm text-white/40 mt-1">{quest.description || "暫無描述"}</p>
                      <div className="flex gap-3 mt-2 text-xs font-bold">
                        {quest.xpReward > 0 && <span className="text-amber-400">+{quest.xpReward} XP</span>}
                        {quest.coinReward > 0 && <span className="text-[#CA8A04]">+{quest.coinReward} 金幣</span>}
                        {quest.hpReward !== 0 && <span className={quest.hpReward > 0 ? "text-green-400" : "text-red-400"}>{quest.hpReward > 0 ? "+" : ""}{quest.hpReward} HP</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-green-400">{quest._count.completions}</p>
                    <p className="text-xs text-white/30">完成人次</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/teacher/classes/${selectedClassroom.id}/quests/${quest.id}`}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-white/60 hover:border-[#CA8A04]/30 hover:text-[#CA8A04] transition cursor-pointer">
                    編輯
                  </Link>
                  <form action={`/api/quests/${quest.id}/toggle`} method="POST">
                    <button type="submit"
                      className={`rounded-xl border px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                        quest.isActive ? "border-red-500/30 bg-red-900/10 text-red-400 hover:bg-red-900/20" : "border-green-500/30 bg-green-900/10 text-green-400 hover:bg-green-900/20"
                      }`}>
                      {quest.isActive ? "停用" : "啟用"}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3 justify-center pt-4">
          {[
            { href: "/teacher/dashboard", label: "← GM 控制台" },
            { href: "/teacher/classes", label: "班級管理" },
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
