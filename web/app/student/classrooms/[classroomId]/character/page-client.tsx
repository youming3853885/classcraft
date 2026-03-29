"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

import { CharacterAvatar, EquipmentSelector } from "@/components/game/character-avatar"
import { SignOutButton } from "@/components/auth/sign-out-button"

interface CharacterProps {
  classroom: {
    id: string
    name: string
  }
  character: {
    characterClass: string
    str: number
    int: number
    vit: number
    currentHp: number
    maxHp: number
    currentMp: number
    maxMp: number
    equipment: {
      helmet?: string
      armor?: string
      weapon?: string
      cape?: string
      pet?: string
    }
    petId?: string | null
  }
  level: number
  xp: number
  nextLevelXp: number
  coins: number
}

const CLASSES = [
  {
    id: "WARRIOR",
    name: "戰士",
    emoji: "⚔️",
    description: "擅長物理攻擊，HP +20，力量+5",
    color: "from-red-600 to-orange-500",
  },
  {
    id: "MAGE",
    name: "法師",
    emoji: "🔮",
    description: "擅長魔法攻擊，MP +30，智力+5",
    color: "from-purple-600 to-blue-500",
  },
  {
    id: "HEALER",
    name: "治癒者",
    emoji: "💚",
    description: "擅長恢復治療，HP +10, MP +15",
    color: "from-green-600 to-teal-500",
  },
]

const AVAILABLE_EQUIPMENT = {
  helmet: ["iron-helmet", "wizard-hat", "crown", "hood", "helmet-knight"],
  armor: ["iron-armor", "wizard-robe", "healer-robe", "leather-armor", "golden-armor"],
  weapon: ["sword", "staff", "wand", "dagger", "bow", "axe"],
  cape: ["red-cape", "blue-cape", "green-cape", "golden-cape"],
  pet: ["cat", "dog", "dragon", "owl", "ghost"],
}

