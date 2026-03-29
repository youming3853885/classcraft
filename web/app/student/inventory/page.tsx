import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CharacterAvatar } from "@/components/game/character-avatar";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentInventoryPage() {
  const session = await getServerAuthSession();
  if (!session?.user || session.user.role !== "STUDENT") redirect("/signin");
  const userId = session.user.id;
  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!dbUser?.name) redirect("/onboarding");

  const memberships = await prisma.classroomMember.findMany({ where: { userId, role: "STUDENT" }, orderBy: { joinedAt: "desc" } });
  let characterClass: "WARRIOR" | "MAGE" | "HEALER" = "WARRIOR";
  let equipment: any = {}; let currentHp = 100; let maxHp = 100;
  if (memberships[0]) {
    const member = await prisma.classroomMember.findFirst({ where: { userId, classroomId: memberships[0].classroomId } });
    if (member) {
      characterClass = (member.characterClass as typeof characterClass) || "WARRIOR";
      try { equipment = JSON.parse(member.equipment || "{}"); } catch {}
      currentHp = member.currentHp || 100; maxHp = member.maxHp || 100;
    }
  }

  const userEquipment = await prisma.userEquipment.findMany({ where: { userId }, include: { equipment: true } });
  const userConsumables = await prisma.userConsumable.findMany({ where: { userId }, include: { consumable: true } });
  const userBadges = await prisma.userBadge.findMany({ where: { userId }, include: { badge: true } });
  const wallets = await prisma.wallet.findMany({ where: { userId, currency: "COINS" } });
  const totalCoins = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);
  const xp = await prisma.pointsLedger.aggregate({ where: { targetUserId: userId }, _sum: { xpDelta: true } });
  const totalXp = xp._sum.xpDelta ?? 0;
  const level = Math.floor(totalXp / 1000) + 1;
  const maxSlots = 20; const usedSlots = userEquipment.length + userConsumables.length;

  const NAV = [
    { href: "/student/dashboard", label: "主頁" }, { href: "/student/quests", label: "任務" },
    { href: "/student/skills", label: "技能" }, { href: "/student/inventory", label: "背包" }, { href: "/student/team", label: "隊伍" },
  ];

  const RARITY_COLOR: Record<string, string> = {
    LEGENDARY: "text-orange-400 border-orange-500/40 bg-orange-900/10",
    EPIC: "text-purple-400 border-purple-500/40 bg-purple-900/10",
    RARE: "text-blue-400 border-blue-500/40 bg-blue-900/10",
    UNCOMMON: "text-green-400 border-green-500/40 bg-green-900/10",
    COMMON: "text-white/40 border-white/10 bg-white/5",
  };

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/student/dashboard" className="flex items-center gap-2 cursor-pointer">
              <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
              <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV.map(nl => (
                <Link key={nl.href} href={nl.href}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    nl.href === "/student/inventory" ? "bg-[#CA8A04]/15 text-[#CA8A04] border border-[#CA8A04]/40" : "text-white/40 hover:text-white/70"
                  }`}>{nl.label}</Link>
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
          {[{ href: "/student/profile", l: "查看角色", c: "text-[#CA8A04] border-[#CA8A04]/30 bg-[#CA8A04]/5" }, { href: "/student/shop", l: "🏪 商店", c: "text-white/50 border-white/10" }].map(sl => (
            <Link key={sl.href} href={sl.href} className={`block text-center rounded-xl border py-2 text-xs font-bold transition cursor-pointer ${sl.c}`}>{sl.l}</Link>
          ))}
        </aside>

        <div className="flex-1 px-6 py-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>🎒 背包</h1>
              <p className="text-sm text-white/40 mt-1">管理你的裝備與消耗品</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/30">容量</p>
              <p className={`text-xl font-black ${usedSlots >= maxSlots ? "text-red-400" : "text-amber-400"}`}>{usedSlots} / {maxSlots}</p>
            </div>
          </div>

          {/* Equipment */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">⚔ 裝備</h2>
            {userEquipment.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 p-8 text-center space-y-2">
                <p className="text-white/30 text-sm">尚未擁有裝備</p>
                <Link href="/student/shop" className="text-xs text-[#CA8A04] hover:underline cursor-pointer">前往商店購買 →</Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {userEquipment.map(ue => {
                  const isEquipped = !!ue.equippedAt; const eq = ue.equipment;
                  const typeIcon = eq.type === "WEAPON" ? "⚔" : eq.type === "ARMOR" ? "🛡" : "💍";
                  return (
                    <div key={eq.id} className={`relative rounded-xl border p-4 transition ${isEquipped ? "border-purple-500/50 bg-purple-900/15" : "border-white/10 bg-[#1C1917]/80"}`}>
                      <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-[#CA8A04]/15 rounded-tl-sm" />
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{typeIcon}</span>
                        <div className="flex items-center gap-1">
                          {isEquipped && <span className="text-xs font-bold border border-purple-500/40 bg-purple-900/20 px-1.5 py-0.5 rounded-md text-purple-400">裝備中</span>}
                          <span className={`text-xs font-bold border rounded-md px-1.5 py-0.5 ${RARITY_COLOR[eq.rarity] ?? RARITY_COLOR.COMMON}`}>{eq.rarity}</span>
                        </div>
                      </div>
                      <h3 className="font-bold text-sm text-white">{eq.name}</h3>
                      <p className="text-xs text-white/30 mt-0.5">{eq.description}</p>
                      {eq.statBonus > 0 && <p className="text-xs text-purple-400 font-bold mt-1.5">+{eq.statBonus} {eq.statType}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Consumables */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">🧪 消耗品</h2>
            {userConsumables.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 p-8 text-center space-y-2">
                <p className="text-white/30 text-sm">背包空空如也</p>
                <Link href="/student/shop" className="text-xs text-[#CA8A04] hover:underline cursor-pointer">前往商店購買 →</Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {userConsumables.map(({ consumable, quantity }) => (
                  <div key={consumable.id} className="relative rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 text-center">
                    <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t border-l border-[#CA8A04]/15 rounded-tl-sm" />
                    <span className="text-2xl block mb-2">🧪</span>
                    <h3 className="font-bold text-xs text-white">{consumable.name}</h3>
                    <p className="text-xs text-white/30 mt-0.5">{consumable.description}</p>
                    <p className="text-sm font-black text-amber-400 mt-2">x{quantity}</p>
                    <button className="mt-2 w-full rounded-lg border border-green-500/40 bg-green-900/20 py-1.5 text-xs font-bold text-green-400 hover:bg-green-900/40 transition cursor-pointer">
                      使用
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Badges */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">🏆 徽章收藏</h2>
            {userBadges.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-white/10 p-8 text-center">
                <p className="text-white/30 text-sm">完成任務來獲得徽章吧！</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {userBadges.map(({ badge }) => (
                  <div key={badge.id} className="relative rounded-xl border border-amber-500/20 bg-amber-900/5 p-4 text-center hover:border-amber-400/40 transition">
                    <span className="text-3xl block mb-2">🏆</span>
                    <h3 className="font-bold text-xs text-[#CA8A04]">{badge.name}</h3>
                    <p className="text-xs text-white/25 mt-0.5">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-3 gap-4 pt-2">
            {[{ href: "/student/dashboard", icon: "🏠", label: "勇者大廳" }, { href: "/student/shop", icon: "🏪", label: "商店" }, { href: "/student/skills", icon: "⚡", label: "技能樹" }].map(a => (
              <Link key={a.href} href={a.href} className="rounded-xl border border-white/10 bg-[#1C1917]/80 p-4 text-center hover:border-[#CA8A04]/30 transition cursor-pointer">
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
