import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Aa912259", 12);

  const teacher = await prisma.user.upsert({
    where: { email: "t108" },
    update: { password: hashedPassword, role: "TEACHER", name: "教師 t108" },
    create: {
      email: "t108",
      name: "教師 t108",
      role: "TEACHER",
      password: hashedPassword,
    },
  });

  console.log("已建立教師帳號:", teacher.email, "| role:", teacher.role);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
