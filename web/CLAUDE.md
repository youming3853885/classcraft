# Classcraft Gamified LMS - 程式碼生成規範

## 專案概述

這是一個遊戲化學習管理系統 (LMS)，將傳統課堂學習轉化為 RPG 風格的冒險體驗。學生化身勇者完成任務升級，教師作為 GM 管理班級。

## 技術棧

| 模組 | 技術 |
|------|------|
| 主體架構 | Next.js 16 (App Router) + TypeScript |
| 介面樣式 | Tailwind CSS 4 (暗色系遊戲風格) |
| 資料庫 | Prisma + SQLite |
| 動畫 | Framer Motion |
| 認證 | NextAuth.js (Google OAuth + Credentials) |

---

## 1. 頁面路由規範

### 1.1 路由結構

```
/                           → 首頁 (Landing Page)
/login                      → 登入頁面
/register                   → 註冊頁面 (學生輸入班級代碼)
/forgot-password            → 密碼重置

/student                    → 勇者介面入口 (自動導向 dashboard)
/student/dashboard          → 勇者大廳
/student/quests             → 冒險地圖 (任務列表)
/student/quests/[questId]   → 戰鬥關卡 (作業提交頁面)
/student/inventory          → 背包與裝備庫
/student/shop               → 裝備商店
/student/team               → 隊伍與公會
/student/profile            → 個人成就

/teacher                    → GM 控制台入口 (自動導向 dashboard)
/teacher/dashboard          → GM 總覽
/teacher/classes            → 班級與英雄管理
/teacher/classes/[classId]  → 單一班級管理
/teacher/quests             → 關卡與地圖編輯器
/teacher/grading            → 戰鬥結算所 (作業批改)
/teacher/grading/[submissionId] → 批改畫面
/teacher/store-manager      → 商店與經濟控制
/teacher/analytics          → 戰況分析
```

### 1.2 命名規則

- **目錄名稱**：使用 kebab-case（如 `/student/dashboard`）
- **檔案名稱**：
  - Page 元件：`page.tsx`
  - 動態路由：`[id]/page.tsx`
  - Client 元件：`-client.tsx`（如 `game-client.tsx`）
- **元件名稱**：使用 PascalCase（如 `QuestCard.tsx`）
- **元件資料夾**：使用 kebab-case（如 `quest-card/`）

---

## 2. 元件結構規範

### 2.1 Server vs Client Component

```typescript
// Server Component - 資料獲取
// app/student/dashboard/page.tsx
import { getUserStats } from "@/lib/game"

export default async function StudentDashboard() {
  const stats = await getUserStats()

  return (
    <div>
      <CharacterStatus stats={stats} />
    </div>
  )
}

// Client Component - 互動功能
// src/components/quest-battle.tsx
"use client"

import { useState } from "react"

export function QuestBattle() {
  const [hp, setHp] = useState(100)

  return <div>...</div>
}
```

### 2.2 元件檔案結構

```
src/components/
├── ui/                      # 通用 UI 元件
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
├── game/                    # 遊戲相關元件
│   ├── character-status.tsx
│   ├── health-bar.tsx
│   ├── experience-bar.tsx
│   └── ...
├── animations/              # 動畫元件
│   ├── battle-effects.tsx
│   ├── character-animations.tsx
│   └── ui-animations.tsx
└── [feature]/               # 功能專用元件
    ├── quest-card.tsx
    └── inventory-grid.tsx
```

### 2.3 元件範本

```typescript
// src/components/game/health-bar.tsx
"use client"

import { motion } from "framer-motion"

interface HealthBarProps {
  current: number
  max: number
  show数值?: boolean
}

export function HealthBar({ current, max, show数值 = true }: HealthBarProps) {
  const percentage = (current / max) * 100

  return (
    <div className="w-full">
      <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
        <motion.div
          className="h-full bg-gradient-to-r from-red-600 to-red-400"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {show数值 && (
        <p className="text-xs text-gray-400 mt-1 text-center">
          {current} / {max} HP
        </p>
      )}
    </div>
  )
}
```

---

## 3. API 設計規範

### 3.1 API 路由結構

