import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function QuestMapPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id },
    include: {
      classroom: {
        include: {
          quests: {
            where: { isActive: true },
            orderBy: { orderIndex: "asc" },
            include: { completions: { where: { studentId: session.user.id } } },
          },
        },
      },
    },
  });

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
              <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
              <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
            </Link>
            <span className="text-[#CA8A04]/30">/</span>
            <span className="text-sm font-bold text-[#CA8A04]">冒險地圖</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>冒險地圖</h1>
          <p className="text-sm text-white/40 mt-1">選擇任務點，踏上你的傳奇征途！</p>
        </div>

        {memberships.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 bg-[#CA8A04]/5 p-12 text-center">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="mx-auto opacity-20 mb-3" />
            <p className="text-white/40">尚未加入任何班級</p>
          </div>
        ) : (
          <div className="space-y-12">
            {memberships.map(({ classroom }) => (
              <section key={classroom.id}>
                <h2 className="text-lg font-black text-white/80 mb-4 flex items-center gap-2" style={{ fontFamily: "'Baloo 2', cursive" }}>
                  <span className="text-[#CA8A04]">◆</span> {classroom.name}
                </h2>

                {/* Visual map */}
                <div className="relative h-48 rounded-2xl border border-[#CA8A04]/20 bg-[#1C1917]/80 overflow-hidden mb-6">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-8 left-8 text-5xl">🏔</div>
                    <div className="absolute top-16 right-16 text-4xl">🌲</div>
                    <div className="absolute bottom-8 left-1/4 text-5xl">🏰</div>
                    <div className="absolute bottom-16 right-1/3 text-3xl">🌊</div>
                  </div>
                  <svg className="absolute inset-0 w-full h-full opacity-20">
                    <path d="M 50 180 Q 150 80 250 130 T 450 80" fill="none" stroke="#CA8A04" strokeWidth="3" strokeDasharray="8 4" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-around px-8">
                    {classroom.quests.length === 0 ? (
                      <p className="text-white/30 text-sm">此班級尚無任務</p>
                    ) : (
                      classroom.quests.map((quest, index) => {
                        const completed = quest.completions.length > 0;
                        const isNext = index === 0 || classroom.quests[index - 1].completions.length > 0;
                        return (
                          <div key={quest.id} className="relative group">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-black transition-all ${
                              completed ? "bg-green-500 shadow-[0_0_16px_rgba(34,197,94,0.5)]"
                                : isNext ? "bg-[#CA8A04] shadow-[0_0_16px_rgba(202,138,4,0.6)] animate-pulse"
                                : "bg-white/10 text-white/30"
                            }`}>
                              {completed ? "✓" : isNext ? quest.orderIndex + 1 : "🔒"}
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-xl border border-[#CA8A04]/30 bg-[#0C0A09]/95 p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              <p className="font-bold text-xs text-white">{quest.title}</p>
                              <div className="mt-1.5 flex gap-2 text-xs">
                                {quest.xpReward > 0 && <span className="text-amber-400">+{quest.xpReward} XP</span>}
                                {quest.coinReward > 0 && <span className="text-[#CA8A04]">+{quest.coinReward} 金</span>}
                              </div>
                              {completed && <p className="text-xs text-green-400 mt-1">✓ 已完成</p>}
                            </div>
                            <p className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs text-white/40 text-center whitespace-nowrap max-w-20 truncate">{quest.title}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Quest list */}
                <div className="space-y-3">
                  {classroom.quests.map((quest, index) => {
                    const completed = quest.completions.length > 0;
                    const isNext = index === 0 || classroom.quests[index - 1].completions.length > 0;
                    return (
                      <div key={quest.id} className={`rounded-xl border p-4 flex items-center justify-between transition-all ${
                        completed ? "border-green-500/30 bg-green-900/10"
                          : isNext ? "border-[#CA8A04]/40 bg-[#CA8A04]/5"
                          : "border-white/10 bg-[#1C1917]/60"
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                            completed ? "bg-green-500" : isNext ? "bg-[#CA8A04] text-[#0C0A09]" : "bg-white/10 text-white/30"
                          }`}>
                            {completed ? "✓" : index + 1}
                          </span>
                          <div>
                            <p className="font-bold text-sm text-white">{quest.title}</p>
                            {quest.description && <p className="text-xs text-white/40">{quest.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold">
                          {quest.xpReward > 0 && <span className="text-amber-400">+{quest.xpReward} XP</span>}
                          {quest.coinReward > 0 && <span className="text-[#CA8A04]">+{quest.coinReward} 金</span>}
                          {quest.isRequired && <span className="rounded-lg border border-red-500/40 bg-red-900/20 px-2 py-0.5 text-red-400">必修</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
