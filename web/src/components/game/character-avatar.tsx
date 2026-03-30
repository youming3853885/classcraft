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
  noFrame?: boolean
}

export function CharacterAvatar({
  characterClass = "WARRIOR",
  equipment = {},
  size = "md",
  showAnimation = false,
  level = 1,
  noFrame = false,
}: CharacterAvatarProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const cfg = CLASS_CONFIG[characterClass]

  const sizeMap = { sm: 64, md: 96, lg: 128, xl: 192, "2xl": 256, "3xl": 320 }
  const px = sizeMap[size]

  const triggerAnim = () => {
    if (showAnimation) { setIsAnimating(true); setTimeout(() => setIsAnimating(false), 600) }
  }

  // Define paths for our newly generated high quality sprites
  const avatarPath = `/avatars/${characterClass.toLowerCase()}.png`

  // Base Aura from class configuration
  const classAuraColor = cfg.bodyColor || "#fff";

  // Check Equipment for Special Overlays / Auras
  // Even though we aren't rendering the physical hat, we show its magical aura
  const eq = equipment;
  const helmetDef = eq.helmet ? EQUIPMENT_REGISTRY[eq.helmet] : null;
  const armorDef = eq.armor ? EQUIPMENT_REGISTRY[eq.armor] : null;
  const weaponDef = eq.weapon ? EQUIPMENT_REGISTRY[eq.weapon] : null;
  const guardianDef = (eq.guardian || eq.cape) ? EQUIPMENT_REGISTRY[eq.guardian || eq.cape!] : null;

  return (
    <motion.div
      className={`relative flex-shrink-0 cursor-pointer select-none ${noFrame ? "" : "rounded-[32px] overflow-hidden shadow-2xl"}`}
      style={{ 
        width: px, 
        height: px, 
        backgroundColor: noFrame ? "transparent" : "#080705", 
        border: noFrame ? "none" : `3px solid ${cfg.outline}` 
      }}
      onClick={triggerAnim}
      animate={isAnimating ? { scale: [1, 1.05, 0.98, 1.05, 1], rotate: [0, -1, 1, 0] } : {}}
      transition={{ duration: 0.5 }}
    >
      {/* ── BACKGROUND ── */}
      {/* Class base ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none z-10" />
      <div 
        className="absolute inset-[-50%] blur-3xl opacity-40 mix-blend-screen pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${classAuraColor} 0%, transparent 60%)` }}
      />
      {armorDef && (
         <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-[50%] blur-2xl opacity-60 mix-blend-screen pointer-events-none z-20"
              style={{ background: `radial-gradient(ellipse at 50% 100%, ${armorDef.accentColor} 0%, transparent 70%)` }} />
      )}

      {/* ── HIGH QUALITY AVATAR IMAGE ── */}
      {/* 
        The generated images have white backgrounds (or simple backgrounds). 
        To blend them into the dark Diablo UI, we can use `mix-blend-multiply` with a light undertone, 
        or accept the framing as a "Portrait Card". We'll use absolute positioning to fill nicely.
      */}
      <div className="absolute inset-0 z-0">
        {/* We use standard img since these are local public assets dropping in real time */}
        <img 
          src={avatarPath} 
          alt={characterClass} 
          className={`w-full h-full object-cover object-top filter contrast-150 saturate-150 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] ${noFrame ? "brightness-110" : "brightness-75 grayscale group-hover:grayscale-0 group-hover:brightness-100"} transition-all duration-300`} 
        />
        <img 
          src={avatarPath} 
          alt={characterClass + " color burn"} 
          className={`absolute inset-0 w-full h-full object-cover object-top mix-blend-color-dodge ${noFrame ? "opacity-30" : "opacity-80"}`} 
        />
      </div>

      {/* ── EQUIPMENT AURAS & EFFECTS ── */}
      {/* 1. Guardian/Cape: Adds a mystical halo/spirit glow behind */}
      {guardianDef && (
        <motion.div 
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.95, 1.05, 0.95] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-x-0 top-0 h-1/2 blur-2xl pointer-events-none z-0"
          style={{ background: `radial-gradient(circle at 50% 10%, ${guardianDef.accentColor} 0%, transparent 60%)` }}
        />
      )}

      {/* 2. Helmet/Crown: Top spotlight */}
      {helmetDef && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-10 blur-xl opacity-80 mix-blend-screen pointer-events-none z-20"
             style={{ background: `radial-gradient(ellipse at 50% 0%, ${helmetDef.svgColor} 0%, transparent 70%)` }} />
      )}

      {/* 3. Weapon: Side slash/glow */}
      {weaponDef && (
        <motion.div 
          animate={isAnimating ? { rotate: [-10, 45], opacity: [0, 1, 0] } : {}}
          className="absolute top-1/4 right-0 w-8 h-full blur-xl mix-blend-screen pointer-events-none z-20"
          style={{ background: `linear-gradient(to left, ${weaponDef.accentColor} 0%, transparent 100%)`, opacity: 0.5 }}
        />
      )}

      {/* ── VIGNETTE OVERLAY ── */}
      {!noFrame && (
        <>
          <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] pointer-events-none z-30" />
          <div className="absolute inset-0 border border-white/10 rounded-[32px] pointer-events-none z-30" />
        </>
      )}

      {/* ── ACTIVE GEAR ICONS (Miniature Display) ── */}
      <div className="absolute right-2 top-2 z-40 flex flex-col gap-1.5 opacity-80">
        {[helmetDef, armorDef, weaponDef].filter(Boolean).map((gear, idx) => (
          <div key={idx} className="w-6 h-6 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-[10px] shadow-[0_0_10px_rgba(0,0,0,1)]"
               style={{ borderLeftColor: gear!.accentColor }}>
            {gear!.emoji}
          </div>
        ))}
      </div>

      {/* Level badge */}
      {!noFrame && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md flex items-center justify-center font-black tracking-widest z-40 shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
          style={{
            padding: "2px 8px",
            backgroundColor: "#111",
            color: cfg.primary,
            border: `1px solid ${cfg.outline}`,
            fontSize: Math.max(10, px * 0.08),
          }}
        >
          L.{level}
        </div>
      )}
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