export default function StudentCharacterPage({ data }: { data: CharacterProps }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [selectedClass, setSelectedClass] = useState(data.character.characterClass)
  const [equipment, setEquipment] = useState(data.character.equipment || {})

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/classrooms/${data.classroom.id}/character`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          characterClass: selectedClass,
          equipment,
        }),
      })
      if (res.ok) {
        router.refresh()
        alert("角色已更新！")
      }
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  const updateEquipment = (type: string, value: string) => {
    setEquipment((prev: any) => ({
      ...prev,
      [type]: value || null,
    }))
  }

  // 計算屬性加成
  const getClassBonus = (cls: string) => {
    switch (cls) {
      case "WARRIOR":
        return { str: 5, int: 0, vit: 3, hpBonus: 20, mpBonus: 0 }
      case "MAGE":
        return { str: 0, int: 5, vit: 0, hpBonus: 0, mpBonus: 30 }
      case "HEALER":
        return { str: 0, int: 3, vit: 2, hpBonus: 10, mpBonus: 15 }
      default:
        return { str: 0, int: 0, vit: 0, hpBonus: 0, mpBonus: 0 }
    }
  }

  const classBonus = getClassBonus(selectedClass)
  const totalStr = data.character.str + classBonus.str
  const totalInt = data.character.int + classBonus.int
  const totalVit = data.character.vit + classBonus.vit

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-zinc-100">
      {/* 頂部導航 */}
      <header className="border-b border-zinc-700 bg-zinc-900/80 backdrop-blur px-6 py-4 sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href={`/student/classrooms/${data.classroom.id}`} className="flex items-center gap-3 hover:opacity-80">
            <span className="text-2xl">←</span>
            <span className="font-bold">返回</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-amber-900/50 border border-amber-500 px-3 py-1">
              <span>💰</span>
              <span className="text-amber-400 font-bold">{data.coins}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-purple-900/50 border border-purple-500 px-3 py-1">
              <span className="text-purple-400">Lv.{data.level}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8 space-y-8">
        {/* 角色展示區 */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-zinc-700 p-6">
          <h1 className="text-2xl font-bold mb-6 text-center">我的角色</h1>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* 角色預覽 */}
            <div className="flex-shrink-0">
              <CharacterAvatar
                characterClass={selectedClass as any}
                equipment={equipment}
                size="xl"
                showAnimation
              />
            </div>

            {/* 屬性面板 */}
            <div className="flex-1 space-y-4 w-full">
              {/* 等級與經驗 */}
              <div className="bg-zinc-800/50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-purple-400">經驗值</span>
                  <span className="text-zinc-400">{data.xp} / {data.nextLevelXp} XP</span>
                </div>
                <div className="h-3 bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
                    style={{ width: `${((data.xp % 1000) / 1000) * 100}%` }}
                  />
                </div>
              </div>

              {/* HP 與 MP */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-red-400">❤️ HP</span>
                    <span className="text-zinc-400">{data.character.currentHp} / {data.character.maxHp}</span>
                  </div>
                  <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-red-400"
                      style={{ width: `${(data.character.currentHp / data.character.maxHp) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-400">💧 MP</span>
                    <span className="text-zinc-400">{data.character.currentMp} / {data.character.maxMp}</span>
                  </div>
                  <div className="h-2 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                      style={{ width: `${(data.character.currentMp / data.character.maxMp) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* 屬性數值 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-red-400">{totalStr}</p>
                  <p className="text-xs text-zinc-500">力量 STR</p>
                  {classBonus.str > 0 && (
                    <p className="text-xs text-green-400">+{classBonus.str} 職業加成</p>
                  )}
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-blue-400">{totalInt}</p>
                  <p className="text-xs text-zinc-500">智力 INT</p>
                  {classBonus.int > 0 && (
                    <p className="text-xs text-green-400">+{classBonus.int} 職業加成</p>
                  )}
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-green-400">{totalVit}</p>
                  <p className="text-xs text-zinc-500">耐力 VIT</p>
                  {classBonus.vit > 0 && (
                    <p className="text-xs text-green-400">+{classBonus.vit} 職業加成</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 職業選擇 */}
        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-6">
          <h2 className="text-xl font-semibold mb-4">選擇職業</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  selectedClass === cls.id
                    ? "border-purple-500 bg-purple-900/30"
                    : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{cls.emoji}</span>
                  <span className="font-bold text-lg">{cls.name}</span>
                </div>
                <p className="text-sm text-zinc-400">{cls.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 裝備系統 */}
        <div className="rounded-2xl bg-zinc-800/50 border border-zinc-700 p-6">
          <h2 className="text-xl font-semibold mb-4">裝備系統</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <EquipmentSelector
              type="helmet"
              selected={equipment.helmet || ""}
              onSelect={(v) => updateEquipment("helmet", v)}
              availableItems={AVAILABLE_EQUIPMENT.helmet}
            />
            <EquipmentSelector
              type="armor"
              selected={equipment.armor || ""}
              onSelect={(v) => updateEquipment("armor", v)}
              availableItems={AVAILABLE_EQUIPMENT.armor}
            />
            <EquipmentSelector
              type="weapon"
              selected={equipment.weapon || ""}
              onSelect={(v) => updateEquipment("weapon", v)}
              availableItems={AVAILABLE_EQUIPMENT.weapon}
            />
            <EquipmentSelector
              type="cape"
              selected={equipment.cape || ""}
              onSelect={(v) => updateEquipment("cape", v)}
              availableItems={AVAILABLE_EQUIPMENT.cape}
            />
            <EquipmentSelector
              type="pet"
              selected={equipment.pet || ""}
              onSelect={(v) => updateEquipment("pet", v)}
              availableItems={AVAILABLE_EQUIPMENT.pet}
            />
          </div>
        </div>

        {/* 儲存按鈕 */}
        <motion.button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-bold text-lg hover:from-purple-500 hover:to-pink-500 transition disabled:opacity-50"
          whileTap={{ scale: 0.98 }}
        >
          {saving ? "儲存中..." : "💾 儲存角色"}
        </motion.button>
      </div>
    </main>
  )
}