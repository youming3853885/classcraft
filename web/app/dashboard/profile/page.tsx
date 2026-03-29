import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CLASSES = [
  { id: "WARRIOR", name: "戰士", icon: "⚔", color: "text-red-400", border: "border-red-500/50", bg: "bg-red-900/20" },
  { id: "MAGE",    name: "法師", icon: "⬡", color: "text-purple-400", border: "border-purple-500/50", bg: "bg-purple-900/20" },
  { id: "HEALER",  name: "治癒", icon: "◈", color: "text-green-400", border: "border-green-500/50", bg: "bg-green-900/20" },
];

function RPGHeader({ breadcrumb }: { breadcrumb: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
            <Image src="/logo.png" alt="Classcraft" width={26} height={26} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
            <span className="text-sm font-black text-[#CA8A04] hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
          </Link>
          <span className="text-[#CA8A04]/30">/</span>
          <span className="text-sm font-bold text-[#CA8A04]">{breadcrumb}</span>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}

export default async function ProfilePage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "STUDENT" },
    include: { classroom: { include: { _count: { select: { members: true, courses: true } } } } },
  });

  const pets = await prisma.pet.findMany({ where: { ownerId: session.user.id } });
  const userEquipment = await prisma.userEquipment.findMany({
    where: { userId: session.user.id, equippedAt: { not: null } },
    include: { equipment: true },
  });
  const userBadges = await prisma.userBadge.findMany({
    where: { userId: session.user.id },
    include: { badge: true },
  });
  const userConsumables = await prisma.userConsumable.findMany({
    where: { userId: session.user.id, quantity: { gt: 0 } },
    include: { consumable: true },
  });

  const currentClass = (memberships[0] as any)?.characterClass ?? null;

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />
      <RPGHeader breadcrumb="我的檔案" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Hero card */}
        <div className="relative rounded-2xl border border-[#CA8A04]/30 bg-gradient-to-r from-[#1C1108] to-[#1C1917] p-6 overflow-hidden">
          <div className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-[#CA8A04]/50 rounded-tl-md" />
          <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-[#CA8A04]/50 rounded-tr-md" />
          <div className="absolute inset-0 bg-[#CA8A04]/5 rounded-2xl" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              {dbUser.image ? (
                <img src={dbUser.image} alt={dbUser.name ?? ""} className="w-20 h-20 rounded-xl ring-2 ring-[#CA8A04]/40" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-[#CA8A04]/10 border-2 border-[#CA8A04]/40 flex items-center justify-center text-3xl font-black text-[#CA8A04]">
                  {(dbUser.name ?? "?")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-black text-white" style={{ fontFamily: "'Baloo 2', cursive" }}>{dbUser.name}</h1>
                <p className="text-sm text-white/40">{dbUser.email}</p>
              </div>
              {/* Class selector */}
              <div>
                <p className="text-xs text-[#CA8A04]/60 tracking-widest uppercase mb-2">職業</p>
                <div className="flex gap-2 flex-wrap">
                  {CLASSES.map(cls => (
                    <div key={cls.id} className={`rounded-lg border px-3 py-1.5 flex items-center gap-1.5 text-sm font-bold transition-all ${
                      currentClass === cls.id ? `${cls.border} ${cls.bg} ${cls.color}` : "border-white/10 text-white/30"
                    }`}>
                      <span>{cls.icon}</span> {cls.name}
                      {currentClass === cls.id && <span className="text-xs ml-1">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: memberships.length, label: "班級數", color: "text-[#CA8A04]", border: "border-[#CA8A04]/30" },
            { value: pets.length, label: "寵物數", color: "text-purple-400", border: "border-purple-500/30" },
            { value: userBadges.length, label: "徽章數", color: "text-amber-400", border: "border-amber-500/30" },
            { value: userConsumables.reduce((s, c) => s + c.quantity, 0), label: "道具數", color: "text-green-400", border: "border-green-500/30" },
          ].map((s, i) => (
            <div key={i} className={`rounded-xl border ${s.border} bg-[#1C1917]/80 p-4 text-center`}>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Badges */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">徽章收藏</h2>
          {userBadges.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-white/10 p-8 text-center text-white/30 text-sm">尚未獲得任何徽章</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {userBadges.map((ub) => (
                <div key={ub.id} className="rounded-lg border border-[#CA8A04]/40 bg-[#CA8A04]/10 px-3 py-1.5 flex items-center gap-1.5 text-sm font-bold text-[#CA8A04]">
                  <span>◆</span> {ub.badge.name}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Consumables */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">道具背包</h2>
          {userConsumables.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-white/10 p-8 text-center text-white/30 text-sm">背包是空的</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {userConsumables.map((uc) => (
                <div key={uc.id} className="rounded-xl border border-white/10 bg-[#1C1917]/80 px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-white">{uc.consumable.name}</p>
                    <p className="text-xs text-white/30">{uc.consumable.description}</p>
                  </div>
                  <span className="rounded-lg border border-[#CA8A04]/40 bg-[#CA8A04]/10 px-2.5 py-1 text-sm font-black text-[#CA8A04]">x{uc.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pets */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-[#CA8A04]/60 tracking-widest uppercase">我的寵物</h2>
          {pets.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-white/10 p-8 text-center text-white/30 text-sm">還沒有寵物，完成成就來獲得！</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pets.map((pet) => (
                <div key={pet.id} className="rounded-xl border border-white/10 bg-[#1C1917]/80 px-4 py-3 flex items-center gap-3">
                  <span className="text-3xl">{pet.type === "CAT" ? "🐱" : pet.type === "DOG" ? "🐕" : pet.type === "DRAGON" ? "🐉" : "🐾"}</span>
                  <div>
                    <p className="font-bold text-sm text-white">{pet.name}</p>
                    <p className="text-xs text-white/30">{pet.type}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
