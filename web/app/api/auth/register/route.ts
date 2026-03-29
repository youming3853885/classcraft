import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;
    const classroomCode = formData.get("classroomCode") as string;
    const characterClass = formData.get("characterClass") as string;

    console.log("Register attempt:", { name, email, role, passwordLength: password?.length });

    if (!name || !email || !password) {
      return NextResponse.json({ error: "請填寫所有必填欄位" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密碼至少需要 6 碼" }, { status: 400 });
    }

    // 檢查名稱是否已被使用
    const existingName = await prisma.user.findFirst({
      where: { name },
    });

    if (existingName) {
      return NextResponse.json({ error: "此顯示名稱已被使用，請選擇其他名稱" }, { status: 400 });
    }

    // 檢查 email 是否已被使用
    const existingEmail = await prisma.user.findFirst({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json({ error: "此電子郵件已被註冊" }, { status: 400 });
    }

    // 密碼雜湊
    const hashedPassword = await bcrypt.hash(password, 10);

    // 建立用戶
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email,
        password: hashedPassword,
        role: role === "TEACHER" ? "TEACHER" : "STUDENT",
      },
    });

    // 如果是學生，加入班級（如果提供了班級代碼）
    if (role === "STUDENT" && classroomCode) {
      const classroom = await prisma.classroom.findUnique({
        where: { inviteCode: classroomCode.toUpperCase() },
      });

      if (classroom) {
        await prisma.classroomMember.create({
          data: {
            userId: user.id,
            classroomId: classroom.id,
            role: "STUDENT",
            characterClass: characterClass || "WARRIOR",
            str: characterClass === "WARRIOR" ? 14 : characterClass === "MAGE" ? 8 : 10,
            int: characterClass === "MAGE" ? 14 : characterClass === "HEALER" ? 12 : 8,
            vit: characterClass === "WARRIOR" ? 12 : characterClass === "HEALER" ? 10 : 8,
            currentHp: characterClass === "WARRIOR" ? 120 : 100,
            maxHp: characterClass === "WARRIOR" ? 120 : 100,
            currentMp: characterClass === "MAGE" ? 80 : characterClass === "HEALER" ? 60 : 40,
            maxMp: characterClass === "MAGE" ? 80 : characterClass === "HEALER" ? 60 : 40,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "帳號建立成功，請登入"
    });
  } catch (error) {
    console.error("Registration error details:", error);
    const errorMessage = error instanceof Error ? error.message : "未知錯誤";
    return NextResponse.json({ error: `建立帳號失敗: ${errorMessage}` }, { status: 500 });
  }
}