"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"

import { SignOutButton } from "@/components/auth/sign-out-button"

interface LeaderboardEntry {
  rank: number
  userId: string
  name: string
  image?: string | null
  xp?: number
  level?: number
  coins?: number
  helpCount?: number
}

export default function LeaderboardPage({
  classroomId,
  classroomName,
}: {
  classroomId: string
  classroomName: string
}) {
  const [activeTab, setActiveTab] = useState<"xp" | "coins" | "help">("xp")
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      try {
        const res = await fetch(`/api/classrooms/${classroomId}/leaderboard?type=${activeTab}`)
        if (res.ok) {
          const data = await res.json()
          setLeaderboard(data)
        }
      } catch (err) {
        console.error(err)
      }
      setLoading(false)
    }
    fetchLeaderboard()
  }, [classroomId, activeTab])

  const tabs = [
    { id: "xp", label: "等級榜", icon: "✨", key: "xp" },
    { id: "coins", label: "財富榜", icon: "💰", key: "coins" },
    { id: "help", label: "互助榜", icon: "🤝", key: "helpCount" },
  ] as const

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-100">
      {/* 頂部導航 */}
      <header className="border-b border-zinc-700 bg-zinc-900/80 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href={`/student/classrooms/${classroomId}`} className="flex items-center gap-3 hover:opacity-80">
            <span className="text-2xl">←</span>
            <span className="font-bold">返回</span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        {/* 標題 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <span>🏆</span> 排行榜
          </h1>
          <p className="text-zinc-400 mt-2">{classroomName}</p>
        </div>

        {/* 標籤切換 */}
        <div className="flex justify-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl font-medium transition ${
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* 排行榜內容 */}
        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-6">
          {loading ? (
            <div className="text-center py-8 text-zinc-500">載入中...</div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">暫無排行資料</div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((entry) => (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    entry.rank <= 3
                      ? "bg-gradient-to-r from-yellow-900/30 to-amber-900/30 border border-yellow-700"
                      : "bg-zinc-800/50 border border-zinc-700"
                  }`}
                >
                  {/* 排名 */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    entry.rank === 1
                      ? "bg-yellow-600 text-yellow-100"
                      : entry.rank === 2
                        ? "bg-gray-400 text-gray-100"
                        : entry.rank === 3
                          ? "bg-amber-700 text-amber-100"
                          : "bg-zinc-700 text-zinc-400"
                  }`}>
                    {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                  </div>

                  {/* 頭像 */}
                  {entry.image ? (
                    <img src={entry.image} alt="" className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg">
                      {(entry.name || "?")[0].toUpperCase()}
                    </div>
                  )}

                  {/* 名稱 */}
                  <div className="flex-1">
                    <p className="font-bold">{entry.name}</p>
                  </div>

                  {/* 數值 */}
                  <div className="text-right">
                    {activeTab === "xp" && (
                      <p className="text-purple-400 font-bold">
                        Lv.{entry.level} <span className="text-sm text-zinc-500">({entry.xp} XP)</span>
                      </p>
                    )}
                    {activeTab === "coins" && (
                      <p className="text-amber-400 font-bold">💰 {entry.coins}</p>
                    )}
                    {activeTab === "help" && (
                      <p className="text-green-400 font-bold">🤝 {entry.helpCount} 次</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 返回 */}
        <div className="text-center">
          <Link
            href={`/student/classrooms/${classroomId}`}
            className="px-6 py-3 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition"
          >
            返回班級
          </Link>
        </div>
      </div>
    </main>
  )
}