```
app/api/
├── auth/
│   └── [...nextauth]/route.ts    # NextAuth 處理
├── users/
│   └── stats/route.ts            # 獲取/更新用戶數據
├── classrooms/
│   ├── route.ts                  # CRUD
│   ├── [id]/route.ts
│   └── join/route.ts             # 透過邀請碼加入
├── quests/
│   ├── [id]/complete/route.ts   # 任務完成
│   └── submit/route.ts           # 作業提交
├── shop/
│   └── purchase/route.ts         # 購買裝備
├── team/
│   └── skill/route.ts            # 技能施放
└── ai/
    └── grade/route.ts            # AI 批改
```

### 3.2 API 設計模式

```typescript
// app/api/quests/submit/route.ts
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  // 1. 驗證登入
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  // 2. 權限檢查 (僅學生)
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "權限不足" }, { status: 403 })
  }

  // 3. 處理請求
  const body = await request.json()
  // ... 業務邏輯

  // 4. 回傳結果
  return NextResponse.json({ success: true, data: result })
}
```

### 3.3 錯誤處理

```typescript
// 統一錯誤回應格式
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    { error: message, code: status },
    { status }
  )
}

// 使用
return errorResponse("找不到作業", 404)
```

---

## 4. 樣式與設計系統

### 4.1 Tailwind CSS 配置

```typescript
// tailwind.config.ts (部分範例)
export default {
  theme: {
    extend: {
      colors: {
        // RPG 暗色系色盤
        game: {
          bg: {
            primary: "#0f0f1a",   // 深紫黑背景
            secondary: "#1a1a2e", // 次要背景
            card: "#16213e",     // 卡片背景
          },
          accent: {
            primary: "#e94560",  // 紅色強調 (戰鬥)
            secondary: "#0f3460", // 藍色強調 (魔法)
            gold: "#ffd700",     // 金色 (貨幣/獎勵)
          },
          hp: "#e74c3c",         // 血條紅
          xp: "#3498db",         // 經驗藍
          mp: "#9b59b6",         // 法力紫
        },
      },
      fontFamily: {
        game: ["Geist", "sans-serif"],
        heading: ["Geist", "sans-serif"],
      },
    },
  },
}
```

### 4.2 設計 tokens

```css
/* globals.css */
@theme {
  --color-game-bg-primary: #0f0f1a;
  --color-game-bg-secondary: #1a1a2e;
  --color-game-bg-card: #16213e;
  --color-game-accent-primary: #e94560;
  --color-game-accent-secondary: #0f3460;
  --color-game-accent-gold: #ffd700;
  --color-game-hp: #e74c3c;
  --color-game-xp: #3498db;
  --color-game-mp: #9b59b6;
}
```

### 4.3 常用類別

```tsx
// 背景
<div className="bg-game-bg-primary">...</div>
<div className="bg-game-bg-card">...</div>

// 文字
<p className="text-game-accent-gold">金幣</p>
<p className="text-game-hp">HP</p>
<p className="text-game-xp">XP</p>

// 邊框與分隔線
<div className="border border-game-accent-secondary">...</div>

// 陰影與光暈
<div className="shadow-lg shadow-game-accent-primary/20">...</div>
```

---

## 5. Framer Motion 動畫規範

### 5.1 通用動畫配置

```typescript
// src/lib/animations.ts
import { type Variants } from "framer-motion"

// 淡入動畫
export const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

// 彈跳動畫 (攻擊)
export const bounceAttack: Variants = {
  initial: { scale: 1 },
  attack: {
    scale: [1, 1.2, 0.9, 1.1, 1],
    transition: { duration: 0.3 },
  },
}

// 血條動畫
export const healthBarAnim = {
  initial: { width: 0 },
  animate: { width: "100%", transition: { duration: 0.5, ease: "easeOut" } },
}

// 獎勵彈出
export const rewardPop: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: [0, 1.2, 1],
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 15 },
  },
}
```

### 5.2 戰鬥特效元件

```typescript
// src/components/animations/battle-effects.tsx
"use client"

import { motion } from "framer-motion"

interface DamageTextProps {
  damage: number
  type: "crit" | "normal" | "heal"
}

export function DamageText({ damage, type }: DamageTextProps) {
  const colors = {
    crit: "text-yellow-400",
    normal: "text-red-400",
    heal: "text-green-400",
  }

  return (
    <motion.span
      initial={{ y: 0, opacity: 1 }}
      animate={{ y: -50, opacity: 0 }}
      transition={{ duration: 1 }}
      className={`text-2xl font-bold ${colors[type]}`}
    >
      {type === "heal" ? "+" : "-"}{damage}
    </motion.span>
  )
}
```

---

## 6. 資料庫操作規範

### 6.1 Prisma 使用模式

