import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SKILL_GROUPS = [
  { label: "戰士技能", icon: "⚔", color: "text-red-400", filters: ["shield", "war", "iron"] },
  { label: "法師技能", icon: "⬡", color: "text-purple-400", filters: ["magic", "xp_", "mana"] },
  { label: "治癒技能", icon: "◈", color: "text-green-400", filters: ["heal", "group", "blessing"] },
];

export default async function SkillsPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");

  const userSkills = await prisma.userSkill.findMany({ where: { userId: session.user.id }, include: { skill: true } });
  const allSkills = await prisma.skill.findMany({ orderBy: { levelReq: "asc" } });
  const levelProgress = await prisma.levelProgress.findFirst({ where: { userId: session.user.id } });
  const userLevel = levelProgress?.level ?? 1;
  const unlockedSkillIds = new Set(userSkills.map((us) => us.skillId));

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
            <span className="text-sm font-bold text-[#CA8A04]">技能樹</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-lg border border-purple-500/50 bg-purple-900/30 px-3 py-1 text-xs font-black text-purple-300">
              等級 {userLevel}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-10 space-y-10">
        <div>
          <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>技能樹</h1>
          <p className="text-sm text-white/40 mt-1">升級後學習新技能，解鎖更強大的冒險能力！</p>
        </div>

        {SKILL_GROUPS.map((group) => {
          const groupSkills = allSkills.filter(s => group.filters.some(f => s.id.startsWith(f)));
          if (groupSkills.length === 0) return null;
          return (
            <section key={group.label} className="space-y-4">
              <h2 className={`text-base font-black flex items-center gap-2 ${group.color}`} style={{ fontFamily: "'Baloo 2', cursive" }}>
                <span>{group.icon}</span> {group.label}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupSkills.map((skill) => {
                  const unlocked = unlockedSkillIds.has(skill.id);
                  const canUnlock = userLevel >= skill.levelReq && !unlocked;
                  return (
                    <div key={skill.id} className={`relative rounded-xl border p-5 transition-all ${
                      unlocked ? "border-purple-500/50 bg-purple-900/10 shadow-[0_0_12px_rgba(124,58,237,0.15)]"
                        : canUnlock ? "border-[#CA8A04]/30 bg-[#CA8A04]/5 hover:border-[#CA8A04]/60"
                        : "border-white/5 bg-[#1C1917]/40 opacity-50"
                    }`}>
                      {unlocked && (
                        <span className="absolute top-3 right-3 text-green-400 font-black text-sm">✓</span>
                      )}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{skill.icon}</span>
                        <div>
                          <h3 className="font-bold text-sm text-white">{skill.name}</h3>
                          <p className="text-xs text-white/30">{skill.skillType}</p>
                        </div>
                      </div>
                      <p className="text-sm text-white/50">{skill.description}</p>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className={userLevel >= skill.levelReq ? "text-green-400 font-bold" : "text-red-400"}>
                          需要 Lv.{skill.levelReq}
                        </span>
                        {skill.cooldown > 0 && <span className="text-white/30">冷卻 {skill.cooldown}s</span>}
                      </div>
                      {canUnlock && (
                        <button className="mt-3 w-full rounded-xl bg-gradient-to-r from-[#CA8A04] to-[#D97706] py-2 text-xs font-black text-[#0C0A09] tracking-wider uppercase hover:shadow-lg hover:shadow-[#CA8A04]/30 transition-all cursor-pointer">
                          學習技能
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}

        {allSkills.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-[#CA8A04]/20 p-12 text-center">
            <Image src="/logo.png" alt="logo" width={40} height={40} className="mx-auto opacity-20 mb-3" />
            <p className="text-white/30">尚無可用技能</p>
          </div>
        )}
      </div>
    </div>
  );
}
