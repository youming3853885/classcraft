import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          classroom: { select: { name: true } },
        },
      },
      submissions: {
        where: { studentId: session.user.id },
      },
    },
  });

  if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(assignment);
}
