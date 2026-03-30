"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CharacterAvatar, EQUIPMENT_REGISTRY, RARITY_COLORS, type CharacterEquipment, type EquipmentSlot, type EquipmentItemDef } from "@/components/game/character-avatar"

// ─── Types ────────────────────────────────────────────────────────────────────

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
  armor:     "身甲",
  pants:     "腿部",
  guardian:  "守護",
  boots:     "足部",
  pet:       "寵物",
  offhand:   "左手",
  weapon:    "右手",
  earring1:  "飾品1",
  earring2:  "飾品2",
  // legacy
  cape:      "守護",
  accessory: "飾品1",
}

// Position mapping for floating slots around the character
// Assuming a 320x400 central area for the avatar
const SLOT_POSITIONS: Record<EquipmentSlot, string> = {
  helmet:   "top-4 left-1/2 -translate-x-1/2",
  earring1: "top-12 left-8 md:left-4",
  earring2: "top-12 right-8 md:right-4",
  offhand:  "top-1/2 -translate-y-12 left-4 md:-left-2",
  weapon:   "top-1/2 -translate-y-12 right-4 md:-right-2",
  armor:    "bottom-1/3 left-6 md:left-2",
  guardian: "top-0 right-0", // Floating
  pet:      "bottom-4 left-4",
  pants:    "bottom-4 left-1/2 -translate-x-12",
  boots:    "bottom-4 left-1/2 translate-x-1",
  cape:     "top-0 right-0",
  accessory: "top-12 left-4",
}

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

  // Build owned item list
  const ownedItems: OwnedItemEntry[] = ownedItemKeys
    .filter(k => EQUIPMENT_REGISTRY[k])
    .map(k => ({ key: k, def: EQUIPMENT_REGISTRY[k] }))

  const displayItems = ownedItems.length > 0 
    ? ownedItems 
    : Object.entries(EQUIPMENT_REGISTRY).map(([k, def]) => ({ key: k, def }))

  const filteredItems = activeTab === "all"
    ? displayItems
    : displayItems.filter(i => i.def.slot === activeTab)

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
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleSlotClick = (slot: EquipmentSlot) => {
    const currentKey = (equipment as any)[slot]
    if (currentKey) {
      setSelectedItem({ key: currentKey, def: EQUIPMENT_REGISTRY[currentKey]! })
    }
    setHoveredSlot(slot)
  }

  const getEquippedKey = (slot: EquipmentSlot): string | null | undefined => {
    const eq = equipment as any
    if (slot === "guardian") return eq.guardian ?? eq.cape
    if (slot === "earring1") return eq.earring1 ?? eq.accessory
    return eq[slot]
  }

  const Rivets = () => (
    <>
      <div className="rpg-rivet top-2 left-2" />
      <div className="rpg-rivet top-2 right-2" />
      <div className="rpg-rivet bottom-2 left-2" />
      <div className="rpg-rivet bottom-2 right-2" />
    </>
  )

  const tabs: Array<{ key: EquipmentSlot | "all"; label: string }> = [
    { key: "all",      label: "全部" },
    { key: "helmet",   label: "頭" },
    { key: "armor",    label: "裝" },
    { key: "weapon",   label: "武" },
    { key: "offhand",  label: "盾" },
    { key: "pet",      label: "寵" },
  ]

  return (
    <div className="relative w-full flex flex-col items-center gap-8 py-10 select-none">
      
      {/* ── HEADER PLATE ─────────────────────────────────────────────────── */}
      <div className="relative z-20 rpg-wood px-12 py-3 mb-4 -rotate-1 shadow-2xl">
         <Rivets />
         <h2 className="text-3xl font-black text-[#f5a623] tracking-[0.2em] drop-shadow-[0_2px_2px_black]" style={{ fontFamily: "'Baloo 2', cursive" }}>
           道具欄
         </h2>
         <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-12">
            <div className="rpg-chain" />
            <div className="rpg-chain" />
         </div>
      </div>

      {/* ── MAIN 3-PANEL STRETCH ────────────────────────────────────────── */}
      <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* PANEL 1: HERO ALTAR (LEFT) */}
        <div className="flex-1 min-h-[500px] rpg-wood p-6 flex items-center justify-center relative rounded-sm shadow-black/80">
          <Rivets />
          
          {/* Central Hero Shrine */}
          <div className="relative w-full h-full flex items-center justify-center">
             <CharacterAvatar 
               characterClass={characterClass} 
               equipment={equipment} 
               size="3xl" 
               noFrame={true} 
               showAnimation={true}
               level={level}
             />

             {/* Dynamic Equipment Slots floating around */}
             {(Object.keys(SLOT_LABELS) as EquipmentSlot[]).map((slot) => {
                if (slot === "cape" || slot === "accessory") return null;
                const equipped = getEquippedKey(slot);
                const def = equipped ? EQUIPMENT_REGISTRY[equipped] : null;
                const pos = SLOT_POSITIONS[slot];
                const isActive = hoveredSlot === slot;

                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    className={`absolute ${pos} w-16 h-16 rounded-lg transition-all z-20 flex items-center justify-center
                      ${isActive ? "rpg-slot-highlight" : "bg-black/40 border-2 border-white/10 hover:border-white/30"}
                      ${def ? "shadow-lg" : "opacity-60"}
                    `}
                  >
                    {def ? (
                      <span className="text-3xl drop-shadow-md">{def.emoji}</span>
                    ) : (
                      <span className="text-white/10 text-xs font-black uppercase tracking-tighter">{SLOT_LABELS[slot]}</span>
                    )}
                    {/* Small tag */}
                    <div className="absolute -bottom-1 -right-1 bg-black/80 text-[8px] px-1 text-white/40 border border-white/10 rounded-sm">
                       {SLOT_LABELS[slot]}
                    </div>
                  </button>
                )
             })}
          </div>

          {/* Floor Shadow */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/40 blur-xl rounded-full" />
        </div>

        {/* PANEL 2: INVENTORY SCROLL (MIDDLE) */}
        <div className="w-full lg:w-80 rpg-parchment p-5 flex flex-col shadow-2xl animate-paper-float">
          <div className="flex justify-between items-center mb-4 border-b border-black/10 pb-2">
            <h3 className="font-black text-lg tracking-tight">可使用的裝備</h3>
            <div className="w-6 h-1 bg-[#8b4513]/20 rounded-full" />
          </div>

          {/* Filter Tabs on Paper */}
          <div className="flex flex-wrap gap-1 mb-4">
             {tabs.map(t => (
               <button 
                 key={t.key} 
                 onClick={() => setActiveTab(t.key)}
                 className={`text-[10px] font-black px-2 py-0.5 rounded-sm transition-colors ${activeTab === t.key ? "bg-[#8b4513] text-[#f4e4bc]" : "hover:bg-[#8b4513]/10"}`}
               >
                 {t.label}
               </button>
             ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
             {/* Equipping List */}
             <div className="grid grid-cols-2 gap-3">
               {filteredItems.map(({ key, def }) => (
                 <button
                   key={key}
                   onClick={() => setSelectedItem({ key, def })}
                   className={`relative p-3 rounded-md border-2 transition-all group flex flex-col items-center gap-1
                     ${isEquipped(key) ? "bg-green-600/10 border-green-800/20" : "bg-black/5 border-transparent hover:border-[#8b4513]/30"}
                     ${selectedItem?.key === key ? "ring-2 ring-[#8b4513] border-[#8b4513]" : ""}
                   `}
                 >
                   <span className="text-4xl group-hover:scale-110 transition-transform">{def.emoji}</span>
                   <span className="text-[10px] font-bold text-center leading-tight opacity-70">{def.name}</span>
                   {isEquipped(key) && <div className="absolute top-1 right-1 text-[8px] bg-green-800 text-white px-1 rounded-sm">裝備中</div>}
                 </button>
               ))}
             </div>
          </div>
          
          <div className="mt-4 pt-2 border-t border-black/5 text-[10px] italic opacity-60 flex items-center gap-2">
            <span className="text-[#8b4513]">ⓘ</span> 連點物品兩下可直接裝備
          </div>
        </div>

        {/* PANEL 3: DETAIL SCROLL (RIGHT) */}
        <div className="w-full lg:w-96 rpg-parchment p-8 flex flex-col shadow-inner relative">
           {/* Chains for right panel */}
           <div className="absolute -top-4 left-4 flex flex-col gap-1 z-0">
              <div className="rpg-chain" />
           </div>
           <div className="absolute -top-4 right-4 flex flex-col gap-1 z-0">
              <div className="rpg-chain" />
           </div>

           <AnimatePresence mode="wait">
             {selectedItem ? (
               <motion.div 
                 key={selectedItem.key}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 className="flex-1 flex flex-col h-full"
               >
                 {/* Top Label */}
                 <div className="text-center mb-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">物品圖錄</div>
                    <h4 className="text-2xl font-black text-[#5d4037]">{selectedItem.def.name}</h4>
                    <div className="w-16 h-0.5 bg-[#8b4513]/20 mx-auto mt-2" />
                 </div>

                 {/* Center Icon */}
                 <div className="flex-1 flex items-center justify-center relative my-8">
                    <div className="w-48 h-48 rounded-full border-4 border-dashed border-[#8b4513]/10 flex items-center justify-center">
                       <span className="text-8xl drop-shadow-2xl">{selectedItem.def.emoji}</span>
                    </div>
                    {/* Rarity Seal */}
                    <div className="absolute bottom-2 right-4 rotate-12 bg-white/40 border-2 border-[#8b4513]/20 rounded-full w-16 h-16 flex items-center justify-center shadow-lg backdrop-blur-sm px-2 text-center">
                       <span className="text-[8px] font-black uppercase text-[#8b4513]" style={{ color: RARITY_COLORS[selectedItem.def.rarity] }}>
                          {selectedItem.def.rarity}
                       </span>
                    </div>
                 </div>

                 {/* Stats & Description */}
                 <div className="space-y-6">
                    <div className="bg-white/30 border border-[#8b4513]/10 p-4 rounded-sm text-center shadow-inner">
                       <span className="text-sm font-black text-[#8b4513] tracking-widest uppercase">能力加成</span>
                       <p className="text-2xl font-black mt-1">{selectedItem.def.statLabel || "????"}</p>
                    </div>
                    <p className="text-sm italic leading-relaxed text-center opacity-80 min-h-[4em]">
                      「 {selectedItem.def.description} 」
                    </p>
                 </div>

                 {/* Action area */}
                 <div className="mt-auto pt-8 flex gap-3">
                   {isEquipped(selectedItem.key) ? (
                     <button 
                       onClick={() => equip(selectedItem.def.slot, "")}
                       disabled={saving}
                       className="flex-1 bg-red-900/10 border-2 border-red-900/40 text-red-900 py-3 rounded-md font-black hover:bg-red-900/20 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-50"
                     >
                       卸除裝備
                     </button>
                   ) : (
                     <button 
                       onClick={() => equip(selectedItem.def.slot, selectedItem.key)}
                       disabled={saving}
                       className="flex-1 bg-[#8b4513] text-[#f4e4bc] py-3 rounded-md font-black shadow-lg hover:brightness-110 active:scale-95 transition-all uppercase tracking-[0.2em] disabled:opacity-50"
                     >
                       {saving ? "詠唱中..." : "裝備此物"}
                     </button>
                   )}
                 </div>
               </motion.div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <div className="text-7xl mb-6">📜</div>
                  <h4 className="text-xl font-black">英雄行囊</h4>
                  <p className="text-xs mt-2 leading-relaxed">選擇左側或中間的道具<br />以此翻閱裝備秘法卷軸</p>
               </div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* ── FOOTER ACTIONS ────────────────────────────────────────────── */}
      <div className="flex gap-6 mt-4">
         <button className="bg-green-700 hover:bg-green-600 text-white font-black px-8 py-3 rounded-sm border-2 border-black/20 shadow-xl active:translate-y-1 transition-all">
           更換英雄
         </button>
         <button className="bg-zinc-700 hover:bg-zinc-600 text-white font-black px-12 py-3 rounded-sm border-2 border-black/20 shadow-xl active:translate-y-1 transition-all tracking-widest">
           進入關卡
         </button>
      </div>

    </div>
  )
}