```typescript
// 使用 Singleton 避免開發環境重複連接
// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

### 6.2 資料查詢範例

```typescript
// 查詢用戶遊戲數據
const userGameData = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    wallet: true,
    badges: true,
    skills: true,
    equipment: true,
  },
})

// 班級學生列表
const students = await prisma.classroomMember.findMany({
  where: { classroomId },
  include: { user: true, team: true },
})
```

---

## 7. 權限與角色規範

### 7.1 角色類型

```typescript
// Prisma enum
enum UserRole {
  ADMIN = "ADMIN",        // 系統管理員
  TEACHER = "TEACHER",    // 教師
  ASSISTANT = "ASSISTANT", // 助教
  STUDENT = "STUDENT",    // 學生
  PARENT = "PARENT",      // 家長
}

enum CharacterClass {
  WARRIOR = "WARRIOR",    // 戰士 - 高 HP
  MAGE = "MAGE",          // 法師 - 高 MP
  HEALER = "HEALER",      // 治癒者 - 治療技能
}
```

### 7.2 權限檢查裝飾器

```typescript
// 建立權限檢查工具
async function requireRole(requiredRole: UserRole) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error("未登入")
  if (session.user.role !== requiredRole) throw new Error("權限不足")
}

// 使用
await requireRole(UserRole.TEACHER)
```

---

## 8. 檔案命名範例

| 類型 | 範例 |
|------|------|
| Page | `app/student/dashboard/page.tsx` |
| Layout | `app/student/layout.tsx` |
| API | `app/api/quests/submit/route.ts` |
| 元件 | `src/components/game/health-bar.tsx` |
| 工具函數 | `src/lib/game/calculate-xp.ts` |
| 類型 | `src/types/game.ts` |
| 常量 | `src/constants/game-config.ts` |

---

## 9. 開發流程

### 9.1 新增頁面流程

1. 建立路由目錄：`app/student/quests/[questId]/`
2. 建立 `page.tsx`（Server Component）
3. 如需互動，建立 `-client.tsx` 元件
4. 如需 API，建立 `app/api/quests/[id]/route.ts`

### 9.2 新增元件流程

1. 建立元件檔案：`src/components/game/quest-card.tsx`
2. 遵循設計系統顏色
3. 加入 Framer Motion 動畫
4. 匯出並使用

### 9.3 新增 API 流程

1. 建立路由：`app/api/feature/route.ts`
2. 實作 CRUD 方法（GET/POST/PATCH/DELETE）
3. 加入權限檢查
4. 回傳統一格式

---

## 10. 優先順序

1. **路由重構** - 建立 /student/* 和 /teacher/* 路由結構
2. **勇者介面補齊** - /student/dashboard, /student/inventory, /student/quests/*
3. **GM 控制台補齊** - /teacher/grading, /teacher/store-manager, /teacher/analytics
4. **動畫庫建立** - Framer Motion 元件庫
5. **AI 批改服務** - Claude API 整合

---

## 11. 開發行為規範

### 11.1 證據原則

**每次宣稱成功時，必須附上證據檔案鏈結。**

❌ 錯誤範例：
> 已完成登入頁面！

✅ 正確範例：
> 已完成登入頁面！檔案：[app/login/page.tsx](app/login/page.tsx)，包含 Google 登入按鈕、表單驗證、密碼重置連結。

### 11.2 自我驗證

在每個任務完成後，定期反問自己：

> **真的完成了嗎？有證據嗎？**

驗證清單：
1. 檔案是否存在？ → 列出檔案路徑
2. 程式碼是否正確？ → 說明關鍵程式碼位置
3. 功能是否可用？ → 說明如何測試
4. 是否有衝突？ → 檢查相關檔案

### 11.3 報告格式

任務完成報告必須包含：

```markdown
## 完成項目：[任務名稱]

### 證據清單
- 新增檔案：[路徑](link) - 說明
- 修改檔案：[路徑](link) - 說明
- 刪除檔案：路徑 - 說明

### 驗證方式
1. 啟動伺服器：命令
2. 測試步驟：URL 或操作
3. 預期結果：說明

### 待確認事項
- [ ] 檔案路徑正確？
- [ ] 程式碼編譯通過？
- [ ] 功能已測試？
```

### 11.4 定期反問

在以下時刻必須問自己「真的完成了嗎？」：
- 完成每個檔案編輯後
- 完成每個功能模組後
- 回覆使用者前
- 提交 commits 前