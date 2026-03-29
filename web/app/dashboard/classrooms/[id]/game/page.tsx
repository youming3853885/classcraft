import { notFound, redirect } from "next/navigation";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GameDashboardClient from "./game-client";

export default async function GameDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user) redirect("/signin");

  const { id } = await params;

  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId: id, userId: session.user.id } },
  });
  if (!member) notFound();

  const isTeacher = member.role === "TEACHER" || member.role === "ASSISTANT";

  const classroom = await prisma.classroom.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
    },
  });
  if (!classroom) notFound();

  const students = await Promise.all(
    classroom.members
      .filter((m) => m.role === "STUDENT")
      .map(async (m) => {
        const xpResult = await prisma.pointsLedger.aggregate({
          where: { targetUserId: m.userId, classroomId: id },
          _sum: { xpDelta: true },
        });
        const hpResult = await prisma.pointsLedger.aggregate({
          where: { targetUserId: m.userId, classroomId: id },
          _sum: { hpDelta: true },
        });
        const wallet = await prisma.wallet.findUnique({
          where: {
            userId_classroomId_currency: { userId: m.userId, classroomId: id, currency: "COINS" },
          },
        });

        const totalXp = classroom.initialXp + (xpResult._sum.xpDelta ?? 0);
        const totalHp = Math.min(classroom.maxHp, classroom.initialHp + (hpResult._sum.hpDelta ?? 0));
        const totalCoins = wallet?.balance ?? 0;

        return {
          id: m.userId,
          name: m.user.name,
          email: m.user.email,
          image: m.user.image,
          hp: totalHp,
          maxHp: classroom.maxHp,
          xp: totalXp,
          coins: totalCoins,
        };
      })
  );

  return (
    <GameDashboardClient
      classroomId={id}
      classroomName={classroom.name}
      initialStudents={students}
      isTeacher={isTeacher}
    />
  );
}
