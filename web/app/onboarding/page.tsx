"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { RPGNav, RPGCard, RPGInput, RPGButton, RPGBackground, RPGAlert } from "@/components/rpg-ui";

const ROLES = [
  {
    id: "TEACHER",
    label: "法師導師",
    sub: "建立班級、發佈作業、管理學生進度",
    icon: "/teacher-hero.png",
    color: "purple",
    border: "border-purple-500/50",
    bg: "bg-purple-900/20",
    text: "text-purple-300",
    btn: "bg-gradient-to-r from-[#7C3AED] to-[#6D28D9]",
  },
  {
    id: "STUDENT",
    label: "冒險英雄",
    sub: "加入班級、完成任務、累積 XP 與獎勵",
    icon: "/student-hero.png",
    color: "green",
    border: "border-green-500/50",
    bg: "bg-green-900/20",
    text: "text-green-300",
    btn: "bg-gradient-to-r from-[#16A34A] to-[#15803D]",
  },
];

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState(session?.user?.name ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session]);

  async function handleSubmit() {
    if (!selected) return setError("請選擇你的角色身份");
    if (!name.trim()) return setError("請輸入你的英雄名稱");
    setLoading(true); setError("");
    const res = await fetch("/api/user/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selected, name: name.trim() }),
    });
    if (!res.ok) { setLoading(false); return setError("設定失敗，請再試一次"); }
    await update();
    router.replace("/dashboard");
  }

  return (
    <main className="relative min-h-screen bg-[#0C0A09] flex items-center justify-center px-4 py-24 overflow-hidden">
      <RPGBackground src="/role-select-bg.png" opacity={30} />
      <RPGNav showLogin={false} />

      <div className="relative z-10 w-full max-w-2xl space-y-8">
        <div className="text-center space-y-2">
          <Image src="/logo.png" alt="Classcraft" width={56} height={56} className="mx-auto drop-shadow-[0_0_16px_rgba(202,138,4,0.9)]" />
          <h1 className="text-3xl font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>
            歡迎加入冒險
          </h1>
          <p className="text-sm text-white/40">選擇你的角色，開始你的 Classcraft 之旅</p>
        </div>

        {/* Name input */}
        <RPGCard accentColor="#CA8A04">
          <div className="space-y-5">
            <RPGInput
              label="英雄名稱"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="輸入你希望顯示的名稱"
              required
            />

            {/* Role selection */}
            <div>
              <label className="block text-xs font-bold text-[#CA8A04]/70 mb-3 tracking-wider uppercase">選擇角色</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ROLES.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelected(role.id)}
                    className={`relative rounded-xl border-2 p-5 space-y-3 text-center transition-all duration-200 cursor-pointer ${
                      selected === role.id
                        ? `${role.border} ${role.bg} scale-[1.02] shadow-lg`
                        : "border-white/10 bg-white/3 hover:border-white/20"
                    }`}
                  >
                    {selected === role.id && (
                      <span className="absolute top-2 right-2 text-xs font-black text-green-400">✓</span>
                    )}
                    <Image
                      src={role.icon}
                      alt={role.label}
                      width={80}
                      height={80}
                      className={`mx-auto transition-all duration-300 ${selected === role.id ? "drop-shadow-[0_0_20px_rgba(124,58,237,0.6)]" : "opacity-60"}`}
                    />
                    <div>
                      <p className={`font-black text-sm ${selected === role.id ? role.text : "text-white/60"}`}>{role.label}</p>
                      <p className="text-xs text-white/30 mt-1">{role.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {error && <RPGAlert type="error" message={error} />}

            <RPGButton variant="gold" onClick={handleSubmit} disabled={loading || !selected || !name.trim()}>
              {loading ? "設定中..." : "⚔ 開始我的冒險"}
            </RPGButton>
          </div>
        </RPGCard>
      </div>
    </main>
  );
}
