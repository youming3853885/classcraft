"use client"

import { useState } from "react"
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

// ─── Slot Layout ─────────────────────────────────────────────────────────────
// 4 rows × 3 cols, character in center of row 2
//
//  [earring1] [helmet]   [earring2]
//  [offhand]  CHARACTER  [weapon]
//  [armor]    [guardian] [pet]
//  [pants]    [boots]    [—]

type SlotOrChar = EquipmentSlot | "CHARACTER" | null

const SLOT_GRID: SlotOrChar[] = [
  "earring1",  "helmet",    "earring2",
  "offhand",   "CHARACTER", "weapon",
  "armor",     "guardian",  "pet",
  "pants",     "boots",     null,
]

const SLOT_LABELS: Record<EquipmentSlot, string> = {
  helmet:    "頭",
  armor:     "身甲",
  pants:     "褲子",
  guardian:  "守護靈",
  boots:     "鞋子",
  pet:       "寵物",
  offhand:   "左手",
  weapon:    "右手",
  earring1:  "耳環1",
  earring2:  "耳環2",
  // legacy aliases
  cape:      "守護靈",
  accessory: "耳環1",
}

const SLOT_ICONS: Record<EquipmentSlot, string> = {
  helmet:    "🪖",
  armor:     "🛡",
  pants:     "👖",
  guardian:  "🧚",
  boots:     "👢",
  pet:       "🐾",
  offhand:   "🗡",
  weapon:    "⚔",
  earring1:  "💎",
  earring2:  "✨",
  cape:      "🧚",
  accessory: "💎",
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [selectedItem, setSelectedItem] = useState<{ key: string; def: EquipmentItemDef } | null>(null)
  const [activeTab, setActiveTab] = useState<EquipmentSlot | "all">("all")
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

  // Build owned item list from registry
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

  // ─── API Call ───────────────────────────────────────────────────────────────

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
      showToast(itemKey ? `✓ 已裝備 ${EQUIPMENT_REGISTRY[itemKey]?.name}` : `✓ 已卸除裝備`, "ok")
    } catch {
      showToast("✗ 操作失敗，請重試", "err")
    } finally {
      setSaving(false)
    }
  }

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const handleSlotClick = (slot: EquipmentSlot) => {
    const currentKey = (equipment as Record<string, string | null | undefined>)[slot]
    if (currentKey) {
      setSelectedItem({ key: currentKey, def: EQUIPMENT_REGISTRY[currentKey]! })
    }
    setHoveredSlot(slot)
  }

  const handleItemClick = (entry: OwnedItemEntry) => {
    setSelectedItem(entry)
    setHoveredSlot(entry.def.slot)
  }

  const handleEquipSelected = () => {
    if (!selectedItem) return
    equip(selectedItem.def.slot, selectedItem.key)
  }

  const handleUnequip = () => {
    const slot = selectedItem?.def.slot ?? hoveredSlot
    if (!slot) return
    equip(slot, "")
    setSelectedItem(null)
  }

  const isSelectedEquipped = selectedItem ? isEquipped(selectedItem.key) : false

  const tabs: Array<{ key: EquipmentSlot | "all"; label: string }> = [
    { key: "all",      label: "全部" },
    { key: "helmet",   label: "頭" },
    { key: "armor",    label: "身甲" },
    { key: "pants",    label: "褲子" },
    { key: "guardian", label: "守護靈" },
    { key: "boots",    label: "鞋子" },
    { key: "offhand",  label: "左手" },
    { key: "weapon",   label: "右手" },
    { key: "earring1", label: "耳環1" },
    { key: "earring2", label: "耳環2" },
    { key: "pet",      label: "寵物" },
  ]

  // Resolve display slot key for legacy aliases
  const getEquippedKey = (slot: EquipmentSlot): string | null | undefined => {
    const eq = equipment as Record<string, string | null | undefined>
    if (slot === "guardian") return eq.guardian ?? eq.cape
    if (slot === "earring1") return eq.earring1 ?? eq.accessory
    return eq[slot]
  }

  return (
    <div className="relative w-full rounded-2xl border border-[#CA8A04]/20 bg-[#0C0A09] overflow-hidden"
      style={{ fontFamily: "'Exo 2', sans-serif" }}>
      {/* CRT scanline overlay */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.02]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,1) 2px,rgba(255,255,255,1) 3px)" }} />

      {/* Corner runes */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#CA8A04]/40 rounded-tl-md pointer-events-none z-20" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#CA8A04]/40 rounded-tr-md pointer-events-none z-20" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#CA8A04]/40 rounded-bl-md pointer-events-none z-20" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#CA8A04]/40 rounded-br-md pointer-events-none z-20" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between border-b border-[#CA8A04]/20 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-lg font-black text-[#CA8A04]" style={{ fontFamily: "'Baloo 2', cursive" }}>
            🎭 裝備管理
          </span>
          {playerName && <span className="text-xs text-white/30">{playerName}</span>}
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-xs text-[#CA8A04] animate-pulse font-bold">儲存中⋯</span>
          )}
          {toast && (
            <span className={`text-xs font-bold px-3 py-1 rounded-lg ${toast.type === "ok" ? "text-green-400 bg-green-900/20 border border-green-500/30" : "text-red-400 bg-red-900/20 border border-red-500/30"}`}>
              {toast.msg}
            </span>
          )}
        </div>
      </div>

      {/* Main 3-panel layout */}
      <div className="relative z-10 flex min-h-[540px]">

        {/* ── Panel A: Doll + Slot Grid ─────────────────────────────── */}
        <div className="flex-shrink-0 w-72 border-r border-[#CA8A04]/10 p-4 flex flex-col items-center gap-4">

          {/* Slot grid — 4 rows × 3 cols */}
          <div className="relative w-full">
            <div className="grid grid-cols-3 gap-2">
              {SLOT_GRID.map((slot, i) => {
                if (slot === "CHARACTER") {
                  return (
                    <div key="char" className="flex items-center justify-center py-1">
                      <div className="relative rounded-2xl border-2 border-[#CA8A04]/50 bg-gradient-to-b from-[#CA8A04]/10 to-[#CA8A04]/5 p-2 flex items-center justify-center
                        shadow-[0_0_24px_rgba(202,138,4,0.15)]">
                        {/* Corner runes on character frame */}
                        <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#CA8A04]/60" />
                        <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#CA8A04]/60" />
                        <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#CA8A04]/60" />
                        <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#CA8A04]/60" />
                        <CharacterAvatar
                          characterClass={characterClass}
                          equipment={equipment}
                          size="xl"
                          showAnimation={true}
                          level={level}
                        />
                      </div>
                    </div>
                  )
                }
                if (slot === null) return <div key={`empty-${i}`} />

                const equipped = getEquippedKey(slot)
                const def = equipped ? EQUIPMENT_REGISTRY[equipped] : null
                const isActive = hoveredSlot === slot

                return (
                  <button
                    key={slot}
                    onClick={() => handleSlotClick(slot)}
                    title={SLOT_LABELS[slot]}
                    className={`relative flex flex-col items-center justify-center rounded-xl border p-1.5 transition-all cursor-pointer aspect-square
                      ${isActive
                        ? "border-[#CA8A04]/80 bg-[#CA8A04]/15 shadow-[0_0_14px_rgba(202,138,4,0.25)]"
                        : def
                        ? "border-white/25 bg-white/5 hover:border-[#CA8A04]/50"
                        : "border-dashed border-white/10 bg-transparent hover:border-white/20"}`}
                  >
                    {/* Corner rune */}
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-[#CA8A04]/25 rounded-tl-sm" />
                    {def ? (
                      <>
                        <span className="text-2xl leading-none">{def.emoji}</span>
                        <span className="text-[8px] text-white/40 mt-0.5 leading-none truncate w-full text-center px-0.5">{def.name}</span>
                        {/* Rarity dot */}
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: RARITY_COLORS[def.rarity] }} />
                      </>
                    ) : (
                      <>
                        <span className="text-lg opacity-15">{SLOT_ICONS[slot]}</span>
                        <span className="text-[8px] text-white/15 mt-0.5 leading-none">{SLOT_LABELS[slot]}</span>
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Equipped stat summary */}
          <div className="w-full rounded-xl border border-white/5 bg-white/3 p-3 space-y-1.5 flex-1">
            <p className="text-[10px] font-black text-[#CA8A04]/60 uppercase tracking-widest mb-2">裝備效果</p>
            {Object.entries(equipment).filter(([, v]) => v).length === 0 ? (
              <p className="text-xs text-white/20">尚未裝備任何物品</p>
            ) : (
              Object.entries(equipment)
                .filter(([, v]) => v)
                .map(([slot, key]) => {
                  const def = EQUIPMENT_REGISTRY[key!]
                  if (!def) return null
                  return (
                    <div key={slot} className="flex justify-between text-xs">
                      <span className="text-white/30">{def.name}</span>
                      <span className="font-bold" style={{ color: RARITY_COLORS[def.rarity] }}>{def.statLabel}</span>
                    </div>
                  )
                })
            )}
          </div>
        </div>

        {/* ── Panel B: Item List ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col border-r border-[#CA8A04]/10 min-w-0">
          {/* Tabs */}
          <div className="flex overflow-x-auto gap-1 p-3 border-b border-white/5 scrollbar-none">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`flex-shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  activeTab === t.key
                    ? "bg-[#CA8A04]/15 text-[#CA8A04] border border-[#CA8A04]/40"
                    : "text-white/30 hover:text-white/60 border border-transparent"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Hint */}
          <div className="mx-3 mt-2 mb-0 rounded-lg border border-[#CA8A04]/15 bg-[#CA8A04]/5 px-3 py-1.5 flex items-center gap-2">
            <span className="text-[#CA8A04] text-xs">⚡</span>
            <span className="text-xs text-[#CA8A04]/60">點選道具查看詳情，右側「裝備」即可穿戴</span>
          </div>

          {/* Item Grid */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Equipped section */}
            {filteredItems.filter(i => isEquipped(i.key)).length > 0 && (
              <section className="space-y-2">
                <p className="text-[10px] font-bold text-[#CA8A04]/50 uppercase tracking-widest">✓ 已裝備</p>
                <div className="grid grid-cols-3 gap-2">
                  {filteredItems.filter(i => isEquipped(i.key)).map(({ key, def }) => (
                    <ItemCard key={key} itemKey={key} def={def} selected={selectedItem?.key === key} equipped onClick={() => handleItemClick({ key, def })} />
                  ))}
                </div>
              </section>
            )}

            {/* Available section */}
            {filteredItems.filter(i => !isEquipped(i.key)).length > 0 && (
              <section className="space-y-2">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">可用裝備</p>
                <div className="grid grid-cols-3 gap-2">
                  {filteredItems.filter(i => !isEquipped(i.key)).map(({ key, def }) => (
                    <ItemCard key={key} itemKey={key} def={def} selected={selectedItem?.key === key} equipped={false} onClick={() => handleItemClick({ key, def })} />
                  ))}
                </div>
              </section>
            )}

            {filteredItems.length === 0 && (
              <div className="text-center py-10 text-white/20 text-sm">此類別沒有可用道具</div>
            )}
          </div>
        </div>

        {/* ── Panel C: Item Detail ────────────────────────────────────── */}
        <div className="flex-shrink-0 w-56 flex flex-col">
          {selectedItem ? (
            <>
              {/* Item name header */}
              <div className="border-b border-white/5 px-4 py-3 text-center">
                <p className="text-sm font-black text-white">{selectedItem.def.name}</p>
                <p className="text-xs mt-0.5 font-bold" style={{ color: RARITY_COLORS[selectedItem.def.rarity] }}>
                  {selectedItem.def.rarity === "COMMON" ? "普通" :
                   selectedItem.def.rarity === "UNCOMMON" ? "優良" :
                   selectedItem.def.rarity === "RARE" ? "稀有" :
                   selectedItem.def.rarity === "EPIC" ? "史詩" : "傳說"}
                </p>
              </div>

              {/* Big item preview */}
              <div className="flex items-center justify-center py-6">
                <div className="relative">
                  {/* Glow ring */}
                  <div className="absolute inset-0 rounded-2xl blur-xl"
                    style={{ backgroundColor: RARITY_COLORS[selectedItem.def.rarity] + "30" }} />
                  <div className="relative rounded-2xl border-2 p-5 text-6xl"
                    style={{ borderColor: RARITY_COLORS[selectedItem.def.rarity] + "60", background: RARITY_COLORS[selectedItem.def.rarity] + "10" }}>
                    {selectedItem.def.emoji}
                  </div>
                </div>
              </div>

              {/* Stat badge */}
              <div className="mx-4 rounded-xl border border-[#CA8A04]/30 bg-[#CA8A04]/5 px-3 py-2 text-center mb-3">
                <p className="text-sm font-black text-[#CA8A04]">{selectedItem.def.statLabel}</p>
              </div>

              {/* Description */}
              <p className="text-xs text-white/35 px-4 text-center leading-relaxed">{selectedItem.def.description}</p>

              {/* Slot indicator */}
              <div className="mx-4 mt-4 flex items-center justify-center gap-1.5">
                <span className="text-white/20 text-xs">放入</span>
                <span className="text-xs font-bold border border-white/10 bg-white/5 px-2 py-0.5 rounded-md text-white/50">
                  {SLOT_LABELS[selectedItem.def.slot]}
                </span>
                <span className="text-white/20 text-xs">欄</span>
              </div>

              {/* Action buttons */}
              <div className="mt-auto p-4 space-y-2">
                {isSelectedEquipped ? (
                  <>
                    <div className="text-center text-xs text-green-400 font-bold mb-1">✓ 已裝備</div>
                    <button
                      onClick={handleUnequip}
                      disabled={saving}
                      className="w-full rounded-xl border border-red-500/40 bg-red-900/20 py-2.5 text-sm font-black text-red-400 hover:bg-red-900/40 transition disabled:opacity-40 cursor-pointer">
                      卸除裝備
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEquipSelected}
                    disabled={saving}
                    className="w-full rounded-xl bg-gradient-to-r from-[#CA8A04] to-[#D97706] py-2.5 text-sm font-black text-[#0C0A09] hover:opacity-90 transition disabled:opacity-40 cursor-pointer shadow-lg shadow-[#CA8A04]/20">
                    {saving ? "儲存中⋯" : "裝 備"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-4">
              <span className="text-4xl opacity-20">🗡️</span>
              <p className="text-xs text-white/20">選擇一件道具<br />查看詳情並裝備</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ItemCard sub-component ───────────────────────────────────────────────────

function ItemCard({ itemKey, def, selected, equipped, onClick }: {
  itemKey: string
  def: EquipmentItemDef
  selected: boolean
  equipped: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 rounded-xl border p-2 transition cursor-pointer text-center
        ${selected
          ? "border-[#CA8A04]/70 bg-[#CA8A04]/10 shadow-[0_0_10px_rgba(202,138,4,0.15)]"
          : equipped
            ? "border-green-500/30 bg-green-900/10 hover:border-green-400/50"
            : "border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/5"
        }`}
    >
      {/* Corner rune */}
      <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 border-t border-l border-[#CA8A04]/20 rounded-tl-sm" />
      {equipped && (
        <div className="absolute top-1 right-1 w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
          <span className="text-[8px] text-white font-black">✓</span>
        </div>
      )}
      {selected && (
        <div className="absolute inset-0 rounded-xl"
          style={{ boxShadow: `inset 0 0 8px ${RARITY_COLORS[def.rarity]}30` }} />
      )}
      <span className="text-xl leading-none">{def.emoji}</span>
      <span className="text-[9px] text-white/50 leading-tight line-clamp-1">{def.name}</span>
      {/* Rarity stripe */}
      <div className="w-full h-0.5 rounded-full mt-0.5" style={{ backgroundColor: RARITY_COLORS[def.rarity] + "60" }} />
    </button>
  )
}
