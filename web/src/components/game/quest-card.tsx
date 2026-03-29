"use client"

import Link from "next/link"
import { motion } from "framer-motion"

interface QuestCardProps {
  id: string
  title: string
  description: string
  xpReward?: number
  coinReward?: number
  status?: "available" | "in_progress" | "completed"
  classroomName?: string
  href?: string
}

export function QuestCard({
  id,
  title,
  description,
  xpReward = 0,
  coinReward = 0,
  status = "available",
  classroomName,
  href = `/student/quests/${id}`,
}: QuestCardProps) {
  const statusColors = {
    available: "border-amber-500 bg-amber-900/10",
    in_progress: "border-blue-500 bg-blue-900/10",
    completed: "border-green-500 bg-green-900/10",
  }

  const statusText = {
    available: "可接取",
    in_progress: "進行中",
    completed: "已完成",
  }

  const statusIcons = {
    available: "📜",
    in_progress: "⚔️",
    completed: "✅",
  }

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`rounded-xl border-2 p-4 transition ${statusColors[status]} hover:shadow-lg`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{statusIcons[status]}</span>
              <h3 className="font-bold text-lg">{title}</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{description}</p>
            {classroomName && (
              <p className="text-xs text-purple-400 mb-2">🌍 {classroomName}</p>
            )}
          </div>
          <div className="text-right">
            <span className={`text-xs px-2 py-1 rounded-full ${
              status === "completed"
                ? "bg-green-900/50 text-green-400"
                : status === "in_progress"
                ? "bg-blue-900/50 text-blue-400"
                : "bg-amber-900/50 text-amber-400"
            }`}>
              {statusText[status]}
            </span>
          </div>
        </div>

        {/* 獎勵 */}
        {(xpReward > 0 || coinReward > 0) && (
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-700">
            {xpReward > 0 && (
              <div className="flex items-center gap-1 text-purple-400">
                <span>✨</span>
                <span className="text-sm font-semibold">+{xpReward} XP</span>
              </div>
            )}
            {coinReward > 0 && (
              <div className="flex items-center gap-1 text-amber-400">
                <span>💰</span>
                <span className="text-sm font-semibold">+{coinReward}</span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </Link>
  )
}