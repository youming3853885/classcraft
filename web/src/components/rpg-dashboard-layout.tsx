import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Shared RPG top navbar + scanline background wrapper for all dashboard sub-pages */
export default async function RPGDashboardLayout({
  children,
  title,
  breadcrumb,
}: {
  children?: React.ReactNode;
  title?: string;
  breadcrumb?: string;
}) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id } });

  return (
    <div className="min-h-screen bg-[#0C0A09] text-white" style={{ fontFamily: "'Exo 2', sans-serif" }}>
      {/* Scanline */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }}
      />
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-[#CA8A04]/20 bg-[#0C0A09]/90 backdrop-blur-xl px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
              <Image src="/logo.png" alt="Classcraft" width={28} height={28} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
              <span className="text-base font-black text-[#CA8A04] tracking-wide hidden sm:inline" style={{ fontFamily: "'Baloo 2', cursive" }}>Classcraft</span>
            </Link>
            {breadcrumb && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#CA8A04]/40">/</span>
                <Link href="/dashboard" className="text-white/40 hover:text-white/70 transition-colors cursor-pointer">主頁</Link>
                <span className="text-[#CA8A04]/40">/</span>
                <span className="text-[#CA8A04] font-bold">{breadcrumb}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {dbUser?.name && (
              <div className="hidden sm:flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                {dbUser.image ? (
                  <img src={dbUser.image} alt="" className="w-4 h-4 rounded-full" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-[#CA8A04]/20 border border-[#CA8A04]/40 flex items-center justify-center text-[9px] font-black text-[#CA8A04]">
                    {dbUser.name[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-white/60">{dbUser.name}</span>
              </div>
            )}
            <SignOutButton />
          </div>
        </div>
      </header>
      {/* Page content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
