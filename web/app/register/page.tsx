"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RPGNav, RPGBackground, RPGCard } from "@/components/rpg-ui";

export default function RegisterPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-screen bg-[#0C0A09] flex items-center justify-center px-4 py-24 overflow-hidden">
      <RPGBackground src="/role-select-bg.png" opacity={40} />
      <RPGNav showLogin />

      <div className="relative z-10 w-full max-w-4xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <Image src="/logo.png" alt="Classcraft" width={64} height={64} className="mx-auto drop-shadow-[0_0_16px_rgba(202,138,4,0.9)]" />
          <h1 className="text-4xl lg:text-5xl font-black text-[#CA8A04] drop-shadow-[0_0_20px_rgba(202,138,4,0.4)]"
            style={{ fontFamily: "'Baloo 2', cursive" }}>
            選擇你的角色
          </h1>
          <p className="text-white/50 text-sm tracking-wider">你在 Classcraft 世界中扮演的身份</p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Teacher Card */}
          <button
            onClick={() => router.push("/register/teacher")}
            className="group relative rounded-2xl border-2 border-purple-500/40 bg-[#1C1917]/90 overflow-hidden transition-all duration-300 hover:border-purple-400 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-[1.02] cursor-pointer text-left"
          >
            {/* Corner runes */}
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-purple-400/60 rounded-tl-md" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-purple-400/60 rounded-tr-md" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-purple-400/60 rounded-bl-md" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-purple-400/60 rounded-br-md" />

            {/* Glow on hover */}
            <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/5 transition-all duration-300 rounded-2xl" />

            <div className="p-8 space-y-5">
              <Image
                src="/teacher-hero.png"
                alt="Teacher Wizard"
                width={180}
                height={180}
                className="mx-auto drop-shadow-[0_0_30px_rgba(124,58,237,0.6)] group-hover:drop-shadow-[0_0_40px_rgba(124,58,237,0.9)] transition-all duration-300"
              />
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-purple-300 group-hover:text-purple-200 transition-colors" style={{ fontFamily: "'Baloo 2', cursive" }}>
                  法師導師
                </h2>
                <p className="text-sm text-white/50 leading-relaxed">
                  成為強大的教學法師<br />設計任務、創建班級、管理學生傳說
                </p>
              </div>
              <div className="w-full rounded-xl bg-purple-600 py-3 text-sm font-black text-white text-center group-hover:bg-purple-500 transition-colors tracking-wider uppercase">
                以老師身份加入 →
              </div>

              {/* Stat bars */}
              <div className="space-y-2">
                {[{ label: "課堂掌控", val: 95 }, { label: "任務設計", val: 88 }, { label: "學生管理", val: 100 }].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-xs text-white/40 w-16 text-right">{s.label}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-500" style={{ width: `${s.val}%` }} />
                    </div>
                    <span className="text-xs text-purple-400 font-bold w-8">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </button>

          {/* Student Card */}
          <button
            onClick={() => router.push("/register/student")}
            className="group relative rounded-2xl border-2 border-green-500/40 bg-[#1C1917]/90 overflow-hidden transition-all duration-300 hover:border-green-400 hover:shadow-2xl hover:shadow-green-500/30 hover:scale-[1.02] cursor-pointer text-left"
          >
            <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-green-400/60 rounded-tl-md" />
            <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-green-400/60 rounded-tr-md" />
            <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-green-400/60 rounded-bl-md" />
            <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-green-400/60 rounded-br-md" />
            <div className="absolute inset-0 bg-green-500/0 group-hover:bg-green-500/5 transition-all duration-300 rounded-2xl" />

            <div className="p-8 space-y-5">
              <Image
                src="/student-hero.png"
                alt="Student Heroes"
                width={180}
                height={180}
                className="mx-auto drop-shadow-[0_0_30px_rgba(34,197,94,0.6)] group-hover:drop-shadow-[0_0_40px_rgba(34,197,94,0.9)] transition-all duration-300"
              />
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-green-300 group-hover:text-green-200 transition-colors" style={{ fontFamily: "'Baloo 2', cursive" }}>
                  冒險英雄
                </h2>
                <p className="text-sm text-white/50 leading-relaxed">
                  化身勇敢的冒險者<br />完成任務、升級學習、加入公會戰隊
                </p>
              </div>
              <div className="w-full rounded-xl bg-green-600 py-3 text-sm font-black text-white text-center group-hover:bg-green-500 transition-colors tracking-wider uppercase">
                以學生身份加入 →
              </div>

              {/* Stat bars */}
              <div className="space-y-2">
                {[{ label: "戰鬥力", val: 92 }, { label: "學習速度", val: 87 }, { label: "團隊協作", val: 85 }].map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="text-xs text-white/40 w-16 text-right">{s.label}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500" style={{ width: `${s.val}%` }} />
                    </div>
                    <span className="text-xs text-green-400 font-bold w-8">{s.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-white/30">
          已有帳號？{" "}
          <Link href="/signin" className="text-[#CA8A04] font-bold hover:underline cursor-pointer">直接登入</Link>
          {" · "}
          <Link href="/" className="hover:text-white/50 transition-colors cursor-pointer">返回首頁</Link>
        </p>
      </div>
    </main>
  );
}