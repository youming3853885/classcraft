"use client"

import { motion } from "framer-motion"

interface DamageTextProps {
  value: number
  type: "damage" | "heal" | "crit" | "miss"
}

export function DamageText({ value, type }: DamageTextProps) {
  const config = {
    damage: { color: "text-red-500", prefix: "-", icon: "💥" },
    heal: { color: "text-green-500", prefix: "+", icon: "💚" },
    crit: { color: "text-yellow-400", prefix: "-", icon: "⚔️" },
    miss: { color: "text-gray-500", prefix: "", icon: "❌" },
  }

  const { color, prefix, icon } = config[type]

  return (
    <motion.span
      initial={{ y: 0, opacity: 1, scale: 0.5 }}
      animate={{
        y: -60,
        opacity: 0,
        scale: type === "crit" ? 1.5 : 1,
      }}
      transition={{ duration: 1, ease: "easeOut" }}
      className={`text-3xl font-bold ${color} absolute left-1/2 -translate-x-1/2`}
    >
      {icon} {prefix}{value}
    </motion.span>
  )
}

interface FloatingTextProps {
  children: React.ReactNode
}

export function FloatingText({ children }: FloatingTextProps) {
  return (
    <motion.span
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: -40, opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="absolute left-1/2 -translate-x-1/2"
    >
      {children}
    </motion.span>
  )
}