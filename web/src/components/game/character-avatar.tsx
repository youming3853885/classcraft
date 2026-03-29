"use client"

import { motion } from "framer-motion"
import { useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CharacterEquipment {
  helmet?:   string | null
  armor?:    string | null
  pants?:    string | null   // 褲子（下身）
  guardian?: string | null   // 守護靈（頭上浮動精靈）
  boots?:    string | null   // 鞋子
  pet?:      string | null   // 寵物
  offhand?:  string | null   // 左手（盾/副手）
  weapon?:   string | null   // 右手（武器）
  earring1?: string | null   // 耳環1（左）
  earring2?: string | null   // 耳環2（右）
  // Legacy compatibility aliases
  cape?:     string | null   // maps to guardian
  accessory?:string | null   // maps to earring1
}

export type EquipmentSlot = keyof CharacterEquipment

// ─── Static Item Registry ─────────────────────────────────────────────────────

export interface EquipmentItemDef {
  name: string
  slot: EquipmentSlot
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY"
  description: string
  statLabel: string
  svgColor: string
  accentColor: string
  emoji: string
}

export const EQUIPMENT_REGISTRY: Record<string, EquipmentItemDef> = {
  // ── Helmets 頭 ──
  "iron-helmet":    { name: "鐵製頭盔",   slot: "helmet",   rarity: "COMMON",    description: "普通鐵礦製成，能防禦基本攻擊。",   statLabel: "HP +10",   svgColor: "#9ca3af", accentColor: "#6b7280", emoji: "⛑️" },
  "knight-helm":    { name: "騎士頭盔",   slot: "helmet",   rarity: "RARE",      description: "精煉鋼製成，彰顯騎士榮耀。",         statLabel: "HP +25",   svgColor: "#6b7280", accentColor: "#3b82f6", emoji: "🪖" },
  "wizard-hat":     { name: "法師帽",     slot: "helmet",   rarity: "UNCOMMON",  description: "蘊含古老魔力的尖頂帽。",             statLabel: "XP +20%",  svgColor: "#7c3aed", accentColor: "#a855f7", emoji: "🎩" },
  "crown":          { name: "黃金王冠",   slot: "helmet",   rarity: "LEGENDARY", description: "傳說中的王者之冠，統馭萬物。",       statLabel: "HP +50",   svgColor: "#fbbf24", accentColor: "#f59e0b", emoji: "👑" },
  "feather-cap":    { name: "羽毛便帽",   slot: "helmet",   rarity: "COMMON",    description: "輕巧的旅人帽，帶來好運。",           statLabel: "COIN +5",  svgColor: "#86efac", accentColor: "#22c55e", emoji: "🎭" },

  // ── Armor 身甲 ──
  "leather-armor":  { name: "皮革盔甲",   slot: "armor",    rarity: "COMMON",    description: "基礎皮革製成，輕便耐用。",           statLabel: "HP +15",   svgColor: "#92400e", accentColor: "#b45309", emoji: "🧥" },
  "iron-armor":     { name: "鐵甲",       slot: "armor",    rarity: "UNCOMMON",  description: "鍛造而成的鐵製護甲，防禦優秀。",     statLabel: "HP +30",   svgColor: "#9ca3af", accentColor: "#6b7280", emoji: "🛡️" },
  "wizard-robe":    { name: "法師長袍",   slot: "armor",    rarity: "UNCOMMON",  description: "魔法纖維編織，提升施法效率。",       statLabel: "XP +15%",  svgColor: "#4c1d95", accentColor: "#7c3aed", emoji: "🔮" },
  "healer-robe":    { name: "治癒聖袍",   slot: "armor",    rarity: "RARE",      description: "神聖之力織入其中，守護同伴。",       statLabel: "HP +20",   svgColor: "#166534", accentColor: "#22c55e", emoji: "💚" },
  "golden-armor":   { name: "黃金護甲",   slot: "armor",    rarity: "EPIC",      description: "純金打造，神聖而堅不可摧。",         statLabel: "HP +50",   svgColor: "#fbbf24", accentColor: "#f59e0b", emoji: "⚜️" },

  // ── Pants 褲子 ──
  "leather-pants":  { name: "皮革長褲",   slot: "pants",    rarity: "COMMON",    description: "舒適耐穿的旅人長褲。",               statLabel: "HP +8",    svgColor: "#92400e", accentColor: "#b45309", emoji: "👖" },
  "iron-greaves":   { name: "鐵製護腿",   slot: "pants",    rarity: "UNCOMMON",  description: "沉重卻堅固的金屬護腿。",             statLabel: "HP +20",   svgColor: "#9ca3af", accentColor: "#6b7280", emoji: "🦺" },
  "magic-trousers": { name: "魔法長褲",   slot: "pants",    rarity: "RARE",      description: "蘊含移動之力，提升敏捷度。",         statLabel: "XP +15%",  svgColor: "#4c1d95", accentColor: "#7c3aed", emoji: "✨" },
  "dragon-leggings":{ name: "龍鱗護腿",   slot: "pants",    rarity: "EPIC",      description: "以龍鱗鍛造，防禦力無與倫比。",       statLabel: "HP +40",   svgColor: "#7c3aed", accentColor: "#fbbf24", emoji: "🐉" },

  // ── Guardian 守護靈 ──
  "forest-sprite":  { name: "森林精靈",   slot: "guardian", rarity: "UNCOMMON",  description: "森林守護精靈，治療並保護主人。",     statLabel: "HP +15",   svgColor: "#22c55e", accentColor: "#86efac", emoji: "🧚" },
  "fire-spirit":    { name: "火焰靈",     slot: "guardian", rarity: "RARE",      description: "熾熱的火焰守護靈，燃燒敵人。",       statLabel: "XP +20%",  svgColor: "#ef4444", accentColor: "#fbbf24", emoji: "🔥" },
  "ice-wraith":     { name: "冰霜幽靈",   slot: "guardian", rarity: "EPIC",      description: "寒冰之靈，凍結並保護你的靈魂。",     statLabel: "HP +35",   svgColor: "#7dd3fc", accentColor: "#38bdf8", emoji: "❄️" },
  "golden-angel":   { name: "黃金天使",   slot: "guardian", rarity: "LEGENDARY", description: "傳說中的神聖守護者，無敵的存在。",   statLabel: "HP +60",   svgColor: "#fbbf24", accentColor: "#fffbeb", emoji: "👼" },
  // Legacy cape items mapped to guardian
  "red-cape":       { name: "赤焰披風",   slot: "guardian", rarity: "COMMON",    description: "鮮紅色的英雄披風，展現鬥志。",       statLabel: "HP +5",    svgColor: "#dc2626", accentColor: "#ef4444", emoji: "🟥" },
  "blue-cape":      { name: "藍月披風",   slot: "guardian", rarity: "UNCOMMON",  description: "深海藍色，抵禦寒風與魔法。",         statLabel: "XP +10%",  svgColor: "#1d4ed8", accentColor: "#3b82f6", emoji: "🟦" },
  "golden-cape":    { name: "黃金戰袍",   slot: "guardian", rarity: "EPIC",      description: "閃耀金光的榮耀戰袍。",               statLabel: "COIN +15", svgColor: "#b45309", accentColor: "#fbbf24", emoji: "🟨" },

  // ── Boots 鞋子 ──
  "leather-boots":  { name: "皮革靴",     slot: "boots",    rarity: "COMMON",    description: "普通旅人靴，舒適耐穿。",             statLabel: "XP +5%",   svgColor: "#92400e", accentColor: "#b45309", emoji: "👢" },
  "iron-boots":     { name: "鐵靴",       slot: "boots",    rarity: "UNCOMMON",  description: "沉重但堅固的鐵製靴子。",             statLabel: "HP +15",   svgColor: "#9ca3af", accentColor: "#6b7280", emoji: "🥾" },
  "speed-boots":    { name: "疾風靴",     slot: "boots",    rarity: "RARE",      description: "注入風系魔法，大幅提升敏捷。",       statLabel: "XP +20%",  svgColor: "#7dd3fc", accentColor: "#38bdf8", emoji: "⚡" },
  "golden-boots":   { name: "黃金戰靴",   slot: "boots",    rarity: "EPIC",      description: "純金打造的神聖戰靴。",               statLabel: "HP +30",   svgColor: "#fbbf24", accentColor: "#f59e0b", emoji: "✨" },

  // ── Pet 寵物 ──
  "cat":    { name: "小貓",   slot: "pet", rarity: "COMMON",    description: "可愛的貓咪，帶來治癒的力量。",       statLabel: "HP +5",    svgColor: "#f97316", accentColor: "#fb923c", emoji: "🐱" },
  "dog":    { name: "忠犬",   slot: "pet", rarity: "COMMON",    description: "忠誠的狗狗，守護你的安全。",         statLabel: "HP +8",    svgColor: "#92400e", accentColor: "#b45309", emoji: "🐕" },
  "owl":    { name: "智慧梟", slot: "pet", rarity: "UNCOMMON",  description: "博學的貓頭鷹，提升知識獲取效率。",   statLabel: "XP +10%",  svgColor: "#6b7280", accentColor: "#9ca3af", emoji: "🦉" },
  "dragon": { name: "幼龍",   slot: "pet", rarity: "EPIC",      description: "傳說中的龍族幼崽，無比強大的同伴。", statLabel: "XP +25%",  svgColor: "#7c3aed", accentColor: "#a855f7", emoji: "🐉" },
  "ghost":  { name: "幽靈精", slot: "pet", rarity: "RARE",      description: "神秘的幽靈夥伴，穿越時空相伴。",     statLabel: "XP +15%",  svgColor: "#94a3b8", accentColor: "#cbd5e1", emoji: "👻" },

  // ── Off-hand 左手 ──
  "wooden-shield":  { name: "木製盾牌",   slot: "offhand",  rarity: "COMMON",    description: "簡樸的木盾，在你的左邊提供保護。",   statLabel: "HP +15",   svgColor: "#92400e", accentColor: "#b45309", emoji: "🛡️" },
  "iron-shield":    { name: "鐵盾",       slot: "offhand",  rarity: "UNCOMMON",  description: "鍛造鐵盾，更高的防禦力。",           statLabel: "HP +25",   svgColor: "#9ca3af", accentColor: "#6b7280", emoji: "🛡️" },
  "spell-tome":     { name: "魔法典籍",   slot: "offhand",  rarity: "RARE",      description: "記載古老咒文的神秘典籍。",           statLabel: "XP +30%",  svgColor: "#7c3aed", accentColor: "#a855f7", emoji: "📖" },
  "holy-shield":    { name: "聖光盾",     slot: "offhand",  rarity: "EPIC",      description: "神聖之力鑄就的不滅盾牌。",           statLabel: "HP +40",   svgColor: "#fef08a", accentColor: "#fbbf24", emoji: "✨" },

  // ── Weapons 右手 ──
  "dagger":         { name: "短劍",       slot: "weapon",   rarity: "COMMON",    description: "輕巧的刺擊武器，快速而致命。",       statLabel: "XP +10%",  svgColor: "#6b7280", accentColor: "#9ca3af", emoji: "🗡️" },
  "sword":          { name: "長劍",       slot: "weapon",   rarity: "UNCOMMON",  description: "鍛造精良的戰士之劍。",               statLabel: "HP +10",   svgColor: "#d1d5db", accentColor: "#9ca3af", emoji: "⚔️" },
  "axe":            { name: "戰斧",       slot: "weapon",   rarity: "UNCOMMON",  description: "沉重的斧頭，一擊必殺。",             statLabel: "HP +20",   svgColor: "#92400e", accentColor: "#b45309", emoji: "🪓" },
  "staff":          { name: "法杖",       slot: "weapon",   rarity: "RARE",      description: "蘊含元素之力的神聖法杖。",           statLabel: "XP +25%",  svgColor: "#7c3aed", accentColor: "#a855f7", emoji: "🪄" },
  "wand":           { name: "魔杖",       slot: "weapon",   rarity: "UNCOMMON",  description: "施展咒語的魔法棒。",                 statLabel: "XP +15%",  svgColor: "#3b82f6", accentColor: "#60a5fa", emoji: "✨" },
  "bow":            { name: "獵弓",       slot: "weapon",   rarity: "RARE",      description: "精準的遠端武器，百發百中。",         statLabel: "XP +20%",  svgColor: "#92400e", accentColor: "#b45309", emoji: "🏹" },
  "holy-staff":     { name: "聖光法杖",   slot: "weapon",   rarity: "EPIC",      description: "聖者持有的至高法杖。",               statLabel: "HP +30",   svgColor: "#fef08a", accentColor: "#fbbf24", emoji: "☀️" },

  // ── Earring 1 耳環左 ──
  "ruby-stud":      { name: "紅寶石耳釘", slot: "earring1", rarity: "RARE",      description: "左耳鑲嵌紅寶石，凝聚火焰之力。",     statLabel: "HP +15",   svgColor: "#dc2626", accentColor: "#f87171", emoji: "🔴" },
  "sapphire-drop":  { name: "藍寶石耳墜", slot: "earring1", rarity: "RARE",      description: "左耳的深藍寶石，增強魔力。",         statLabel: "XP +15%",  svgColor: "#1d4ed8", accentColor: "#60a5fa", emoji: "💙" },
  "emerald-loop":   { name: "翡翠耳環",   slot: "earring1", rarity: "UNCOMMON",  description: "翠綠色的自然之環。",                 statLabel: "HP +10",   svgColor: "#15803d", accentColor: "#4ade80", emoji: "💚" },
  "golden-ring-l":  { name: "黃金耳環",   slot: "earring1", rarity: "EPIC",      description: "純金鑄造，散發神聖光輝。",           statLabel: "COIN +20", svgColor: "#fbbf24", accentColor: "#f59e0b", emoji: "✨" },

  // ── Earring 2 耳環右 ──
  "amethyst-stud":  { name: "紫晶耳釘",   slot: "earring2", rarity: "RARE",      description: "右耳紫水晶，增強精神力量。",         statLabel: "XP +18%",  svgColor: "#7c3aed", accentColor: "#a855f7", emoji: "🟣" },
  "pearl-drop":     { name: "珍珠耳墜",   slot: "earring2", rarity: "UNCOMMON",  description: "右耳珍珠，帶來平靜與智慧。",         statLabel: "XP +10%",  svgColor: "#f0fdf4", accentColor: "#d1d5db", emoji: "⚪" },
  "topaz-loop":     { name: "黃玉耳環",   slot: "earring2", rarity: "UNCOMMON",  description: "明亮的黃玉，增加金幣獲得。",         statLabel: "COIN +12", svgColor: "#fbbf24", accentColor: "#f59e0b", emoji: "🟡" },
  "diamond-stud":   { name: "鑽石耳釘",   slot: "earring2", rarity: "LEGENDARY", description: "傳說級鑽石，無與倫比的力量。",       statLabel: "HP +40",   svgColor: "#e0f2fe", accentColor: "#bae6fd", emoji: "💎" },

  // Legacy accessory items mapped to earring1
  "ruby-amulet":    { name: "紅寶石項鍊", slot: "earring1", rarity: "RARE",      description: "鑲嵌紅寶石的神聖項鍊。",             statLabel: "HP +20",   svgColor: "#dc2626", accentColor: "#f87171", emoji: "🔴" },
  "sapphire-ring":  { name: "藍寶石戒指", slot: "earring1", rarity: "RARE",      description: "魔力環繞的藍寶石戒指。",             statLabel: "XP +20%",  svgColor: "#1d4ed8", accentColor: "#60a5fa", emoji: "💎" },
  "charm":          { name: "幸運符咒",   slot: "earring1", rarity: "UNCOMMON",  description: "帶來好運的神秘符咒，增加金幣收益。", statLabel: "COIN +10", svgColor: "#fbbf24", accentColor: "#f59e0b", emoji: "🍀" },
  "emerald-amulet": { name: "翡翠護符",   slot: "earring1", rarity: "EPIC",      description: "自然之力灌注的翡翠護符。",           statLabel: "HP +35",   svgColor: "#15803d", accentColor: "#4ade80", emoji: "💚" },
  // Legacy pants items reference
  "green-cape":     { name: "翠葉披風",   slot: "guardian", rarity: "UNCOMMON",  description: "森林守護者的綠色斗篷。",             statLabel: "HP +10",   svgColor: "#166534", accentColor: "#22c55e", emoji: "🟩" },
}

// Rarity colours
export const RARITY_COLORS: Record<string, string> = {
  COMMON:    "#9ca3af",
  UNCOMMON:  "#4ade80",
  RARE:      "#60a5fa",
  EPIC:      "#c084fc",
  LEGENDARY: "#fbbf24",
}

// ─── Class Config ─────────────────────────────────────────────────────────────

const CLASS_CONFIG = {
  WARRIOR: { primary: "#dc2626", secondary: "#ea580c", bodyColor: "#ef4444", outline: "#7f1d1d", skinColor: "#fde7c0", hairColor: "#92400e", clothColor: "#dc2626" },
  MAGE:    { primary: "#7c3aed", secondary: "#2563eb", bodyColor: "#a855f7", outline: "#4c1d95", skinColor: "#fde7c0", hairColor: "#1e3a8a", clothColor: "#7c3aed" },
  HEALER:  { primary: "#16a34a", secondary: "#14b8a6", bodyColor: "#4ade80", outline: "#14532d", skinColor: "#fde7c0", hairColor: "#166534", clothColor: "#16a34a" },
}

// ─── CharacterAvatar ──────────────────────────────────────────────────────────

interface CharacterAvatarProps {
  characterClass?: "WARRIOR" | "MAGE" | "HEALER"
  equipment?: CharacterEquipment
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl"
  showAnimation?: boolean
  level?: number
}

export function CharacterAvatar({
  characterClass = "WARRIOR",
  equipment = {},
  size = "md",
  showAnimation = false,
  level = 1,
}: CharacterAvatarProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const cfg = CLASS_CONFIG[characterClass]

  const sizeMap = { sm: 64, md: 96, lg: 128, xl: 192, "2xl": 256, "3xl": 320 }
  const px = sizeMap[size]

  const eq = equipment

  // Resolve legacy aliases
  const guardianKey = eq.guardian || eq.cape
  const earring1Key = eq.earring1 || eq.accessory

  const helmetDef   = eq.helmet    ? EQUIPMENT_REGISTRY[eq.helmet]    : null
  const armorDef    = eq.armor     ? EQUIPMENT_REGISTRY[eq.armor]     : null
  const pantsDef    = eq.pants     ? EQUIPMENT_REGISTRY[eq.pants]     : null
  const guardianDef = guardianKey  ? EQUIPMENT_REGISTRY[guardianKey]  : null
  const bootsDef    = eq.boots     ? EQUIPMENT_REGISTRY[eq.boots]     : null
  const petDef      = eq.pet       ? EQUIPMENT_REGISTRY[eq.pet]       : null
  const offhandDef  = eq.offhand   ? EQUIPMENT_REGISTRY[eq.offhand]   : null
  const weaponDef   = eq.weapon    ? EQUIPMENT_REGISTRY[eq.weapon]    : null
  const earring1Def = earring1Key  ? EQUIPMENT_REGISTRY[earring1Key]  : null
  const earring2Def = eq.earring2  ? EQUIPMENT_REGISTRY[eq.earring2]  : null

  const triggerAnim = () => {
    if (showAnimation) { setIsAnimating(true); setTimeout(() => setIsAnimating(false), 600) }
  }

  // ── Nano Banana Q-style proportions ──
  // ViewBox: 100 × 120
  // Head: big circle cx=50 cy=28 r=22 (head occupies ~37% of height)
  // Body: rounded rect x=22 y=46 w=56 h=36 rx=12 (chubby torso)
  // Legs: two rounded rects below body
  // Arms: stubby rounded rects on sides

  return (
    <motion.div
      className="relative flex-shrink-0 cursor-pointer select-none"
      style={{ width: px, height: px }}
      onClick={triggerAnim}
      animate={isAnimating ? { scale: [1, 1.1, 0.95, 1.05, 1] } : {}}
      transition={{ duration: 0.5 }}
    >
      <svg viewBox="0 0 100 120" className="w-full h-full" style={{ imageRendering: "auto", overflow: "visible" }}>
        <defs>
          <filter id="nb-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="nb-shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="2.5" floodColor="#000" floodOpacity="0.35" />
          </filter>
          <filter id="nb-glow-gold">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="skin-grad" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor={cfg.skinColor} />
          </radialGradient>
          <radialGradient id="body-grad" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor={armorDef ? armorDef.svgColor : cfg.bodyColor} stopOpacity="1" />
            <stop offset="100%" stopColor={armorDef ? armorDef.accentColor : cfg.outline} stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* ── Ground shadow ── */}
        <ellipse cx="50" cy="117" rx="28" ry="4" fill="#000" opacity="0.2" />

        {/* ── Layer 0: Guardian (behind character, floating above head) ── */}
        {guardianDef && (
          <motion.g
            animate={{ y: [-3, 3, -3], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ filter: "url(#nb-glow)" }}
          >
            {/* Guardian halo ring */}
            <ellipse cx="50" cy="4" rx="14" ry="3.5"
              fill="none" stroke={guardianDef.svgColor} strokeWidth="1.5" opacity="0.7" />
            {/* Guardian spirit body */}
            <circle cx="50" cy="2" r="5"
              fill={guardianDef.svgColor} opacity="0.9"
              stroke={guardianDef.accentColor} strokeWidth="0.8" />
            {/* Guardian face */}
            <circle cx="48.5" cy="1.5" r="0.8" fill="#fff" opacity="0.9" />
            <circle cx="51.5" cy="1.5" r="0.8" fill="#fff" opacity="0.9" />
            {/* Guardian glow sparkles */}
            <circle cx="42" cy="5" r="1" fill={guardianDef.accentColor} opacity="0.8" />
            <circle cx="58" cy="3" r="0.8" fill={guardianDef.accentColor} opacity="0.6" />
            <circle cx="46" cy="-1" r="0.6" fill={guardianDef.accentColor} opacity="0.7" />
          </motion.g>
        )}

        {/* ── Layer 1: Left arm (behind body) ── */}
        <rect x="8" y="48" width="16" height="24" rx="8"
          fill="url(#skin-grad)" stroke={cfg.outline} strokeWidth="1.2" />
        {/* Left arm highlight */}
        <rect x="10" y="50" width="5" height="10" rx="3"
          fill="#fff" opacity="0.15" />

        {/* ── Layer 1b: Off-hand (left) ── */}
        {offhandDef && (
          <g style={{ filter: "url(#nb-shadow)" }}>
            <path
              d="M 2 52 Q 2 44 9 42 Q 16 44 16 52 L 16 66 Q 16 72 9 75 Q 2 72 2 66 Z"
              fill={offhandDef.svgColor}
              stroke={offhandDef.accentColor}
              strokeWidth="1.2"
            />
            {/* Shield boss */}
            <circle cx="9" cy="59" r="3.5" fill={offhandDef.accentColor} />
            <line x1="9" y1="47" x2="9" y2="71" stroke={offhandDef.accentColor} strokeWidth="0.8" opacity="0.5" />
            <line x1="3" y1="59" x2="15" y2="59" stroke={offhandDef.accentColor} strokeWidth="0.8" opacity="0.5" />
          </g>
        )}

        {/* ── Layer 2: Legs ── */}
        {/* Left leg */}
        <rect x="27" y="78" width="18" height="26" rx="9"
          fill={pantsDef ? pantsDef.svgColor : cfg.skinColor}
          stroke={pantsDef ? pantsDef.accentColor : cfg.outline}
          strokeWidth="1.2" />
        {/* Right leg */}
        <rect x="55" y="78" width="18" height="26" rx="9"
          fill={pantsDef ? pantsDef.svgColor : cfg.skinColor}
          stroke={pantsDef ? pantsDef.accentColor : cfg.outline}
          strokeWidth="1.2" />
        {/* Pants highlight */}
        {pantsDef && (
          <>
            <rect x="29" y="80" width="6" height="12" rx="4" fill="#fff" opacity="0.15" />
            <rect x="57" y="80" width="6" height="12" rx="4" fill="#fff" opacity="0.15" />
          </>
        )}

        {/* ── Layer 2b: Boots ── */}
        {bootsDef ? (
          <>
            <rect x="24" y="96" width="22" height="10" rx="5"
              fill={bootsDef.svgColor} stroke={bootsDef.accentColor} strokeWidth="1.2" />
            <rect x="54" y="96" width="22" height="10" rx="5"
              fill={bootsDef.svgColor} stroke={bootsDef.accentColor} strokeWidth="1.2" />
            {/* Boot highlight */}
            <rect x="26" y="98" width="8" height="4" rx="2" fill="#fff" opacity="0.2" />
            <rect x="56" y="98" width="8" height="4" rx="2" fill="#fff" opacity="0.2" />
          </>
        ) : (
          <>
            <rect x="27" y="99" width="18" height="6" rx="4" fill="#78350f" />
            <rect x="55" y="99" width="18" height="6" rx="4" fill="#78350f" />
          </>
        )}

        {/* ── Layer 3: Body / Armor ── */}
        <rect x="20" y="46" width="60" height="36" rx="14"
          fill="url(#body-grad)"
          stroke={armorDef ? armorDef.accentColor : cfg.outline}
          strokeWidth="1.5" />
        {/* Body highlight */}
        <rect x="28" y="50" width="20" height="10" rx="6"
          fill="#fff" opacity="0.12" />
        {/* Armor detail lines */}
        {armorDef && (
          <g opacity="0.5">
            <line x1="38" y1="50" x2="38" y2="80" stroke={armorDef.accentColor} strokeWidth="0.8" />
            <line x1="62" y1="50" x2="62" y2="80" stroke={armorDef.accentColor} strokeWidth="0.8" />
            <line x1="20" y1="63" x2="80" y2="63" stroke={armorDef.accentColor} strokeWidth="0.6" />
          </g>
        )}
        {/* Class emblem on chest */}
        <text x="50" y="68" textAnchor="middle" fontSize="13" style={{ userSelect: "none" }}>
          {characterClass === "WARRIOR" ? "⚔" : characterClass === "MAGE" ? "✦" : "✚"}
        </text>

        {/* ── Layer 3b: Belt ── */}
        <rect x="20" y="77" width="60" height="7" rx="2" fill="#78350f" opacity="0.8" />
        <rect x="44" y="76" width="12" height="9" rx="2" fill="#fbbf24" />
        {/* Belt buckle detail */}
        <rect x="47" y="78" width="6" height="5" rx="1" fill="#92400e" />

        {/* ── Layer 4: Right arm (in front of body) ── */}
        <rect x="76" y="48" width="16" height="24" rx="8"
          fill="url(#skin-grad)" stroke={cfg.outline} strokeWidth="1.2" />
        <rect x="78" y="50" width="5" height="10" rx="3"
          fill="#fff" opacity="0.15" />

        {/* ── Layer 4b: Weapon (right hand) ── */}
        {weaponDef && (
          <motion.g
            animate={isAnimating ? { rotate: [-10, 10, -5] } : {}}
            transition={{ duration: 0.4 }}
            style={{ transformOrigin: "88px 50px", filter: "url(#nb-shadow)" }}
          >
            {["bow", "wand", "staff", "holy-staff"].includes(eq.weapon ?? "") ? (
              /* Staff / wand — vertical */
              <>
                <rect x="87" y="14" width="3.5" height="38" rx="1.5" fill={weaponDef.svgColor} />
                <circle cx="88.5" cy="12" r="5.5"
                  fill={weaponDef.svgColor} stroke={weaponDef.accentColor} strokeWidth="1.2" />
                {/* Staff glow */}
                <circle cx="88.5" cy="12" r="3"
                  fill={weaponDef.accentColor} opacity="0.8" />
              </>
            ) : (
              /* Sword / axe / dagger */
              <>
                <rect x="87" y="52" width="3" height="12" rx="1" fill="#78350f" />
                <rect x="83" y="52" width="11" height="3.5" rx="1.5" fill={weaponDef.accentColor} />
                <path
                  d="M 86 18 L 92 36 L 91 52 L 85 52 L 84 36 Z"
                  fill={weaponDef.svgColor}
                  stroke={weaponDef.accentColor}
                  strokeWidth="0.8"
                />
              </>
            )}
          </motion.g>
        )}

        {/* ── Layer 5: Head (Nano Banana big round head) ── */}
        {/* Head base — big & round */}
        <circle cx="50" cy="28" r="22"
          fill="url(#skin-grad)"
          stroke={cfg.outline} strokeWidth="1.5"
          style={{ filter: "url(#nb-shadow)" }} />
        {/* Head highlight */}
        <ellipse cx="43" cy="20" rx="8" ry="6"
          fill="#fff" opacity="0.18" />

        {/* Cheeks */}
        <circle cx="33" cy="32" r="5" fill="#fca5a5" opacity="0.4" />
        <circle cx="67" cy="32" r="5" fill="#fca5a5" opacity="0.4" />

        {/* Eyes — big cute eyes */}
        <circle cx="42" cy="26" r="5" fill="#1c1917" />
        <circle cx="58" cy="26" r="5" fill="#1c1917" />
        {/* Eye shine */}
        <circle cx="43.5" cy="24" r="2" fill="#fff" opacity="0.9" />
        <circle cx="59.5" cy="24" r="2" fill="#fff" opacity="0.9" />
        <circle cx="46" cy="27.5" r="1" fill="#fff" opacity="0.5" />
        <circle cx="62" cy="27.5" r="1" fill="#fff" opacity="0.5" />

        {/* Nose */}
        <path d="M 48 30 Q 50 33 52 30" stroke={cfg.outline} strokeWidth="1" fill="none" strokeLinecap="round" />

        {/* Mouth — cute smile */}
        <path d="M 42 36 Q 50 42 58 36" stroke="#1c1917" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Hair */}
        {!helmetDef && (
          <g>
            {/* Hair base */}
            <path
              d={`M 28 22 Q 28 4 50 3 Q 72 4 72 22 Q 68 10 50 8 Q 32 10 28 22 Z`}
              fill={cfg.hairColor} opacity="0.95"
            />
            {/* Hair side tufts */}
            <path d="M 28 20 Q 24 16 26 10 Q 30 8 32 14 Z" fill={cfg.hairColor} />
            <path d="M 72 20 Q 76 16 74 10 Q 70 8 68 14 Z" fill={cfg.hairColor} />
          </g>
        )}

        {/* ── Layer 6: Helmet ── */}
        {helmetDef && (
          <g style={{ filter: "url(#nb-shadow)", transition: "opacity 0.3s" }}>
            {eq.helmet === "crown" ? (
              <>
                <path d="M 32 20 L 32 8 L 40 15 L 50 5 L 60 15 L 68 8 L 68 20 Z"
                  fill={helmetDef.svgColor} stroke={helmetDef.accentColor} strokeWidth="1.2" />
                <rect x="32" y="18" width="36" height="6" rx="2"
                  fill={helmetDef.svgColor} stroke={helmetDef.accentColor} strokeWidth="0.8" />
                <circle cx="50" cy="8" r="3" fill="#dc2626" />
                <circle cx="36" cy="13" r="2" fill="#fbbf24" opacity="0.8" />
                <circle cx="64" cy="13" r="2" fill="#fbbf24" opacity="0.8" />
              </>
            ) : eq.helmet === "wizard-hat" ? (
              <>
                <path d="M 50 2 L 62 22 L 38 22 Z"
                  fill={helmetDef.svgColor} stroke={helmetDef.accentColor} strokeWidth="1.2" />
                <ellipse cx="50" cy="22" rx="16" ry="4"
                  fill={helmetDef.svgColor} stroke={helmetDef.accentColor} strokeWidth="1.2" />
                <path d="M 46 14 Q 50 10 54 14" stroke={helmetDef.accentColor} strokeWidth="1" fill="none" />
              </>
            ) : (
              <>
                <path d="M 28 26 Q 28 4 50 3 Q 72 4 72 26 L 72 32 L 28 32 Z"
                  fill={helmetDef.svgColor} stroke={helmetDef.accentColor} strokeWidth="1.5" />
                {/* Visor slit */}
                <rect x="33" y="24" width="34" height="4" rx="2"
                  fill={helmetDef.accentColor} opacity="0.6" />
                {/* Crest */}
                <rect x="46" y="1" width="8" height="8" rx="2" fill={helmetDef.accentColor} />
                {/* Helmet highlight */}
                <rect x="35" y="8" width="14" height="8" rx="4" fill="#fff" opacity="0.15" />
              </>
            )}
          </g>
        )}

        {/* ── Layer 7: Earrings ── */}
        {earring1Def && (
          <motion.g
            animate={{ rotate: [-5, 5, -5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "27px 28px" }}
          >
            {/* Left earring */}
            <circle cx="27" cy="28" r="3.5"
              fill={earring1Def.svgColor}
              stroke={earring1Def.accentColor} strokeWidth="1"
              style={{ filter: "url(#nb-glow)" }} />
            <circle cx="27" cy="33" r="2"
              fill={earring1Def.accentColor} opacity="0.9" />
            <line x1="27" y1="30" x2="27" y2="33" stroke={earring1Def.accentColor} strokeWidth="1" />
          </motion.g>
        )}
        {earring2Def && (
          <motion.g
            animate={{ rotate: [5, -5, 5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "73px 28px" }}
          >
            {/* Right earring */}
            <circle cx="73" cy="28" r="3.5"
              fill={earring2Def.svgColor}
              stroke={earring2Def.accentColor} strokeWidth="1"
              style={{ filter: "url(#nb-glow)" }} />
            <circle cx="73" cy="33" r="2"
              fill={earring2Def.accentColor} opacity="0.9" />
            <line x1="73" y1="30" x2="73" y2="33" stroke={earring2Def.accentColor} strokeWidth="1" />
          </motion.g>
        )}

        {/* ── Layer 8: Pet (floating right side) ── */}
        {petDef && (
          <motion.text
            x="76" y="48"
            fontSize="18"
            animate={{ y: [48, 43, 48] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ userSelect: "none", filter: "url(#nb-shadow)" }}
          >
            {petDef.emoji}
          </motion.text>
        )}

      </svg>

      {/* Level badge */}
      <div
        className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center font-black text-xs"
        style={{
          width: Math.max(20, px * 0.15),
          height: Math.max(20, px * 0.15),
          fontSize: Math.max(9, px * 0.09),
          backgroundColor: cfg.primary,
          color: "#fff",
          border: `2px solid ${cfg.outline}`,
          boxShadow: `0 0 8px ${cfg.primary}80`,
        }}
      >
        {level}
      </div>
    </motion.div>
  )
}

// ─── EquipmentSelector (legacy helper) ───────────────────────────────────────

interface EquipmentSelectorProps {
  type: EquipmentSlot
  selected: string | null
  onSelect: (value: string) => void
  availableItems: string[]
}

export function EquipmentSelector({ type, selected, onSelect, availableItems }: EquipmentSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-white/40 uppercase tracking-widest">{type}</label>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onSelect("")}
          className={`px-3 py-1.5 rounded-lg border text-xs transition ${!selected ? "border-[#CA8A04]/60 bg-[#CA8A04]/10 text-[#CA8A04]" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"}`}>
          無
        </button>
        {availableItems.map(item => {
          const def = EQUIPMENT_REGISTRY[item]
          return (
            <button key={item} type="button" onClick={() => onSelect(item)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition ${selected === item ? "border-[#CA8A04]/60 bg-[#CA8A04]/10 text-[#CA8A04]" : "border-white/10 bg-white/5 text-white/40 hover:border-white/20"}`}>
              {def?.emoji} {def?.name || item}
            </button>
          )
        })}
      </div>
    </div>
  )
}