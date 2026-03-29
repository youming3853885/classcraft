"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  RPGNav, RPGCard, RPGInput, RPGButton, GoogleButton, RPGBackground, RPGAlert
} from "@/components/rpg-ui";

type Screen = "login" | "unverified";

export default function SignInPage() {
  const [screen, setScreen] = useState<Screen>("login");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [unverifiedPassword, setUnverifiedPassword] = useState("");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) return setError("請輸入電子郵件與密碼");
    setLoading(true); setError("");
    try {
      const uc = await signInWithEmailAndPassword(auth, username.trim(), password);
      if (!uc.user.emailVerified) {
        await firebaseSignOut(auth);
        setUnverifiedEmail(username.trim());
        setUnverifiedPassword(password);
        setScreen("unverified");
        return;
      }
      const idToken = await uc.user.getIdToken();
      const res = await signIn("credentials", { idToken, action: "login", redirect: false, callbackUrl: "/dashboard" });
      if (res?.error) {
        if (res.error === "NOT_REGISTERED" || res.error.includes("NOT_REGISTERED")) {
          window.location.href = "/register";
          return;
        }
        return setError("帳號或密碼錯誤，請再試一次");
      }
      if (res?.url) window.location.href = res.url as string;
    } catch (err: any) {
      const codes = ["auth/invalid-credential","auth/wrong-password","auth/user-not-found"];
      setError(codes.includes(err?.code) ? "帳號或密碼錯誤" : err?.message || "登入失敗");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setLoading(true); setError("");
    try {
      const uc = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await uc.user.getIdToken();
      const res = await signIn("credentials", { idToken, action: "login", redirect: false, callbackUrl: "/dashboard" });
      if (res?.error) {
        if (res.error === "NOT_REGISTERED" || res.error.includes("NOT_REGISTERED")) {
          // 未註冊使用者，自動導向角色選擇畫面
          window.location.href = "/register";
          return;
        }
        setError("Google 登入同步失敗");
      }
      else if (res?.url) window.location.href = res.url as string;
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") setError(err.message || "Google 登入失敗");
    } finally { setLoading(false); }
  }

  async function handleResend() {
    setResendLoading(true); setResendSuccess(false);
    try {
      const uc = await signInWithEmailAndPassword(auth, unverifiedEmail, unverifiedPassword);
      await sendEmailVerification(uc.user);
      await firebaseSignOut(auth);
      setResendSuccess(true);
    } catch (err: any) { setError("重送失敗：" + (err?.message || "請稍後再試")); }
    finally { setResendLoading(false); }
  }

  // ── Unverified screen ──────────────────────────────────
  if (screen === "unverified") {
    return (
      <main className="relative min-h-screen bg-[#0C0A09] flex items-center justify-center px-4 py-24 overflow-hidden">
        <RPGBackground src="/signin-banner.png" opacity={25} />
        <RPGNav showLogin={false} />
        <div className="relative z-10 w-full max-w-md">
          <RPGCard accentColor="#CA8A04">
            <div className="text-center space-y-6">
              <Image src="/email-verify.png" alt="Email Verification" width={140} height={140} className="mx-auto drop-shadow-[0_0_30px_rgba(202,138,4,0.5)]" />
              <div>
                <h1 className="text-2xl font-black text-[#CA8A04] mb-2" style={{ fontFamily: "'Baloo 2', cursive" }}>
                  驗證魔法石碑
                </h1>
                <p className="text-sm text-white/60 leading-relaxed">
                  召喚信已傳送至<br />
                  <span className="text-[#CA8A04] font-bold">{unverifiedEmail}</span><br /><br />
                  請點擊信中的封印連結，<br />完成身份驗證後再登入冒險。
                </p>
              </div>
              <div className="space-y-3">
                {resendSuccess
                  ? <RPGAlert type="success" message="驗證信已重新發送！請檢查信箱。" />
                  : <RPGButton variant="ghost" onClick={handleResend} disabled={resendLoading}>
                      {resendLoading ? "傳送中..." : "重新發送驗證信"}
                    </RPGButton>
                }
                <RPGButton variant="gold" onClick={() => { setScreen("login"); setError(""); setResendSuccess(false); }}>
                  ← 返回登入
                </RPGButton>
              </div>
              {error && <RPGAlert type="error" message={error} />}
            </div>
          </RPGCard>
        </div>
      </main>
    );
  }

  // ── Login screen ───────────────────────────────────────
  return (
    <main className="relative min-h-screen bg-[#0C0A09] flex items-center justify-center px-4 py-24 overflow-hidden">
      <RPGBackground src="/signin-banner.png" opacity={30} />
      <RPGNav showLogin={false} />

      {/* Left — Gate Art */}
      <div className="relative z-10 hidden lg:flex w-full max-w-6xl mx-auto items-center gap-12">
        <div className="flex-1 hidden lg:block">
          <Image
            src="/signin-banner.png"
            alt="Fantasy Gate"
            width={520}
            height={440}
            className="rounded-2xl opacity-80 shadow-2xl shadow-[#CA8A04]/20 border border-[#CA8A04]/20"
          />
          <div className="mt-6 space-y-3">
            <p className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>
              踏入傳說之門
            </p>
            <p className="text-sm text-white/50">重新返回您的 Classcraft 冒險世界</p>
          </div>
        </div>

        {/* Right — Login card */}
        <div className="w-full max-w-sm">
          <RPGCard accentColor="#CA8A04">
            <div className="space-y-6">
              <div className="text-center">
                <Image src="/logo.png" alt="logo" width={56} height={56} className="mx-auto mb-3 drop-shadow-[0_0_12px_rgba(202,138,4,0.8)]" />
                <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>登入冒險</h1>
                <p className="text-xs text-white/40 mt-1 tracking-widest uppercase">Classcraft · 遊戲化學習</p>
              </div>

              <GoogleButton onClick={handleGoogle} disabled={loading}>
                使用 Google 帳號登入
              </GoogleButton>

              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-[#CA8A04]/20" />
                <span className="text-xs text-white/30 tracking-widest uppercase">或</span>
                <div className="flex-1 border-t border-[#CA8A04]/20" />
              </div>

              <form onSubmit={handleCredentials} className="space-y-4">
                <RPGInput label="電子郵件" type="email" value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="your@email.com" autoComplete="username" />
                <RPGInput label="密碼" type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="輸入密碼" autoComplete="current-password" />
                {error && <RPGAlert type="error" message={error} />}
                <RPGButton type="submit" variant="gold" disabled={loading}>
                  {loading ? "驗證中..." : "⚔ 進入冒險"}
                </RPGButton>
              </form>

              <div className="text-center space-y-2">
                <p className="text-sm text-white/40">
                  尚未建立帳號？{" "}
                  <Link href="/register" className="text-[#CA8A04] font-bold hover:underline cursor-pointer">立即加入</Link>
                </p>
                <Link href="/" className="block text-xs text-white/25 hover:text-white/50 transition-colors cursor-pointer">← 返回首頁</Link>
              </div>
            </div>
          </RPGCard>
        </div>
      </div>

      {/* Mobile-only card (no side art) */}
      <div className="relative z-10 lg:hidden w-full max-w-sm">
        <RPGCard accentColor="#CA8A04">
          <div className="space-y-6">
            <div className="text-center">
              <Image src="/logo.png" alt="logo" width={48} height={48} className="mx-auto mb-3 drop-shadow-[0_0_12px_rgba(202,138,4,0.8)]" />
              <h1 className="text-2xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>登入冒險</h1>
            </div>
            <GoogleButton onClick={handleGoogle} disabled={loading}>使用 Google 帳號登入</GoogleButton>
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-[#CA8A04]/20" />
              <span className="text-xs text-white/30">或</span>
              <div className="flex-1 border-t border-[#CA8A04]/20" />
            </div>
            <form onSubmit={handleCredentials} className="space-y-4">
              <RPGInput label="電子郵件" type="email" value={username} onChange={e => setUsername(e.target.value)} placeholder="your@email.com" />
              <RPGInput label="密碼" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="輸入密碼" />
              {error && <RPGAlert type="error" message={error} />}
              <RPGButton type="submit" variant="gold" disabled={loading}>{loading ? "驗證中..." : "⚔ 進入冒險"}</RPGButton>
            </form>
            <p className="text-sm text-center text-white/40">
              尚未建立帳號？ <Link href="/register" className="text-[#CA8A04] font-bold hover:underline">立即加入</Link>
            </p>
          </div>
        </RPGCard>
      </div>
    </main>
  );
}