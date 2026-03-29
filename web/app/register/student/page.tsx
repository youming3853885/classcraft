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

const CLASSES = [
  {
    id: "WARRIOR", name: "戰士", emoji: "⚔",
    desc: "近戰王者 · HP+20 · 初始 HP 120",
    stat: 95, statLabel: "HP",
    color: "red", border: "border-red-500/50", bg: "from-red-900/40 to-red-800/20",
    text: "text-red-400", activeBg: "bg-red-900/10 text-red-300",
    barColor: "from-red-500 to-orange-400",
  },
  {
    id: "MAGE", name: "法師", emoji: "⬡",
    desc: "魔法爆發 · MP+30 · 初始 MP 80",
    stat: 85, statLabel: "MP",
    color: "purple", border: "border-purple-500/50", bg: "from-purple-900/40 to-purple-800/20",
    text: "text-purple-400", activeBg: "bg-purple-900/10 text-purple-300",
    barColor: "from-purple-500 to-indigo-400",
  },
  {
    id: "HEALER", name: "治癒", emoji: "◈",
    desc: "全隊支援 · 治療力 · 團隊核心",
    stat: 80, statLabel: "治",
    color: "green", border: "border-green-500/50", bg: "from-green-900/40 to-green-800/20",
    text: "text-green-400", activeBg: "bg-green-900/10 text-green-300",
    barColor: "from-green-500 to-emerald-400",
  },
];

type Screen = "form" | "verify-sent";

