import { NextResponse } from "next/server"

import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// AI 任務生成提示詞
const TASK_GENERATION_PROMPT = `你是一位專業的國中/高中教師，擅長設計有趣的學習任務。

請根據以下資訊生成一個作業任務：

科目：{subject}
難度：{difficulty}
類型：{type}

任務要求：
- 任務標題（簡短有趣）
- 任務描述（學習目標說明）
- 獎勵設定（XP: 50-100, 金幣: 20-50）

請以 JSON 格式回覆：
{{
  "title": "任務標題",
  "description": "任務描述",
  "xpReward": 數字,
  "coinReward": 數字,
  "isRequired": false
}}

注意：
- 標題要有趣，像是遊戲任務
- 描述要清楚說明學習目標
- 獎勵要合理（不要太高或太低）`

export async function POST(request: Request) {
  const session = await getServerAuthSession()

  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "權限不足" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { subject, difficulty = "MEDIUM", type = "ASSIGNMENT" } = body

    if (!subject) {
      return NextResponse.json({ error: "請提供科目" }, { status: 400 })
    }

    // 檢查 API Key
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
    if (!apiKey) {
      return NextResponse.json({ error: "AI 服務未設定" }, { status: 500 })
    }

    // 構建 prompt
    const prompt = TASK_GENERATION_PROMPT
      .replace("{subject}", subject)
      .replace("{difficulty}", difficulty)
      .replace("{type}", type)

    // 調用 Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 512,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("AI API Error:", error)
      return NextResponse.json({ error: "AI 生成失敗" }, { status: 500 })
    }

    const data = await response.json()
    const aiResponse = data.content?.[0]?.text

    if (!aiResponse) {
      return NextResponse.json({ error: "AI 回應格式錯誤" }, { status: 500 })
    }

    // 解析 JSON 回應
    let taskResult
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        taskResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found")
      }
    } catch (e) {
      console.error("Failed to parse AI response:", aiResponse)
      return NextResponse.json({ error: "AI 回應解析失敗" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      task: taskResult,
    })

  } catch (error) {
    console.error("AI task generation error:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}
