import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CharacterAvatar } from "@/components/game/character-avatar";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function StudentNavHeader({ active, dbUser, totalCoins, level }: { active: string; dbUser: any; totalCoins: number; level: number }) {
  const NAV = [
    { href: "/student/dashboard", label: "主頁" },
    { href: "/student/quests", label: "任務" },
    { href: "/student/skills", label: "技能" },
    { href: "/student/inventory", label: "背包" },
    { href: "/student/team", label: "隊伍" },
  ];
  return (
    <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/student/dashboard" className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
            <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(nl => (
              <Link key={nl.href} href={nl.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  nl.href === active ? "bg-[#CA8A04]/15 text-[#CA8A04] border border-[#CA8A04]/40" : "text-white/40 hover:text-white/70"
                }`}>
                {nl.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#CA8A04]/40 bg-[#CA8A04]/10 px-3 py-1.5">
            <span className="text-xs font-black text-[#CA8A04]">金 {totalCoins}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-900/20 px-3 py-1.5">
            <span className="text-xs font-black text-purple-400">Lv.{level}</span>
          </div>
          {dbUser.image ? <img src={dbUser.image} alt="" className="w-7 h-7 rounded-xl ring-2 ring-[#CA8A04]/30" /> :
            <div className="w-7 h-7 rounded-xl bg-[#CA8A04]/10 border border-[#CA8A04]/30 flex items-center justify-center text-xs font-black text-[#CA8A04]">{dbUser.name[0].toUpperCase()}</div>}
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}

export default async function StudentQuestsPage({ searchParams }: { searchParams: Promise<{ classroom?: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "STUDENT") redirect("/teacher/dashboard");
  const { classroom: classroomId } = await searchParams;
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "STUDENT" },
    include: { classroom: { include: { _count: { select: { members: true, quests: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  const selectedClassroom = classroomId ? memberships.find(m => m.classroomId === classroomId)?.classroom : memberships[0]?.classroom;

  let characterClass: "WARRIOR" | "MAGE" | "HEALER" = "WARRIOR";
  let equipment: any = {}; let currentHp = 100; let maxHp = 100;
  if (memberships[0]) {
    const member = await prisma.classroomMember.findFirst({ where: { userId: session.user.id, classroomId: memberships[0].classroomId } });
    if (member) {
      characterClass = (member.characterClass as typeof characterClass) || "WARRIOR";
      try { equipment = JSON.parse(member.equipment || "{}"); } catch {}
      currentHp = member.currentHp || 100; maxHp = member.maxHp || 100;
    }
  }

  let quests: any[] = [];
  if (selectedClassroom) {
    quests = await prisma.quest.findMany({
      where: { classroomId: selectedClassroom.id, isActive: true },
      orderBy: { orderIndex: "asc" },
      include: { completions: { where: { studentId: session.user.id } } },
    });
  }

  const wallets = await prisma.wallet.findMany({ where: { userId: session.user.id, currency: "COINS" } });
  const totalCoins = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);
  const xp = await prisma.pointsLedger.aggregate({ where: { targetUserId: session.user.id }, _sum: { xpDelta: true } });
  const totalXp = xp._sum.xpDelta ?? 0;
  const level = Math.floor(totalXp / 1000) + 1;

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />
      <StudentNavHeader active="/student/quests" dbUser={dbUser} totalCoins={totalCoins} level={level} />

      <div className="relative z-10 flex max-w-7xl mx-auto">
        <aside className="hidden md:block w-56 flex-shrink-0 border-r border-[#CA8A04]/10 p-5 min-h-screen space-y-4">
          <div className="text-center">
            <div className="inline-block p-2 border-2 border-[#CA8A04]/40 rounded-2xl bg-[#CA8A04]/5">
              <CharacterAvatar characterClass={characterClass} equipment={equipment} size="lg" showAnimation={true} />
            </div>
            <h2 className="text-xs font-black text-[#CA8A04] mt-2">{dbUser.name}</h2>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1"><span className="text-red-400 font-black">HP</span><span className="text-white/30">{currentHp}/{maxHp}</span></div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-red-500" style={{ width: `${(currentHp / maxHp) * 100}%` }} /></div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1"><span className="text-amber-400 font-black">XP</span><span className="text-white/30">{totalXp % 1000}/1000</span></div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-amber-500" style={{ width: `${(totalXp % 1000) / 10}%` }} /></div>
          </div>
          {[{ href: "/student/profile", l: "查看角色", c: "text-[#CA8A04] border-[#CA8A04]/30 bg-[#CA8A04]/5" }, { href: "/student/shop", l: "🏪 商店", c: "text-white/50 border-white/10" }].map(sl => (
            <Link key={sl.href} href={sl.href} className={`block text-center rounded-xl border py-2 text-xs font-bold transition cursor-pointer ${sl.c}`}>{sl.l}</Link>
          ))}
        </aside>

        <div className="flex-1 px-6 py-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>🗺 冒險地圖</h1>
              <p className="text-sm text-white/40 mt-1">{selectedClassroom ? `探索 ${selectedClassroom.name} 的任務` : "選擇一個世界開始冒險"}</p>
            </div>
            <select className="rounded-xl border border-white/10 bg-[#1C1917]/80 px-4 py-2 text-xs text-white/60 outline-none cursor-pointer"
              defaultValue={classroomId || ""}
              onChange={e => { window.location.href = e.target.value ? `/student/quests?classroom=${e.target.value}` : "/student/quests"; }}>
              <option value="">選擇世界</option>
              {memberships.map(({ classroom }) => <option key={classroom.id} value={classroom.id}>{classroom.name}</option>)}
            </select>
          </div>

          {!selectedClassroom ? (
            <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 bg-[#CA8A04]/5 p-12 text-center">
              <Image src="/logo.png" alt="logo" width={40} height={40} className="mx-auto opacity-20 mb-3" />
              <p className="text-white/40">請選擇一個世界開始探索</p>
            </div>
          ) : quests.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 p-12 text-center">
              <p className="text-white/30">這個世界還沒有任務</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {quests.map((quest, index) => {
                const isCompleted = quest.completions.length > 0;
                return (
                  <Link key={quest.id} href={`/student/quests/${quest.id}?classroom=${selectedClassroom.id}`}
                    className={`group relative rounded-2xl border p-5 transition cursor-pointer ${
                      isCompleted ? "border-green-500/30 bg-green-900/10 hover:border-green-400/50" :
                      quest.isRequired ? "border-amber-500/30 bg-amber-900/5 hover:border-amber-400/50" :
                      "border-white/10 bg-[#1C1917]/80 hover:border-[#CA8A04]/30"
                    }`}>
                    <div className={`absolute -top-2.5 -left-2.5 w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                      isCompleted ? "bg-green-500 text-white" : "bg-[#CA8A04] text-[#0C0A09]"
                    }`}>{isCompleted ? "✓" : index + 1}</div>
                    {!isCompleted && quest.isRequired && (
                      <span className="absolute -top-2.5 -right-2.5 text-xs rounded-lg border border-amber-500/50 bg-amber-900/30 text-amber-400 px-2 py-0.5 font-bold">必做</span>
                    )}
                    <h3 className={`font-black text-sm mt-2 group-hover:text-white transition ${isCompleted ? "text-green-300" : "text-[#CA8A04]"}`}>{quest.title}</h3>
                    <p className="text-xs text-white/30 mt-1 line-clamp-2">{quest.description || "完成任務獲得獎勵"}</p>
                    <div className="flex flex-wrap gap-2 mt-3 text-xs font-black">
                      {quest.xpReward > 0 && <span className="text-amber-400">+{quest.xpReward} XP</span>}
                      {quest.coinReward > 0 && <span className="text-[#CA8A04]">+{quest.coinReward} 金</span>}
                      {quest.hpReward > 0 && <span className="text-green-400">+{quest.hpReward} HP</span>}
                      {quest.hpReward < 0 && <span className="text-red-400">{quest.hpReward} HP</span>}
                    </div>
                    {quest.expiresAt && <p className="text-xs text-white/25 mt-1.5">截止：{new Date(quest.expiresAt).toLocaleDateString("zh-TW")}</p>}
                  </Link>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { href: "/student/dashboard", icon: "🏠", label: "勇者大廳" },
              { href: "/student/skills", icon: "⚡", label: "技能樹" },
              { href: "/student/inventory", icon: "🎒", label: "背包" },
            ].map(a => (
              <Link key={a.href} href={a.href}
                className="rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 text-center hover:border-[#CA8A04]/30 transition cursor-pointer">
                <span className="text-2xl block mb-1">{a.icon}</span>
                <span className="text-xs font-black text-[#CA8A04]">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
