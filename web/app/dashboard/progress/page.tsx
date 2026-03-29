import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProgressPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id },
    include: { classroom: true },
  });

  const stats: { classroomId: string; classroomName: string; xp: number; coins: number; hp: number }[] = [];
  for (const m of memberships) {
    const xpResult = await prisma.pointsLedger.aggregate({ where: { targetUserId: session.user.id, classroomId: m.classroom.id }, _sum: { xpDelta: true } });
    const wallet = await prisma.wallet.findUnique({ where: { userId_classroomId_currency: { userId: session.user.id, classroomId: m.classroom.id, currency: "COINS" } } });
    const hpResult = await prisma.pointsLedger.aggregate({ where: { targetUserId: session.user.id, classroomId: m.classroom.id }, _sum: { hpDelta: true } });
    stats.push({ classroomId: m.classroom.id, classroomName: m.classroom.name, xp: xpResult._sum.xpDelta ?? 0, coins: wallet?.balance ?? 0, hp: 100 + (hpResult._sum.hpDelta ?? 0) });
  }

  const recentEvents = await prisma.pointsLedger.findMany({
    where: { targetUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { classroom: { select: { name: true } }, actorUser: { select: { name: true } } },
  });

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
              <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
              <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
            </Link>
            <span className="text-[#CA8A04]/30">/</span>
            <span className="text-sm font-bold text-[#CA8A04]">我的進度</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>我的進度</h1>
          <p className="text-sm text-white/40 mt-1">即時追蹤你在各班級的冒險成果</p>
        </div>

        {stats.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 bg-[#CA8A04]/5 p-12 text-center">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="mx-auto opacity-20 mb-3" />
            <p className="text-white/40">你還沒加入任何班級</p>
          </div>
        ) : (
          <>
            {/* Per-classroom stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map((s) => (
                <div key={s.classroomId} className="relative rounded-2xl border border-[#CA8A04]/20 bg-[#1C1917]/80 p-5 hover:border-[#CA8A04]/40 transition-all">
                  <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#CA8A04]/25 rounded-tl-sm" />
                  <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#CA8A04]/25 rounded-tr-sm" />
                  <p className="text-xs text-white/40 mb-3">{s.classroomName}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "XP", value: s.xp, color: "text-amber-400" },
                      { label: "金幣", value: s.coins, color: "text-[#CA8A04]" },
                      { label: "HP", value: s.hp, color: s.hp < 30 ? "text-red-400" : "text-green-400" },
                    ].map(stat => (
                      <div key={stat.label} className="text-center">
                        <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-white/25">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent events */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">最近點數變動</h2>
              {recentEvents.length === 0 ? (
                <p className="text-sm text-white/30">尚無點數紀錄</p>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-[#1C1917]/80 divide-y divide-white/5 overflow-hidden">
                  {recentEvents.map((e) => (
                    <div key={e.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                      <div>
                        <p className="text-sm font-bold text-white">{e.classroom.name}</p>
                        <p className="text-xs text-white/30">{e.reason ?? e.eventType}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-bold">
                        {e.xpDelta !== 0 && <span className={e.xpDelta > 0 ? "text-amber-400" : "text-red-400"}>{e.xpDelta > 0 ? "+" : ""}{e.xpDelta} XP</span>}
                        {e.coinDelta !== 0 && <span className={e.coinDelta > 0 ? "text-[#CA8A04]" : "text-red-400"}>{e.coinDelta > 0 ? "+" : ""}{e.coinDelta} 金</span>}
                        {e.hpDelta !== 0 && <span className={e.hpDelta > 0 ? "text-green-400" : "text-red-400"}>{e.hpDelta > 0 ? "+" : ""}{e.hpDelta} HP</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
