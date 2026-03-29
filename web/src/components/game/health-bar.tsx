"use client"

import { motion } from "framer-motion"

interface HealthBarProps {
  current: number
  max: number
  showValue?: boolean
  size?: "sm" | "md" | "lg"
}

export function HealthBar({ current, max, showValue = true, size = "md" }: HealthBarProps) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100))

  const heights = {
    sm: "h-2",
    md: "h-4",
    lg: "h-6",
  }

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-800 rounded-full overflow-hidden border border-gray-700 ${heights[size]}`}>
        <motion.div
          className="h-full bg-gradient-to-r from-red-600 to-red-400"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      {showValue && (
        <p className="text-xs text-gray-400 mt-1 text-center">
          {current} / {max} HP
        </p>
      )}
    </div>
  )
}