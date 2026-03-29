import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function FeedPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");

  const pointEvents = await prisma.pointsLedger.findMany({
    where: { targetUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      classroom: { select: { name: true } },
      actorUser: { select: { name: true } },
    },
  });

  const questCompletions = await prisma.questCompletion.findMany({
    where: { studentId: session.user.id },
    orderBy: { completedAt: "desc" },
    take: 20,
    include: { quest: true },
  });

  const feedItems = [
    ...pointEvents.map((e) => ({
      id: e.id, type: "points" as const, timestamp: e.createdAt,
      classroomName: e.classroom.name, actorName: e.actorUser.name,
      xpDelta: e.xpDelta, hpDelta: e.hpDelta, coinDelta: e.coinDelta, reason: e.reason,
    })),
    ...questCompletions.map((q) => ({
      id: q.id, type: "quest" as const, timestamp: q.completedAt,
      questTitle: q.quest.title, questXp: q.quest.xpReward, questCoins: q.quest.coinReward,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
              <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
              <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
            </Link>
            <span className="text-[#CA8A04]/30">/</span>
            <span className="text-sm font-bold text-[#CA8A04]">冒險日誌</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>冒險日誌</h1>
          <p className="text-sm text-white/40 mt-1">回顧你的輝煌戰績與成就</p>
        </div>

        {feedItems.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 bg-[#CA8A04]/5 p-12 text-center">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="mx-auto opacity-20 mb-3" />
            <p className="text-white/40">尚無任何紀錄，開始冒險吧！</p>
          </div>
        ) : (
          <div className="space-y-3">
            {feedItems.map((item) => (
              <div key={item.id} className="relative rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 hover:border-[#CA8A04]/20 transition-all">
                {item.type === "points" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-white/40">{(item as any).classroomName}</p>
                      <p className="text-xs text-white/25">{new Date(item.timestamp).toLocaleString("zh-TW")}</p>
                    </div>
                    <p className="text-sm text-white/80">{(item as any).reason ?? (item as any).classroomName}</p>
                    <div className="flex gap-3 mt-2 text-xs font-bold">
                      {(item as any).xpDelta !== 0 && (
                        <span className={(item as any).xpDelta > 0 ? "text-amber-400" : "text-red-400"}>
                          {(item as any).xpDelta > 0 ? "+" : ""}{(item as any).xpDelta} XP
                        </span>
                      )}
                      {(item as any).hpDelta !== 0 && (
                        <span className={(item as any).hpDelta > 0 ? "text-green-400" : "text-red-400"}>
                          {(item as any).hpDelta > 0 ? "+" : ""}{(item as any).hpDelta} HP
                        </span>
                      )}
                      {(item as any).coinDelta !== 0 && (
                        <span className={(item as any).coinDelta > 0 ? "text-[#CA8A04]" : "text-red-400"}>
                          {(item as any).coinDelta > 0 ? "+" : ""}{(item as any).coinDelta} 金幣
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {item.type === "quest" && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-bold text-purple-400">✦ 任務完成</p>
                      <p className="text-xs text-white/25">{new Date(item.timestamp).toLocaleString("zh-TW")}</p>
                    </div>
                    <p className="text-sm text-white/80">{(item as any).questTitle}</p>
                    <div className="flex gap-3 mt-2 text-xs font-bold">
                      {(item as any).questXp > 0 && <span className="text-amber-400">+{(item as any).questXp} XP</span>}
                      {(item as any).questCoins > 0 && <span className="text-[#CA8A04]">+{(item as any).questCoins} 金幣</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
