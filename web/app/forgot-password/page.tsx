"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { RPGNav, RPGCard, RPGInput, RPGButton, RPGBackground, RPGAlert } from "@/components/rpg-ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setError("請輸入電子郵件");
    setLoading(true); setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err.code === "auth/user-not-found" ? "找不到此信箱的帳號" : err.message || "發送失敗，請再試一次");
    } finally { setLoading(false); }
  }

  return (
    <main className="relative min-h-screen bg-[#0C0A09] flex items-center justify-center px-4 py-24 overflow-hidden">
      <RPGBackground src="/signin-banner.png" opacity={20} />
      <RPGNav showLogin />

      <div className="relative z-10 w-full max-w-sm">
        <RPGCard accentColor="#CA8A04">
          <div className="space-y-6">
            <div className="text-center">
              <Image src="/logo.png" alt="logo" width={48} height={48} className="mx-auto mb-3 drop-shadow-[0_0_12px_rgba(202,138,4,0.7)]" />
              <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>
                重置密碼
              </h1>
              <p className="text-xs text-white/40 mt-1">輸入信箱，我們會寄送魔法重置連結</p>
            </div>

            {sent ? (
              <div className="space-y-4 text-center">
                <Image src="/email-verify.png" alt="sent" width={100} height={100} className="mx-auto drop-shadow-[0_0_20px_rgba(202,138,4,0.5)]" />
                <RPGAlert type="success" message={`重置連結已寄送至 ${email}，請檢查信箱！`} />
                <RPGButton variant="gold" onClick={() => { setSent(false); setEmail(""); }}>
                  重新寄送
                </RPGButton>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <RPGInput
                  label="電子郵件"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
                {error && <RPGAlert type="error" message={error} />}
                <RPGButton type="submit" variant="gold" disabled={loading}>
                  {loading ? "發送中..." : "✦ 寄送重置連結"}
                </RPGButton>
              </form>
            )}

            <div className="text-center space-y-1">
              <Link href="/signin" className="block text-sm text-[#CA8A04]/60 hover:text-[#CA8A04] transition-colors cursor-pointer">
                ← 返回登入
              </Link>
            </div>
          </div>
        </RPGCard>
      </div>
    </main>
  );
}