export default function StudentRegisterPage() {
  const [screen, setScreen] = useState<Screen>("form");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [classroomCode, setClassroomCode] = useState("");
  const [characterClass, setCharacterClass] = useState("WARRIOR");
  const [savedEmail, setSavedEmail] = useState("");
  const [savedPassword, setSavedPassword] = useState("");
  const [googleUser, setGoogleUser] = useState<any>(null);

  const selClass = CLASSES.find(c => c.id === characterClass)!;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("請輸入您的英雄名稱");
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
          role: "STUDENT", 
          characterClass, 
          redirect: false, 
          callbackUrl: "/student/dashboard" 
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
        <RPGBackground src="/student-hero.png" opacity={12} />
        <RPGNav showLogin />
        <div className="relative z-10 w-full max-w-sm">
          <RPGCard accentColor="#16A34A">
            <div className="text-center space-y-6">
              <Image src="/email-verify.png" alt="Verify" width={130} height={130} className="mx-auto drop-shadow-[0_0_30px_rgba(22,163,74,0.6)]" />
              <div>
                <h1 className="text-2xl font-black text-green-300 mb-2" style={{ fontFamily: "'Baloo 2', cursive" }}>
                  冒險資格確認中！
                </h1>
                <p className="text-sm text-white/50 leading-relaxed">
                  英雄召喚書已傳送至<br />
                  <span className="text-green-300 font-bold">{savedEmail}</span><br /><br />
                  點擊信中的封印連結完成驗證，<br />即可開始您的冒險旅程。
                </p>
              </div>
              <div className="space-y-3">
                <Link href="/signin" className="block w-full rounded-xl bg-gradient-to-r from-[#16A34A] to-[#15803D] py-3 text-sm font-black text-white text-center tracking-wider uppercase hover:from-green-500 hover:to-emerald-600 transition-all cursor-pointer">
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
      <RPGBackground src="/student-hero.png" opacity={12} />
      <RPGNav showLogin />

      <div className="relative z-10 w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        {/* Left — Character selection */}
        <div className="hidden lg:block space-y-6">
          <Image src="/student-hero.png" alt="Heroes" width={340} height={300} className="mx-auto drop-shadow-[0_0_60px_rgba(34,197,94,0.6)]" />
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-green-300" style={{ fontFamily: "'Baloo 2', cursive" }}>選擇你的職業</h2>
            <p className="text-sm text-white/40">每種職業都有獨特的能力與加成</p>
          </div>

          {/* Class picker */}
          <div className="space-y-3">
            {CLASSES.map(cls => (
              <button
                key={cls.id}
                onClick={() => setCharacterClass(cls.id)}
                className={`w-full flex items-center gap-4 rounded-xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                  characterClass === cls.id
                    ? `${cls.border} bg-gradient-to-r ${cls.bg} scale-[1.02] shadow-lg`
                    : "border-white/10 bg-white/3 hover:border-white/20"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-black ${characterClass === cls.id ? cls.text : "text-white/30"} border ${characterClass === cls.id ? cls.border : "border-white/10"}`}>
                  {cls.emoji}
                </div>
                <div className="flex-1 text-left">
                  <div className={`font-black text-sm ${characterClass === cls.id ? cls.text : "text-white/60"}`}>{cls.name}</div>
                  <div className="text-xs text-white/30">{cls.desc}</div>
                </div>
                <div className="w-16">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${cls.barColor} rounded-full`} style={{ width: `${cls.stat}%` }} />
                  </div>
                  <div className={`text-xs text-right mt-0.5 font-bold ${cls.text}`}>{cls.stat} {cls.statLabel}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right — Form */}
        <RPGCard accentColor="#16A34A">
          <div className="space-y-5">
            <div className="text-center">
              <h1 className="text-2xl font-black text-green-300" style={{ fontFamily: "'Baloo 2', cursive" }}>學生註冊</h1>
              <p className="text-xs text-white/40 mt-1 tracking-widest uppercase">建立你的冒險者帳號</p>
            </div>

            {/* Mobile class picker */}
            <div className="lg:hidden">
              <label className="block text-xs font-bold text-[#CA8A04]/80 mb-2 tracking-wider uppercase">選擇職業</label>
              <div className="grid grid-cols-3 gap-2">
                {CLASSES.map(cls => (
                  <button key={cls.id} onClick={() => setCharacterClass(cls.id)} type="button"
                    className={`relative rounded-xl border-2 p-3 text-center transition-all cursor-pointer ${characterClass === cls.id ? `${cls.border} bg-gradient-to-b ${cls.bg} scale-105` : "border-white/10 bg-white/3"}`}>
                    {characterClass === cls.id && <span className="absolute top-1 right-1 text-xs text-green-400 font-bold">✓</span>}
                    <div className={`text-lg font-black ${characterClass === cls.id ? cls.text : "text-white/30"}`}>{cls.emoji}</div>
                    <div className={`text-xs font-bold ${characterClass === cls.id ? cls.text : "text-white/40"}`}>{cls.name}</div>
                  </button>
                ))}
              </div>
              <div className={`mt-2 rounded-lg p-2 text-xs text-center ${selClass.activeBg}`}>{selClass.desc}</div>
            </div>

            {!googleUser && (
              <>
                <GoogleButton onClick={handleGoogle} disabled={loading}>
                  使用 Google 帳號以學生身份加入
                </GoogleButton>

                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-green-500/20" />
                  <span className="text-xs text-white/30 tracking-widest uppercase">或填寫資料</span>
                  <div className="flex-1 border-t border-green-500/20" />
                </div>
              </>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <RPGInput label="英雄名稱" required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="例如：小明" accentColor="#16A34A" />
              
              {googleUser ? (
                <div className="rounded-xl border border-green-500/50 bg-green-500/10 p-4">
                  <p className="text-sm font-bold text-green-400 mb-1">✅ 已綁定 Google 帳號</p>
                  <p className="text-xs text-white/50">{googleUser.email}</p>
                </div>
              ) : (
                <>
                  <RPGInput label="電子郵件" required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" accentColor="#16A34A" />
                  <RPGInput label="密碼" required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="設定密碼（至少 6 碼）" accentColor="#16A34A" />
                </>
              )}
              <div className="rounded-xl border border-[#CA8A04]/20 bg-[#CA8A04]/5 p-4 space-y-2">
                <RPGInput label="班級邀請碼（選填）" type="text" value={classroomCode}
                  onChange={e => setClassroomCode(e.target.value.toUpperCase())}
                  placeholder="例如：ABC123" maxLength={10} accentColor="#CA8A04" />
                <p className="text-xs text-white/30">請向老師取得班級邀請碼以加入班級</p>
              </div>
              {error && <RPGAlert type="error" message={error} />}
              <RPGButton type="submit" variant="green" disabled={loading}>
                {loading ? "建立中..." : "✦ 建立冒險者帳號"}
              </RPGButton>
            </form>

            <div className="text-center space-y-1.5">
              <p className="text-sm text-white/30">
                不是學生？{" "}<Link href="/register/teacher" className="text-purple-400 font-bold hover:underline cursor-pointer">老師點這裡</Link>
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
