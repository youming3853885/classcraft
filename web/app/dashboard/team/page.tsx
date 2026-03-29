import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function TeamStatusPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");

  const teamMembership = await prisma.teamMember.findFirst({
    where: { userId: session.user.id },
    include: {
      team: {
        include: {
          classroom: true,
          members: { include: { user: { select: { id: true, name: true, email: true, image: true } } } },
        },
      },
    },
  });

  function RPGPageShell({ children }: { children: React.ReactNode }) {
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
              <span className="text-sm font-bold text-[#CA8A04]">團隊狀態</span>
            </div>
            <SignOutButton />
          </div>
        </header>
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  if (!teamMembership) {
    return (
      // @ts-ignore — server component inline JSX
      <RPGPageShell>
        <div className="mx-auto max-w-5xl px-6 py-20 text-center space-y-4">
          <Image src="/logo.png" alt="logo" width={48} height={48} className="mx-auto opacity-20" />
          <p className="text-xl font-black text-white/40">你還沒加入任何團隊</p>
          <p className="text-sm text-white/25">請聯繫你的教師加入團隊</p>
        </div>
      </RPGPageShell>
    );
  }

  const { team } = teamMembership;
  const classroom = team.classroom;

  const memberStats = await Promise.all(
    team.members.map(async (m) => {
      const xpResult = await prisma.pointsLedger.aggregate({ where: { targetUserId: m.userId, classroomId: classroom.id }, _sum: { xpDelta: true } });
      const hpResult = await prisma.pointsLedger.aggregate({ where: { targetUserId: m.userId, classroomId: classroom.id }, _sum: { hpDelta: true } });
      const wallet = await prisma.wallet.findUnique({ where: { userId_classroomId_currency: { userId: m.userId, classroomId: classroom.id, currency: "COINS" } } });
      const totalXp = classroom.initialXp + (xpResult._sum.xpDelta ?? 0);
      const totalHp = Math.min(classroom.maxHp, classroom.initialHp + (hpResult._sum.hpDelta ?? 0));
      return { ...m.user, hp: totalHp, maxHp: classroom.maxHp, xp: totalXp, coins: wallet?.balance ?? 0, isMe: m.userId === session.user.id };
    })
  );

  const teamTotalXp = memberStats.reduce((sum, m) => sum + m.xp, 0);
  const teamTotalCoins = memberStats.reduce((sum, m) => sum + m.coins, 0);

  return (
    // @ts-ignore
    <RPGPageShell>
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>{team.name}</h1>
          <p className="text-sm text-white/40 mt-1">{classroom.name}</p>
        </div>

        {/* Team totals */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "團隊總 XP", value: teamTotalXp.toLocaleString(), color: "text-amber-400", border: "border-amber-500/30" },
            { label: "團隊金幣", value: teamTotalCoins.toLocaleString(), color: "text-[#CA8A04]", border: "border-[#CA8A04]/30" },
            { label: "人數", value: memberStats.length, color: "text-green-400", border: "border-green-500/30" },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl border ${s.border} bg-[#1C1917]/80 p-4 text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Members */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">隊員狀態</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {memberStats.map((member) => {
              const hpPercent = Math.min(100, (member.hp / member.maxHp) * 100);
              const isLowHp = hpPercent <= 20;
              return (
                <div key={member.id} className={`relative rounded-xl border p-5 transition-all ${
                  member.isMe ? "border-[#CA8A04]/40 bg-[#CA8A04]/5" : "border-white/10 bg-[#1C1917]/80"
                }`}>
                  <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-[#CA8A04]/20 rounded-tl-sm" />
                  {member.isMe && <span className="absolute top-3 right-3 text-xs font-black text-[#CA8A04]">你</span>}

                  <div className="flex items-center gap-3 mb-4">
                    {member.image ? (
                      <img src={member.image} alt={member.name ?? ""} className="w-10 h-10 rounded-xl ring-1 ring-[#CA8A04]/30" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-[#CA8A04]/10 border border-[#CA8A04]/30 flex items-center justify-center text-lg font-black text-[#CA8A04]">
                        {(member.name ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-white">{member.name ?? "未命名"}</p>
                      <p className="text-xs text-white/30">{member.email}</p>
                    </div>
                  </div>

                  {/* HP bar */}
                  <div className="space-y-1 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className={isLowHp ? "text-red-400 font-bold" : "text-white/40"}>HP</span>
                      <span className="text-white/40">{member.hp} / {member.maxHp}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${isLowHp ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]" : "bg-green-500"}`}
                        style={{ width: `${hpPercent}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-amber-400">{member.xp.toLocaleString()} XP</span>
                    <span className="text-[#CA8A04]">{member.coins} 金幣</span>
                  </div>

                  {isLowHp && !member.isMe && (
                    <button className="mt-3 w-full rounded-xl border border-green-500/40 bg-green-900/20 py-2 text-xs font-black text-green-400 hover:bg-green-900/40 transition-all cursor-pointer">
                      救援隊友 (+20 HP)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </RPGPageShell>
  );
}
