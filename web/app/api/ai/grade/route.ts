import { NextResponse } from "next/server"

import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// AI 評分提示詞
const GRADING_PROMPT = `你是一位嚴格的作業評分老師。請根據以下作業內容進行評分，並提供詳細的回饋。

作業標題：{title}
作業說明：{description}
學生提交內容：{submission}

請以 JSON 格式回覆：
{{
  "score": 0-100,
  "grade": "A" | "B" | "C" | "D" | "F",
  "feedback": "詳細的回饋意見",
  "strengths": ["優點1", "優點2"],
  "improvements": ["需要改進的地方1", "需要改進的地方2"],
  "xpReward": 根據評分給予適當的 XP 獎勵 (最高 100),
  "coinReward": 根據評分給予適當的金幣獎勵 (最高 50)
}}

評分標準：
- A (90-100): 完美完成，創意佳
- B (80-89): 正確完成，少許瑕疵
- C (70-79): 基本完成，需改進
- D (60-69): 部分完成，大量需改進
- F (<60): 未完成或嚴重錯誤

請直接回覆 JSON，不要有任何其他文字。`

export async function POST(request: Request) {
  const session = await getServerAuthSession()

  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 })
  }

  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "權限不足" }, { status: 403 })
  }

  try {
    const { submissionId } = await request.json()

    // 取得提交內容
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: { course: { include: { classroom: true } } }
        },
        student: { select: { id: true, name: true, image: true, email: true } }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: "找不到提交" }, { status: 404 })
    }

    // 檢查權限
    const member = await prisma.classroomMember.findUnique({
      where: {
        classroomId_userId: {
          classroomId: submission.assignment.course.classroomId,
          userId: session.user.id
        }
      }
    })

    if (!member || member.role !== "TEACHER") {
      return NextResponse.json({ error: "權限不足" }, { status: 403 })
    }

    // 檢查 API Key
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
    if (!apiKey) {
      return NextResponse.json({ error: "AI 服務未設定" }, { status: 500 })
    }

    // 構建 prompt
    const prompt = GRADING_PROMPT
      .replace("{title}", submission.assignment.title)
      .replace("{description}", submission.assignment.description || "")
      .replace("{submission}", submission.content || "無內容")

    // 調用 Claude API
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("AI API Error:", error)
      return NextResponse.json({ error: "AI 評分失敗" }, { status: 500 })
    }

    const data = await response.json()
    const aiResponse = data.content?.[0]?.text

    if (!aiResponse) {
      return NextResponse.json({ error: "AI 回應格式錯誤" }, { status: 500 })
    }

    // 解析 JSON 回應
    let gradingResult
    try {
      // 嘗試提取 JSON（可能有額外文字）
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        gradingResult = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found")
      }
    } catch (e) {
      console.error("Failed to parse AI response:", aiResponse)
      return NextResponse.json({ error: "AI 回應解析失敗" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      grading: gradingResult,
      originalContent: submission.content
    })

  } catch (error) {
    console.error("AI grading error:", error)
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 })
  }
}