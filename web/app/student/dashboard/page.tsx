import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { CharacterAvatar } from "@/components/game/character-avatar";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CornerStuds = () => (
  <>
    <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-[#1A1815] border border-[#3A332C] rotate-45 z-10" />
    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#1A1815] border border-[#3A332C] rotate-45 z-10" />
    <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-[#1A1815] border border-[#3A332C] rotate-45 z-10" />
    <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-[#1A1815] border border-[#3A332C] rotate-45 z-10" />
  </>
);

export default async function StudentDashboardPage() {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "STUDENT") redirect("/teacher/dashboard");

  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!dbUser?.name) redirect("/onboarding");

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id, role: "STUDENT" },
    include: { classroom: { include: { _count: { select: { members: true, quests: true } } } } },
    orderBy: { joinedAt: "desc" },
  });

  const firstMembership = memberships[0];
  let characterClass: "WARRIOR" | "MAGE" | "HEALER" = ((dbUser as any).characterClass as any) || "WARRIOR";
  let equipment = {};
  let currentHp = 100, maxHp = 100, currentMp = 50, maxMp = 50;

  if (firstMembership) {
    const member = await prisma.classroomMember.findFirst({
      where: { userId: session.user.id, classroomId: firstMembership.classroomId }
    });
    if (member) {
      characterClass = (member.characterClass as typeof characterClass) || "WARRIOR";
      try { equipment = JSON.parse(member.equipment || "{}"); } catch {}
      currentHp = member.currentHp || 100; maxHp = member.maxHp || 100;
      currentMp = member.currentMp || 50; maxMp = member.maxMp || 50;
    }
  }

  const wallets = await prisma.wallet.findMany({ where: { userId: session.user.id, currency: "COINS" } });
  const totalCoins = wallets.reduce((s, w) => s + (w.balance ?? 0), 0);

  const xp = await prisma.pointsLedger.aggregate({ where: { targetUserId: session.user.id }, _sum: { xpDelta: true } });
  const totalXp = xp._sum.xpDelta ?? 0;
  const level = Math.floor(totalXp / 1000) + 1;
  const nextLevelXp = level * 1000;
  const xpInLevel = totalXp % 1000;
  const xpProgress = Math.min(100, Math.round((xpInLevel / 1000) * 100));

  const pendingQuests = await prisma.quest.count({
    where: {
      classroomId: firstMembership?.classroomId,
      isActive: true,
      NOT: { completions: { some: { studentId: session.user.id } } }
    },
  });

  const completedQuests = await prisma.questCompletion.count({ where: { studentId: session.user.id } });

  const CLASS_INFO = {
    WARRIOR: { label: "戰士",     color: "text-red-600", border: "border-red-900/40", orbFrom: "from-red-900", orbTo: "to-orange-500", glow: "rgba(220,38,38,0.15)" },
    MAGE:    { label: "法師",     color: "text-purple-500", border: "border-purple-900/40", orbFrom: "from-purple-900", orbTo: "to-blue-400", glow: "rgba(124,58,237,0.15)" },
    HEALER:  { label: "治癒者",   color: "text-green-600", border: "border-green-900/40", orbFrom: "from-green-900", orbTo: "to-emerald-400", glow: "rgba(22,163,74,0.15)" },
  };

  const cInfo = CLASS_INFO[characterClass];
  const hpPercent = Math.min(100, (currentHp / maxHp) * 100);
  const mpPercent = Math.min(100, (currentMp / maxMp) * 100);

  // HUD and Quick Actions (Icons changed to Diablo-esque aesthetics)
  const HUD_NAV = [
    { href: "/student/dashboard", icon: "⚰️", label: "營地", active: true },
    { href: "/student/quests",    icon: "📜", label: "懸賞" },
    { href: "/student/skills",    icon: "🔮", label: "天賦" },
    { href: "/student/inventory", icon: "🎒", label: "儲物箱" },
    { href: "/student/profile",   icon: "🎭", label: "裝備" },
    { href: "/student/team",      icon: "👥", label: "戰友" },
    { href: "/student/shop",      icon: "⚖️", label: "黑市" },
  ];

  const QUICK_ACTIONS = [
    { href: "/student/quests", icon: "⚔️", label: "承接懸賞", sub: `${pendingQuests} 張委託` },
    { href: "/student/skills", icon: "🕯️", label: "研習天賦", sub: "解鎖新能力" },
    { href: "/student/team",   icon: "🛡️", label: "隊伍陣列", sub: "共禦強敵" },
    { href: "/student/profile",icon: "🎭", label: "整備武裝", sub: "更換裝備" },
    { href: "/student/shop",   icon: "⚖️", label: "贗品商人", sub: `持有 ${totalCoins} G` },
    { href: "/student/quests", icon: "📜", label: "英雄榜",   sub: `完成 ${completedQuests} 委託` },
  ];

  return (
    <div className="min-h-screen bg-[#0A0907] text-[#D8CBB6] font-serif pb-24 selection:bg-red-900/50">
      
      {/* ── HIGH PERFORMANCE VIGNETTE BACKGROUND ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#0A0907]" />
        {/* Subtle radial gradient for focal light */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(168,139,83,0.03)_0%,transparent_70%)]" />
        {/* Stone-like overlay vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#000000_100%)] opacity-80" />
      </div>

      {/* ── Diablo TOP HEADER ── */}
      <header className="relative z-50 sticky top-0 border-b-2 border-t border-[#1A1815] bg-[#0A0907]/90 px-4 py-2 shadow-[0_4px_20px_rgba(0,0,0,0.8)] backdrop-blur-sm">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(168,139,83,0.03)_50%,transparent_100%)] pointer-events-none" />
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/student/dashboard" className="flex items-center gap-3 cursor-pointer">
            <div className="w-8 h-8 rounded border border-[#4A433C] bg-[#1A1815] flex items-center justify-center shadow-inner relative overflow-hidden">
               <Image src="/logo.png" alt="Logo" width={20} height={20} className="sepia hover:sepia-0 transition-all duration-300" />
            </div>
            <span className="text-xl font-bold text-[#A88B53] drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-widest" style={{ fontFamily: "'Cinzel', 'Times New Roman', serif" }}>
              Classcraft
            </span>
          </Link>
          <div className="flex items-center gap-3">
             {/* Gold counter */}
             <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0A0907] border border-[#3A332C] rounded-sm relative shadow-inner">
                <span className="text-yellow-600 text-sm font-bold opacity-80">G</span>
                <span className="text-[#A88B53] font-black text-sm">{totalCoins}</span>
             </div>
             {/* Profile trigger */}
             <div className="relative border border-[#3A332C] bg-[#1A1815] shadow-lg">
                {dbUser.image ? (
                  <img src={dbUser.image} alt="" className="w-8 h-8 object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
                ) : (
                  <div className="w-8 h-8 flex items-center justify-center text-[#A88B53] text-xs font-black">{dbUser.name[0]}</div>
                )}
                {/* corner accents */}
                <div className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-[#4A433C] border border-black" />
                <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-[#4A433C] border border-black" />
             </div>
             <SignOutButton />
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-8 space-y-12">

        {/* ══ HERO FRAME (Character, UI Orbs) ══ */}
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 md:gap-24 pt-4">
          
          {/* LEFT: HP ORB */}
          <div className="hidden md:flex flex-col items-center">
             <div className="relative w-32 h-32 rounded-full border-4 border-[#151310] bg-[#0A0907] shadow-[inset_0_0_20px_rgba(0,0,0,1),0_0_20px_rgba(220,38,38,0.2)] overflow-hidden">
               {/* Liquid filling */}
               <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-950 via-red-800 to-red-600 transition-all duration-1000 ease-out" 
                    style={{ height: `${hpPercent}%` }} />
               {/* Specular highlight for 3D glass effect */}
               <div className="absolute inset-x-4 top-1 h-10 rounded-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
               <div className="absolute inset-0 rounded-full shadow-[inset_0_-12px_24px_rgba(0,0,0,0.9)] pointer-events-none" />
             </div>
             <div className="mt-3 text-center border-t border-[#3A332C] pt-2 w-24">
                 <div className="text-red-800 text-[10px] font-black tracking-widest uppercase">生命值</div>
                 <div className="text-red-300/80 font-bold font-mono text-sm">{currentHp} / {maxHp}</div>
             </div>
          </div>

          {/* CENTER: CHARACTER SHRINE */}
          <div className="relative flex-1 max-w-[280px] w-full">
            {/* Ornate Iron Frame */}
            <div className={`relative p-1.5 bg-[#0F0D0A] border-2 border-[#2A241C] shadow-[0_10px_40px_rgba(0,0,0,0.8)]`}>
              {/* Corner Embellishments */}
              <CornerStuds />

              <div className="relative bg-[#050403] border border-[#1A1815] px-6 pb-2 pt-10 flex flex-col items-center overflow-hidden">
                 {/* Holy glow behind character */}
                 <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl opacity-60 mix-blend-screen pointer-events-none"
                   style={{ background: `radial-gradient(circle, ${cInfo.glow} 0%, transparent 70%)` }} />
                 
                 {/* Floor pedestal */}
                 <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#151310] to-transparent pointer-events-none" />

                 <CharacterAvatar characterClass={characterClass} equipment={equipment} size="2xl" showAnimation={true} level={level} />
              </div>
            </div>

            {/* Character Info Plaque underneath */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#151310] border-2 border-[#3A332C] px-8 py-2 shadow-xl whitespace-nowrap text-center z-10">
               <CornerStuds />
               <div className="text-[#A88B53] font-black tracking-[0.2em] uppercase text-[10px] mb-0.5">{cInfo.label}</div>
               <div className="text-stone-300 text-xl font-bold drop-shadow-[0_2px_5px_black]" style={{ fontFamily: "'Baloo 2', 'Times New Roman', serif" }}>{dbUser.name}</div>
            </div>
          </div>

          {/* RIGHT: MP ORB */}
          <div className="hidden md:flex flex-col items-center">
             <div className={`relative w-32 h-32 rounded-full border-4 border-[#151310] bg-[#0A0907] shadow-[inset_0_0_20px_rgba(0,0,0,1),0_0_20px_rgba(0,0,0,0.4)] overflow-hidden`}>
               {/* Liquid filling changing by class color */}
               <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${cInfo.orbFrom} ${cInfo.orbTo} transition-all duration-1000 ease-out opacity-90`} 
                    style={{ height: `${mpPercent}%` }} />
               {/* Specular highlight */}
               <div className="absolute inset-x-4 top-1 h-10 rounded-full bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
               <div className="absolute inset-0 rounded-full shadow-[inset_0_-12px_24px_rgba(0,0,0,0.9)] pointer-events-none" />
             </div>
             <div className="mt-3 text-center border-t border-[#3A332C] pt-2 w-24">
                 <div className={`${cInfo.color} text-[10px] opacity-70 font-black tracking-widest uppercase`}>能量值</div>
                 <div className="text-blue-200/60 font-bold font-mono text-sm">{currentMp} / {maxMp}</div>
             </div>
          </div>

        </div>

        {/* MOBILE ORBS AND XP BAR */}
        <div className="mt-14 max-w-2xl mx-auto space-y-5">
          <div className="flex md:hidden justify-between items-center px-6">
             <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-[#0A0907] border-2 border-[#2A241C] shadow-[inset_0_0_8px_rgba(0,0,0,1)] relative overflow-hidden">
                   <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-900 to-red-500" style={{ height: `${hpPercent}%` }} />
                   <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-red-100 text-shadow-sm">{currentHp}</div>
                </div>
                <div className="text-[10px] font-black text-stone-500 tracking-widest uppercase">HP</div>
             </div>
             <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-[#0A0907] border-2 border-[#2A241C] shadow-[inset_0_0_8px_rgba(0,0,0,1)] relative overflow-hidden">
                   <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${cInfo.orbFrom} ${cInfo.orbTo} opacity-90`} style={{ height: `${mpPercent}%` }} />
                   <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-blue-100 text-shadow-sm">{currentMp}</div>
                </div>
                <div className="text-[10px] font-black text-stone-500 tracking-widest uppercase">MP</div>
             </div>
          </div>

          {/* Experience Bar (Golden, Segmented look) */}
          <div className="flex items-center gap-3 bg-[#050403] border-y-2 border-[#1A1815] py-2 px-3 relative shadow-[0_5px_15px_rgba(0,0,0,0.5)]">
            <div className="absolute left-0 w-1.5 h-8 bg-[#2A241C] border border-[#111] z-10" />
            <div className="absolute right-0 w-1.5 h-8 bg-[#2A241C] border border-[#111] z-10" />
            
            <div className="w-8 text-center text-xs font-black text-[#A88B53] tracking-wider z-10">L.{level}</div>
            
            <div className="flex-1 h-3.5 bg-[#0F0D0A] border-y border-[#1A1815] shadow-inner relative overflow-hidden">
                {/* Segments marker */}
                <div className="absolute inset-0 flex justify-between z-10 opacity-40 pointer-events-none">
                   {[...Array(9)].map((_, i) => <div key={i} className="w-px h-full bg-[#3A332C]" />)}
                </div>
                <div className="h-full bg-gradient-to-r from-amber-900 via-yellow-700 to-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.6)]" 
                     style={{ width: `${xpProgress}%`, transition: "width 1s ease" }} />
            </div>
            
            <div className="w-8 text-center text-xs font-black text-[#A88B53] tracking-wider z-10">L.{level+1}</div>
          </div>
          <p className="text-center font-mono text-[10px] text-[#A88B53]/50">{xpInLevel} / {nextLevelXp} XP</p>
        </div>


        {/* ══ TACTILE STONE ACTIONS ══ */}
        <section className="pt-6">
           {/* Classic RPG separator */}
           <div className="flex items-center justify-center mb-8 opacity-90">
             <div className="w-16 h-px bg-gradient-to-l from-[#A88B53]/50 to-transparent" />
             <div className="w-1.5 h-1.5 rotate-45 border border-[#A88B53]/50 mx-3 bg-[#1A1815]" />
             <span className="text-[#A88B53] text-xs tracking-[0.4em] font-black uppercase text-shadow-sm">營地機能</span>
             <div className="w-1.5 h-1.5 rotate-45 border border-[#A88B53]/50 mx-3 bg-[#1A1815]" />
             <div className="w-16 h-px bg-gradient-to-r from-[#A88B53]/50 to-transparent" />
           </div>

           <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {QUICK_ACTIONS.map(a => (
                <Link key={a.href} href={a.href}
                  className="group relative block bg-[#11100D] border-2 border-[#2A241C] p-5 text-center cursor-pointer 
                             shadow-[0_6px_0_#050505,0_10px_10px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-[0_2px_0_#050505,0_2px_5px_rgba(0,0,0,0.5)] 
                             hover:border-[#4A433C] hover:bg-[#151310] transition-all">
                  <CornerStuds />
                  
                  <span className="text-3xl block mb-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_2px_4px_black]">{a.icon}</span>
                  <p className="font-bold text-[#D8CBB6] text-sm tracking-widest">{a.label}</p>
                  <p className="text-[10px] text-[#A88B53]/60 font-mono mt-1.5 uppercase">{a.sub}</p>
                </Link>
              ))}
           </div>
        </section>


        {/* ══ MY WORLDS (Toomes/Portals) ══ */}
        <section className="pt-6 pb-12">
           <div className="flex items-center justify-center mb-8 opacity-90">
             <div className="w-16 h-px bg-gradient-to-l from-[#A88B53]/50 to-transparent" />
             <div className="w-1.5 h-1.5 rotate-45 border border-[#A88B53]/50 mx-3 bg-[#1A1815]" />
             <span className="text-[#A88B53] text-xs tracking-[0.4em] font-black uppercase text-shadow-sm">探索傳送門</span>
             <div className="w-1.5 h-1.5 rotate-45 border border-[#A88B53]/50 mx-3 bg-[#1A1815]" />
             <div className="w-16 h-px bg-gradient-to-r from-[#A88B53]/50 to-transparent" />
           </div>

           {memberships.length > 0 ? (
             <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {memberships.map(({ classroom }) => (
                  <div key={classroom.id}
                    className="group relative p-1.5 bg-[#1A1815] border border-[#3A332C] hover:border-[#A88B53] transition-colors shadow-2xl">
                    <CornerStuds />
                    <Link href={`/student/quests?classroom=${classroom.id}`} className="absolute inset-0 z-10" />
                    <div className="relative bg-[#0A0907] border border-[#000] p-6 h-full flex flex-col justify-between overflow-hidden">
                       {/* Portal swirling background effect */}
                       <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-[radial-gradient(circle,rgba(217,119,6,0.15)_0%,transparent_70%)] rounded-full blur-xl group-hover:scale-125 transition-transform duration-700 pointer-events-none" />
                       
                       <div>    
                          <div className="text-[10px] text-[#A88B53]/60 font-mono tracking-widest uppercase mb-1.5">Realm</div>
                          <h3 className="font-bold text-xl text-[#D8CBB6] group-hover:text-white transition-colors line-clamp-2 drop-shadow-md" style={{ fontFamily: "'Baloo 2', 'Times New Roman', serif" }}>
                            {classroom.name}
                          </h3>
                       </div>

                       <div className="mt-8 flex justify-between items-end border-t border-[#1A1815] pt-4 relative z-10">
                         <div className="flex gap-4 text-xs text-stone-500 font-mono">
                            <span title="Adventurers">👥 {classroom._count.members}</span>
                            <span title="Bounties">📜 {classroom._count.quests}</span>
                         </div>
                         <div className="text-[10px] font-black text-[#A88B53] border border-[#3A332C] bg-[#1A1815] px-3 py-1 group-hover:bg-[#A88B53] group-hover:text-[#0A0907] transition-colors shadow-md">
                           進入
                         </div>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="max-w-md mx-auto relative p-1.5 bg-[#1A1815] border border-[#3A332C] shadow-2xl text-center">
                <CornerStuds />
                <div className="bg-[#0A0907] border border-[#000] p-12">
                  <div className="text-5xl opacity-40 mb-6 drop-shadow-[0_2px_5px_black]">🗺</div>
                  <p className="font-bold text-lg text-[#A88B53]">無可探索之界域</p>
                  <p className="text-sm text-[#D8CBB6]/60 mt-3 font-mono">尋求導師的邀請秘文以開啟傳送門</p>
                </div>
             </div>
           )}
        </section>

      </div>

      {/* ── DIABLO BOTTOM HUD ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-4 px-4 hidden sm:block">
        <div className="max-w-4xl mx-auto bg-[#0A0907] border-[3px] border-[#3A332C] 
          shadow-[0_-10px_40px_rgba(0,0,0,0.9),inset_0_2px_10px_rgba(255,255,255,0.05)] pointer-events-auto flex items-center justify-between p-1.5 relative rounded-xl overflow-hidden">
          
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(168,139,83,0.05)_50%,transparent_100%)] pointer-events-none" />
          
          <CornerStuds />

          {HUD_NAV.map((item, i) => (
             <Link key={item.href} href={item.href}
                className={`relative flex-1 py-2.5 flex flex-col items-center justify-center gap-1.5 group
                  border-r border-[#1A1815] last:border-r-0 z-10
                  ${item.active ? 'bg-[#151310] shadow-inner' : 'hover:bg-[#11100D] transition-colors'}`}>
                
                {item.active && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-0.5 bg-gradient-to-r from-transparent via-[#A88B53] to-transparent" />}
                
                <span className={`text-2xl drop-shadow-lg transition-transform group-hover:scale-110 ${item.active ? '' : 'opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100'}`}>
                  {item.icon}
                </span>
                <span className={`text-[10px] font-black tracking-widest uppercase ${item.active ? 'text-[#D8CBB6]' : 'text-stone-600 group-hover:text-[#A88B53]'}`}>
                  {item.label}
                </span>
             </Link>
          ))}
        </div>
      </nav>

      {/* Mobile HUD (Simplified, no ornate borders on edges to save space) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-[#0A0907] border-t-2 border-[#3A332C] shadow-[0_-5px_20px_rgba(0,0,0,1)]">
        <div className="flex items-center">
          {HUD_NAV.map((item, i) => (
             <Link key={item.href} href={item.href}
                className={`relative flex-1 py-3 flex flex-col items-center justify-center gap-1
                  border-r border-[#151310] last:border-r-0
                  ${item.active ? 'bg-[#151310]' : 'active:bg-[#1A1815]'}`}>
                {item.active && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-[#A88B53]" />}
                <span className={`text-xl ${item.active ? '' : 'opacity-50 grayscale'}`}>{item.icon}</span>
                <span className={`text-[9px] font-bold tracking-widest ${item.active ? 'text-[#D8CBB6]' : 'text-stone-600'}`}>
                  {item.label}
                </span>
             </Link>
          ))}
        </div>
      </nav>

    </div>
  );
}