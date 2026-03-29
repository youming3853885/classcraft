import { redirect } from "next/navigation"

import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import LeaderboardPageClient from "./page-client"

interface Props {
  params: Promise<{ classroomId: string }>
}

export default async function LeaderboardPage({ params }: Props) {
  const session = await getServerAuthSession()
  if (!session?.user) redirect("/signin")

  const { classroomId } = await params

  // 確認用戶是班級成員
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  })

  if (!member) {
    redirect("/student/dashboard")
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { name: true },
  })

  return <LeaderboardPageClient classroomId={classroomId} classroomName={classroom?.name || ""} />
}