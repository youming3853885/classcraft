"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

/** Shared Classcraft RPG Navbar — use on ALL auth pages */
export function RPGNav({ showLogin = true }: { showLogin?: boolean }) {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
      <div className="flex items-center justify-between rounded-2xl border border-[#CA8A04]/30 bg-[#1C1917]/80 px-5 py-3 backdrop-blur-xl shadow-2xl shadow-[#CA8A04]/10">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <Image src="/logo.png" alt="Classcraft Logo" width={36} height={36} className="drop-shadow-[0_0_8px_rgba(202,138,4,0.8)]" />
          <span className="text-xl font-black tracking-wide text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>
            Classcraft
          </span>
        </Link>
        {showLogin && (
          <Link
            href="/signin"
            className="rounded-xl border border-[#CA8A04]/40 bg-[#CA8A04]/10 px-5 py-2 text-sm font-bold text-[#CA8A04] transition-all hover:bg-[#CA8A04]/20 hover:shadow-lg hover:shadow-[#CA8A04]/20 cursor-pointer"
          >
            登入
          </Link>
        )}
      </div>
    </nav>
  );
}

/** Reusable scan-line RPG card */
export function RPGCard({
  children,
  className = "",
  accentColor = "#CA8A04",
}: {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}) {
  return (
    <div
      className={`relative rounded-2xl border-2 bg-[#1C1917]/95 p-8 shadow-2xl backdrop-blur-md ${className}`}
      style={{ borderColor: `${accentColor}50` }}
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.03]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)",
        }}
      />
      {/* Corner rune accents */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: `${accentColor}80` }} />
      <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: `${accentColor}80` }} />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: `${accentColor}80` }} />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: `${accentColor}80` }} />
      {children}
    </div>
  );
}

/** Fantasy-styled input */
export function RPGInput({
  label,
  required,
  accentColor = "#CA8A04",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
  accentColor?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5 tracking-wider uppercase" style={{ color: `${accentColor}cc` }}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        {...props}
        className={`w-full rounded-xl border-2 bg-[#0C0A09] px-4 py-3 text-sm text-[#F5F0E8] outline-none transition-all duration-200 placeholder:text-white/25`}
        style={{ borderColor: `${accentColor}30` }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = `${accentColor}80`;
          e.currentTarget.style.boxShadow = `0 0 16px ${accentColor}20`;
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = `${accentColor}30`;
          e.currentTarget.style.boxShadow = "none";
          props.onBlur?.(e);
        }}
      />
    </div>
  );
}

/** Primary RPG button */
export function RPGButton({
  children,
  variant = "gold",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "gold" | "purple" | "green" | "ghost";
}) {
  const variants = {
    gold: "bg-gradient-to-r from-[#CA8A04] to-[#D97706] text-[#0C0A09] shadow-[0_0_20px_rgba(202,138,4,0.4)] hover:shadow-[0_0_30px_rgba(202,138,4,0.6)]",
    purple: "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] text-white shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:shadow-[0_0_30px_rgba(124,58,237,0.6)]",
    green: "bg-gradient-to-r from-[#16A34A] to-[#15803D] text-white shadow-[0_0_20px_rgba(22,163,74,0.4)] hover:shadow-[0_0_30px_rgba(22,163,74,0.6)]",
    ghost: "border-2 border-[#CA8A04]/40 text-[#CA8A04] hover:bg-[#CA8A04]/10",
  };
  return (
    <button
      {...props}
      className={`w-full rounded-xl py-3 text-sm font-black tracking-wider uppercase transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

/** Google OAuth button */
export function GoogleButton({ onClick, disabled, children }: { onClick?: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full inline-flex items-center justify-center gap-3 rounded-xl border-2 border-white/10 bg-white/5 py-3 text-sm font-bold text-white/80 transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer disabled:opacity-50"
    >
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {children}
    </button>
  );
}

/** Background layer with generated image + overlay */
export function RPGBackground({ src, opacity = 30 }: { src: string; opacity?: number }) {
  return (
    <div className="absolute inset-0 z-0">
      <Image src={src} alt="background" fill className="object-cover" style={{ opacity: opacity / 100 }} priority />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0C0A09]/90 via-[#1C1917]/70 to-[#0C0A09]/90" />
      {/* Retro scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,1) 2px, rgba(255,255,255,1) 3px)",
        }}
      />
    </div>
  );
}

/** Error / Success toasts */
export function RPGAlert({ type, message }: { type: "error" | "success" | "warning"; message: string }) {
  if (!message) return null;
  const config = {
    error: { border: "border-red-500/50", bg: "bg-red-900/20", text: "text-red-300", icon: "⚠" },
    success: { border: "border-green-500/50", bg: "bg-green-900/20", text: "text-green-300", icon: "✓" },
    warning: { border: "border-yellow-500/50", bg: "bg-yellow-900/20", text: "text-yellow-300", icon: "◆" },
  };
  const c = config[type];
  return (
    <div className={`flex items-start gap-2 rounded-xl border ${c.border} ${c.bg} px-4 py-3 text-sm ${c.text}`}>
      <span className="font-bold mt-0.5">{c.icon}</span>
      <span>{message}</span>
    </div>
  );
}
