import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ShopPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id },
    include: { classroom: { include: { organization: true } } },
  });

  const rewards: { reward: any; classroomId: string; classroomName: string }[] = [];
  const wallets: { [classroomId: string]: number } = {};

  for (const m of memberships) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId_classroomId_currency: { userId: session.user.id, classroomId: m.classroom.id, currency: "COINS" } },
    });
    wallets[m.classroom.id] = wallet?.balance ?? 0;
    const items = await prisma.rewardItem.findMany({
      where: { organizationId: m.classroom.organizationId, isActive: true },
      orderBy: { coinCost: "asc" },
    });
    for (const reward of items) rewards.push({ reward, classroomId: m.classroom.id, classroomName: m.classroom.name });
  }

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
            <span className="text-sm font-bold text-[#CA8A04]">獎勵商店</span>
          </div>
          <SignOutButton />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>獎勵商店</h1>
          <p className="text-sm text-white/40 mt-1">用金幣兌換你應得的傳說獎勵</p>
        </div>

        {rewards.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 bg-[#CA8A04]/5 p-12 text-center">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="mx-auto opacity-20 mb-3" />
            <p className="text-white/40">目前沒有可兌換的獎勵物品</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map(({ reward, classroomId, classroomName }) => {
              const canAfford = wallets[classroomId] >= reward.coinCost;
              return (
                <div key={reward.id} className="relative rounded-2xl border border-white/10 bg-[#1C1917]/80 p-5 hover:border-[#CA8A04]/30 transition-all group">
                  <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-[#CA8A04]/20 group-hover:border-[#CA8A04]/50 rounded-tl-sm transition-colors" />
                  <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t border-r border-[#CA8A04]/20 group-hover:border-[#CA8A04]/50 rounded-tr-sm transition-colors" />

                  <p className="text-xs text-white/30 mb-1">{classroomName}</p>
                  <h3 className="font-bold text-white">{reward.name}</h3>
                  {reward.description && (
                    <p className="text-sm text-white/40 mt-1">{reward.description}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-black text-[#CA8A04]">{reward.coinCost} 金幣</span>
                    {reward.stock !== null && (
                      <span className="text-xs text-white/30">庫存：{reward.stock}</span>
                    )}
                  </div>

                  <div className="mt-3 text-right text-xs text-white/30 mb-1">
                    我的金幣：<span className={canAfford ? "text-[#CA8A04]" : "text-red-400"}>{wallets[classroomId]}</span>
                  </div>

                  <button
                    className={`w-full rounded-xl py-2.5 text-sm font-black tracking-wider uppercase transition-all cursor-pointer disabled:cursor-not-allowed ${
                      canAfford
                        ? "bg-gradient-to-r from-[#CA8A04] to-[#D97706] text-[#0C0A09] hover:shadow-lg hover:shadow-[#CA8A04]/30"
                        : "border border-white/10 bg-white/5 text-white/30"
                    }`}
                    disabled={!canAfford}
                  >
                    {canAfford ? "✦ 兌換" : "金幣不足"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
