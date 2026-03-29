"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  updateProfile, sendEmailVerification, signOut as firebaseSignOut,
} from "firebase/auth";
import { signIn } from "next-auth/react";
import {
  RPGNav, RPGCard, RPGInput, RPGButton, GoogleButton, RPGBackground, RPGAlert
} from "@/components/rpg-ui";

type Screen = "form" | "verify-sent";

export default function TeacherRegisterPage() {
  const [screen, setScreen] = useState<Screen>("form");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [savedEmail, setSavedEmail] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [googleUser, setGoogleUser] = useState<any>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("請輸入您的顯示名稱");
    if (!googleUser) {
      if (!email || !password) return setError("請填寫所有必填欄位");
      if (password.length < 6) return setError("密碼至少需要 6 個字元");
    }
    setLoading(true); setError("");

    try {
      if (googleUser) {
        // Two-step Google Registration (Finalizing)
        const idToken = await googleUser.getIdToken();
        const res = await signIn("credentials", { 
          idToken, 
          action: "register", 
          name: name.trim(), 
          role: "TEACHER", 
          redirect: false, 
          callbackUrl: "/teacher/dashboard" 
        });
        if (res?.error) setError("建立失敗：您可能已經註冊過，請直接登入");
        else if (res?.url) window.location.href = res.url as string;
        return;
      }
      const uc = await createUserWithEmailAndPassword(auth, email.trim(), password);
      try { await updateProfile(uc.user, { displayName: name.trim() }); } catch {}
      await sendEmailVerification(uc.user);
      await firebaseSignOut(auth);
      setSavedEmail(email.trim()); setSavedPassword(password);
      setScreen("verify-sent");
    } catch (err: any) {
      setError(err.code === "auth/email-already-in-use" ? "此信箱已被使用，請直接登入或換一個信箱" : err?.message || "建立失敗");
    } finally { setLoading(false); }
  }

  async function handleGoogle() {
    setLoading(true); setError("");
    try {
      const uc = await signInWithPopup(auth, new GoogleAuthProvider());
      setGoogleUser(uc.user);
      if (uc.user.displayName) setName(uc.user.displayName);
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") setError(err.message || "Google 登入失敗");
    } finally { setLoading(false); }
  }

  async function handleResend() {
    setResendLoading(true); setResendSuccess(false);
    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const uc = await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
      await sendEmailVerification(uc.user);
      await firebaseSignOut(auth);
      setResendSuccess(true);
    } catch (err: any) { setError("重送失敗：" + (err?.message || "請稍後再試")); }
    finally { setResendLoading(false); }
  }

  // ── Verify sent screen ─────────────────────────────────
  if (screen === "verify-sent") {
    return (
      <main className="relative min-h-screen bg-[#0C0A09] flex items-center justify-center px-4 py-24 overflow-hidden">
        <RPGBackground src="/teacher-hero.png" opacity={15} />
        <RPGNav showLogin />
        <div className="relative z-10 w-full max-w-sm">
          <RPGCard accentColor="#7C3AED">
            <div className="text-center space-y-6">
              <Image src="/email-verify.png" alt="Verify" width={130} height={130} className="mx-auto drop-shadow-[0_0_30px_rgba(124,58,237,0.6)]" />
              <div>
                <h1 className="text-2xl font-black text-purple-300 mb-2" style={{ fontFamily: "'Baloo 2', cursive" }}>
                  魔法石碑已啟動！
                </h1>
                <p className="text-sm text-white/50 leading-relaxed">
                  驗證召喚書已傳送至<br />
                  <span className="text-purple-300 font-bold">{savedEmail}</span><br /><br />
                  點擊信中的封印連結完成驗證，<br />即可開始您的教學冒險。
                </p>
              </div>
              <div className="space-y-3">
                <Link href="/signin" className="block w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] py-3 text-sm font-black text-white text-center tracking-wider uppercase hover:from-purple-500 hover:to-indigo-500 transition-all cursor-pointer">
                  前往登入
                </Link>
                {resendSuccess
                  ? <RPGAlert type="success" message="驗證信已重新發送！" />
                  : <RPGButton variant="ghost" onClick={handleResend} disabled={resendLoading}>
                      {resendLoading ? "傳送中..." : "重新發送驗證信"}
                    </RPGButton>
                }
              </div>
              {error && <RPGAlert type="error" message={error} />}
            </div>
          </RPGCard>
        </div>
      </main>
    );
  }

  // ── Register form ──────────────────────────────────────
  return (
    <main className="relative min-h-screen bg-[#0C0A09] flex items-center justify-center px-4 py-24 overflow-hidden">
      <RPGBackground src="/teacher-hero.png" opacity={12} />
      <RPGNav showLogin />

      <div className="relative z-10 w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        {/* Left — Character showcase */}
        <div className="hidden lg:block text-center space-y-6">
          <Image
            src="/teacher-hero.png"
            alt="Teacher Wizard"
            width={320}
            height={360}
            className="mx-auto drop-shadow-[0_0_60px_rgba(124,58,237,0.7)]"
          />
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-purple-300" style={{ fontFamily: "'Baloo 2', cursive" }}>
              法師導師
            </h2>
            <p className="text-sm text-white/40 leading-relaxed">
              掌握課堂魔法，引導學生踏上<br />傳說級別的學習征途
            </p>
          </div>
          {/* Abilities */}
          <div className="inline-flex flex-wrap gap-2 justify-center">
            {["課堂設計", "任務發布", "評分魔法", "公會管理", "AI 批改"].map(a => (
              <span key={a} className="rounded-lg border border-purple-500/30 bg-purple-900/20 px-3 py-1 text-xs text-purple-300 font-bold">
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <RPGCard accentColor="#7C3AED">
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-2xl font-black text-purple-300" style={{ fontFamily: "'Baloo 2', cursive" }}>
                老師註冊
              </h1>
              <p className="text-xs text-white/40 mt-1 tracking-widest uppercase">建立您的教師帳號</p>
            </div>

            {!googleUser && (
              <>
                <GoogleButton onClick={handleGoogle} disabled={loading}>
                  使用 Google 帳號以老師身份加入
                </GoogleButton>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-purple-500/20" />
                  <span className="text-xs text-white/30 tracking-widest uppercase">或填寫資料</span>
                  <div className="flex-1 border-t border-purple-500/20" />
                </div>
              </>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <RPGInput label="顯示名稱" required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="例如：張老師" accentColor="#7C3AED" />
              
              {googleUser ? (
                <div className="rounded-xl border border-purple-500/50 bg-purple-500/10 p-4">
                  <p className="text-sm font-bold text-purple-400 mb-1">✅ 已綁定 Google 帳號</p>
                  <p className="text-xs text-white/50">{googleUser.email}</p>
                </div>
              ) : (
                <>
                  <RPGInput label="電子郵件" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" accentColor="#7C3AED" />
                  <RPGInput label="密碼" required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="設定密碼（至少 6 碼）" accentColor="#7C3AED" />
                </>
              )}
              {error && <RPGAlert type="error" message={error} />}
              <RPGButton type="submit" variant="purple" disabled={loading}>
                {loading ? "建立中..." : "✦ 建立教師帳號"}
              </RPGButton>
            </form>

            <div className="text-center space-y-1.5">
              <p className="text-sm text-white/30">
                不是老師？{" "}<Link href="/register/student" className="text-green-400 font-bold hover:underline cursor-pointer">學生點這裡</Link>
              </p>
              <p className="text-sm text-white/30">
                已有帳號？{" "}<Link href="/signin" className="text-[#CA8A04] font-bold hover:underline cursor-pointer">直接登入</Link>
              </p>
              <Link href="/register" className="block text-xs text-white/20 hover:text-white/40 cursor-pointer">← 返回角色選擇</Link>
            </div>
          </div>
        </RPGCard>
      </div>
    </main>
  );
}
