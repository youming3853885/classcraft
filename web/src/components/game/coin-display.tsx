"use client"

import { motion } from "framer-motion"

interface CoinDisplayProps {
  coins: number
  gems?: number
}

export function CoinDisplay({ coins, gems = 0 }: CoinDisplayProps) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="flex items-center gap-1 rounded-full bg-amber-900/50 border border-amber-500 px-3 py-1"
      >
        <span>💰</span>
        <span className="text-amber-400 font-bold">{coins.toLocaleString()}</span>
      </motion.div>
      {gems > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-1 rounded-full bg-purple-900/50 border border-purple-500 px-3 py-1"
        >
          <span>💎</span>
          <span className="text-purple-400 font-bold">{gems.toLocaleString()}</span>
        </motion.div>
      )}
    </div>
  )
}