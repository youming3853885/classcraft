"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CharacterAvatar, EQUIPMENT_REGISTRY, RARITY_COLORS, type CharacterEquipment, type EquipmentSlot, type EquipmentItemDef } from "@/components/game/character-avatar"

interface OwnedItemEntry {
  key: string
  def: EquipmentItemDef
}

export interface PaperDollEditorProps {
  classroomId: string
  characterClass: "WARRIOR" | "MAGE" | "HEALER"
  initialEquipment: Record<string, string | null>
  ownedItemKeys: string[]
  level?: number
  playerName?: string
}

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  helmet:    "頭部",
  armor:     "胸甲",
  pants:     "腿部",
  guardian:  "守護",
  boots:     "足部",
  pet:       "寵物",
  offhand:   "左手",
  weapon:    "右手",
  earring1:  "飾品",
  earring2:  "戒指",
  cape:      "斗篷",
  accessory: "項鍊",
}

// CodeCombat L-Layout Slots
const TOP_SLOTS: EquipmentSlot[] = ["earring1", "earring2", "accessory", "helmet", "guardian", "pet"]
const LEFT_SLOTS: EquipmentSlot[] = ["weapon", "offhand", "armor", "pants", "boots"]

export function PaperDollEditor({
  classroomId,
  characterClass,
  initialEquipment,
  ownedItemKeys,
  level = 1,
  playerName,
}: PaperDollEditorProps) {
  const [equipment, setEquipment] = useState<CharacterEquipment>(
    initialEquipment as CharacterEquipment
  )
  const [hoveredSlot, setHoveredSlot] = useState<EquipmentSlot | null>(null)
  const [selectedItem, setSelectedItem] = useState<OwnedItemEntry | null>(null)
  const [activeTab, setActiveTab] = useState<EquipmentSlot | "all">("all")
  const [saving, setSaving] = useState(false)

  // Items logic
  const ownedItems: OwnedItemEntry[] = ownedItemKeys
    .filter(k => EQUIPMENT_REGISTRY[k])
    .map(k => ({ key: k, def: EQUIPMENT_REGISTRY[k] }))

  const displayItems = ownedItems.length > 0 ? ownedItems : Object.entries(EQUIPMENT_REGISTRY).map(([k, def]) => ({ key: k, def }))
  const filteredItems = activeTab === "all" ? displayItems : displayItems.filter(i => i.def.slot === activeTab)

  const isEquipped = (key: string) => Object.values(equipment).includes(key)

  const equip = async (slot: EquipmentSlot, itemKey: string) => {
    setSaving(true)
    try {
      const res = await fetch("/api/user/equipment", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomId, slot, itemKey }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { equipment: newEq } = await res.json()
      setEquipment(newEq)
    } catch {} finally { setSaving(false) }
  }

  const getEquippedKey = (slot: EquipmentSlot): string | null | undefined => {
    const eq = equipment as any
    if (slot === "guardian") return eq.guardian ?? eq.cape
    if (slot === "earring1") return eq.earring1 ?? eq.accessory
    return eq[slot]
  }

  const SlotButton = ({ slot, className = "" }: { slot: EquipmentSlot, className?: string }) => {
    const equipped = getEquippedKey(slot)
    const def = equipped ? EQUIPMENT_REGISTRY[equipped] : null
    const isActive = hoveredSlot === slot

    return (
      <button
        onClick={() => {
          if (equipped) setSelectedItem({ key: equipped, def: def! })
          setHoveredSlot(slot)
        }}
        className={`w-14 h-14 rpg-slot-base flex items-center justify-center transition-all relative group ${isActive ? "ring-2 ring-yellow-400 scale-105" : "hover:border-yellow-900/40"} ${className}`}
      >
        {def ? (
          <span className="text-3xl drop-shadow-md">{def.emoji}</span>
        ) : (
          <span className="text-[10px] opacity-20 font-black">{SLOT_LABELS[slot]}</span>
        )}
      </button>
    )
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto flex flex-col items-center gap-0 select-none pb-20">
      
      {/* ── TOP NAV BAR (WOODEN) ────────────────────────────────────────── */}
      <div className="w-full h-24 rpg-wood flex items-center justify-between px-10 relative z-30 translate-y-2">
         <div className="flex items-center gap-4">
            <h2 className="text-4xl font-black text-[#f4e4bc] drop-shadow-[0_2px_4px_black] tracking-widest" style={{ fontFamily: "'Baloo 2', cursive" }}>道具欄</h2>
            <div className="rpg-parchment h-10 px-6 flex items-center gap-2 -rotate-1 shadow-lg">
                <span className="text-xl">💎</span>
                <span className="text-xl font-black text-[#5d4037]">844</span>
            </div>
         </div>
         <button className="rpg-close-btn">✖</button>
      </div>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────── */}
      <div className="w-full flex flex-col md:flex-row gap-0 items-stretch bg-[#2a1b12]/90 border-x-4 border-b-4 border-[#1a110a] shadow-2xl p-6 rounded-b-lg">
        
        {/* PANEL 1: CHARACTER + L-SLOTS (LEFT) */}
        <div className="flex-[1.2] relative min-h-[500px] flex flex-col gap-4 pr-6 border-r border-white/5">
           
           {/* Top Slots Row */}
           <div className="flex gap-2 mb-2">
              {TOP_SLOTS.map(s => <SlotButton key={s} slot={s} />)}
           </div>

           <div className="flex-1 flex gap-6">
              {/* Left Slots Column */}
              <div className="flex flex-col gap-2">
                 {LEFT_SLOTS.map(s => <SlotButton key={s} slot={s} />)}
              </div>

              {/* Character Focus */}
              <div className="flex-1 relative flex items-center justify-center bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]" />
                 <CharacterAvatar 
                   characterClass={characterClass} 
                   equipment={equipment} 
                   size="3xl" 
                   noFrame={true} 
                   showAnimation={true}
                   level={level}
                 />
                 <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-6 bg-black/40 blur-xl rounded-full" />
              </div>
           </div>

           {/* Mobile Buttons */}
           <div className="mt-6 flex gap-3">
              <button className="flex-1 py-3 px-6 rounded-sm bg-[#4a7c44] border-b-4 border-black/40 text-[#f4e4bc] font-black text-sm uppercase tracking-widest shadow-lg hover:brightness-110 active:translate-y-1 transition-all">更換英雄</button>
              <button className="flex-1 py-3 px-6 rounded-sm bg-[#6d6d6d] border-b-4 border-black/40 text-[#f4e4bc] font-black text-sm uppercase tracking-widest shadow-lg hover:brightness-110 active:translate-y-1 transition-all">進入關卡</button>
           </div>
        </div>

        {/* PANEL 2: INVENTORY LIST (MIDDLE) */}
        <div className="flex-1 px-4 flex flex-col gap-4">
           <h3 className="text-[#f4e4bc] font-black text-xl tracking-tight border-b border-white/10 pb-2">可使用的裝備</h3>
           <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-3 max-h-[500px] scrollbar-thin">
              {filteredItems.map(({ key, def }) => (
                <button
                  key={key}
                  onClick={() => setSelectedItem({ key, def })}
                  className={`group relative p-3 bg-black/30 border-2 rounded transition-all flex flex-col items-center gap-1
                    ${isEquipped(key) ? "border-green-600/40 bg-green-900/10" : "border-[#1a110a] hover:border-yellow-900/60"}
                    ${selectedItem?.key === key ? "border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]" : ""}
                  `}
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform drop-shadow-md">{def.emoji}</span>
                  <div className="absolute -bottom-1 left-0 right-0 bg-[#3d2b1f] py-0.5 text-center">
                     <span className="text-[9px] font-black text-[#f4e4bc]/60 uppercase tracking-tighter">裝備</span>
                  </div>
                  {isEquipped(key) && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_green]" />}
                </button>
              ))}
           </div>
           
           <div className="p-3 bg-blue-900/10 border border-blue-500/20 rounded-md flex items-center gap-3">
              <span className="text-blue-400 text-lg">ℹ</span>
              <p className="text-[10px] text-blue-200/60 font-black leading-tight">連點物品兩下可快速穿戴或卸除。<br/>注意：某些裝備有職業限制。</p>
           </div>
        </div>

        {/* PANEL 3: ITEM INFO (RIGHT) */}
        <div className="w-full lg:w-80 flex flex-col items-stretch pt-2">
           <div className="rpg-parchment p-8 flex-1 flex flex-col shadow-2xl relative translate-x-2">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-10">
                 <div className="rpg-chain" />
                 <div className="rpg-chain" />
              </div>

              {selectedItem ? (
                <div className="flex-1 flex flex-col">
                   <div className="text-center mb-6">
                      <p className="text-[9px] font-black opacity-40 tracking-[0.4em] uppercase">物品詳情</p>
                      <h4 className="text-2xl font-black text-[#5d4037] mt-1">{selectedItem.def.name}</h4>
                      <div className="w-full h-px bg-black/10 mt-2" />
                   </div>

                   <div className="flex-1 flex items-center justify-center py-4">
                      <div className="w-32 h-32 rounded-full border-2 border-dashed border-black/10 flex items-center justify-center relative bg-white/10">
                         <span className="text-7xl drop-shadow-xl">{selectedItem.def.emoji}</span>
                         <div className="absolute -bottom-2 -right-2 bg-[#8b4513] text-[#f4e4bc] text-[9px] px-2 py-0.5 rounded font-black shadow-md uppercase">
                            {selectedItem.def.rarity}
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4 mb-4">
                      <div className="rpg-parchment-sub bg-black/5 border border-black/10 p-3 text-center rounded-sm shadow-inner">
                         <span className="text-[10px] uppercase font-black opacity-60">效果</span>
                         <p className="text-xl font-black text-[#5d4037]">{selectedItem.def.statLabel}</p>
                      </div>
                      <p className="text-xs text-[#5d4037]/80 italic text-center px-2 min-h-[3em]">
                        「 {selectedItem.def.description} 」
                      </p>
                   </div>

                   {/* Big Equip Button */}
                   <button 
                     onClick={() => equip(selectedItem.def.slot, isEquipped(selectedItem.key) ? "" : selectedItem.key)}
                     disabled={saving}
                     className={`w-full py-4 rounded-md font-black shadow-xl tracking-[0.3em] active:scale-95 transition-all
                       ${isEquipped(selectedItem.key) 
                         ? "bg-red-800 text-white border-b-4 border-red-950" 
                         : "bg-[#8b4513] text-[#f4e4bc] border-b-4 border-[#4a2e16] hover:brightness-110"
                       } disabled:opacity-50`}
                   >
                     {saving ? "SAVING..." : (isEquipped(selectedItem.key) ? "卸除" : "裝備")}
                   </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 pb-10">
                   <div className="text-7xl mb-4">📜</div>
                   <p className="text-sm font-black text-[#5d4037]">點擊左側物品<br/>查看冒險筆記</p>
                </div>
              )}
           </div>
        </div>
      </div>

    </div>
  )
}
