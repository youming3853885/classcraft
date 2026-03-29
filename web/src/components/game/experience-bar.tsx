"use client"

import { motion } from "framer-motion"

interface ExperienceBarProps {
  current: number
  nextLevel: number
  level: number
  showValue?: boolean
}

export function ExperienceBar({ current, nextLevel, level, showValue = true }: ExperienceBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / nextLevel) * 100))

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-purple-400 font-semibold">Lv.{level}</span>
        {showValue && (
          <span className="text-gray-400">{current} / {nextLevel} XP</span>
        )}
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}