"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const SAMPLE_EVENTS = [
  { title: "幸運日", description: "今天所有人發言正確 +20 XP", xpDelta: 20, hpDelta: 0, coinDelta: 0 },
  { title: "沉默挑戰", description: "全班安靜 10 分鐘 +50 XP", xpDelta: 50, hpDelta: 0, coinDelta: 0 },
  { title: "補血時刻", description: "今天表現好的學生 +10 HP", xpDelta: 0, hpDelta: 10, coinDelta: 0 },
  { title: "金幣大放送", description: "全班 +5 Coins", xpDelta: 0, hpDelta: 0, coinDelta: 5 },
];

export default function EventsPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [triggering, setTriggering] = useState(false);

  async function triggerRandomEvent(event: typeof SAMPLE_EVENTS[0]) {
    setTriggering(true);
    // TODO: Call API to trigger random event
    setTimeout(() => {
      alert(`觸發事件：${event.title}\n${event.description}`);
      setTriggering(false);
    }, 500);
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-800">
              ← 返回
            </button>
            <span className="text-zinc-300">/</span>
            <span className="font-semibold">命運之輪</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        <h1 className="text-2xl font-bold">命運之輪</h1>

        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🎡</div>
            <h2 className="text-xl font-bold text-yellow-800">隨機事件</h2>
            <p className="text-sm text-yellow-600 mt-2">
              每日隨機觸發特殊事件，增加遊戲樂趣！
            </p>
          </div>
        </div>

        {/* 預設事件 */}
        <div className="space-y-4">
          <h3 className="font-semibold">可用事件</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {SAMPLE_EVENTS.map((event, i) => (
              <div key={i} className="rounded-xl border border-zinc-200 bg-white p-4">
                <h4 className="font-medium">{event.title}</h4>
                <p className="text-sm text-zinc-500 mt-1">{event.description}</p>
                <button
                  onClick={() => triggerRandomEvent(event)}
                  disabled={triggering}
                  className="mt-3 w-full rounded-lg bg-yellow-500 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                >
                  觸發事件
                </button>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-zinc-500">功能開發中...</p>
      </div>
    </main>
  );
}
