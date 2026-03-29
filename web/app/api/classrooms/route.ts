import { NextResponse } from "next/server";

import { getServerAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 簡單英文單字列表 (常用基礎單字)
const WORDS = [
  // A-H
  "ACE", "ACT", "ADD", "AGE", "AGO", "AIM", "AIR", "ARM", "ART", "ASK",
  "ATE", "AWE", "BAD", "BAG", "BAR", "BAT", "BAY", "BED", "BEE", "BET",
  "BIG", "BIN", "BIT", "BOW", "BOX", "BOY", "BUD", "BUG", "BUS", "BUT",
  "BUY", "CAB", "CAN", "CAP", "CAR", "CAT", "COB", "COD", "COG", "COP",
  "COT", "COW", "CRY", "CUB", "CUE", "CUP", "CUT", "DAB", "DAD", "DAM",
  "DAY", "DEN", "DEW", "DID", "DIE", "DIG", "DIM", "DIP", "DO", "DOG",
  "DOT", "DRY", "DUB", "DUD", "DUE", "DUG", "DYE", "EAR", "EAT", "EEL",
  "EGG", "ELF", "ELK", "ELM", "EMU", "END", "ERA", "EVE", "EYE", "FAD",
  "FAN", "FAR", "FAT", "FAX", "FED", "FEE", "FEW", "FIG", "FIN", "FIT",
  "FIX", "FLU", "FLY", "FOB", "FOE", "FOG", "FOR", "FOX", "FRY", "FUN",
  "FUR", "GAG", "GAP", "GAS", "GAY", "GEL", "GEM", "GET", "GIG", "GIN",
  "GNU", "GOB", "GOD", "GOT", "GUM", "GUN", "GUT", "GUY", "GYM", "HAD",
  "HAG", "HAM", "HAS", "HAT", "HAY", "HEM", "HEN", "HER", "HEW", "HEX",
  "HID", "HIM", "HIP", "HIS", "HIT", "HOB", "HOG", "HOP", "HOT", "HOW",
  "HUB", "HUG", "HUM", "HUT", "ICE", "ICY", "ILL", "IMP", "INK", "INN",
  "ION", "IRE", "IRK", "ITS", "IVY", "JAB", "JAG", "JAM", "JAR", "JAW",
  "JAY", "JET", "JIG", "JOB", "JOG", "JOY", "JUG", "JUT", "KEG", "KEN",
  "KEY", "KID", "KIN", "KIT", "LAB", "LAC", "LAD", "LAG", "LAP", "LAW",
  "LAX", "LAY", "LEA", "LED", "LEG", "LET", "LID", "LIE", "LIP", "LIT",
  "LOG", "LOT", "LOW", "LUG", "MAD", "MAN", "MAP", "MAR", "MAT", "MAW",
  "MAY", "MEN", "MET", "MID", "MIX", "MOB", "MOD", "MOM", "MOP", "MOW",
  "MUD", "MUG", "MUM", "NAB", "NAG", "NAP", "NAY", "NET", "NEW", "NIL",
  "NIP", "NIT", "NOB", "NOD", "NOR", "NOT", "NOW", "NUB", "NUN", "NUT",
  "OAK", "OAR", "OAT", "ODD", "ODE", "OFF", "OIL", "OLD", "ONE", "ORB",
  "ORE", "OUR", "OUT", "OWL", "OWN", "PAD", "PAL", "PAN", "PAP", "PAR",
  "PAT", "PAW", "PAY", "PEA", "PEG", "PEN", "PEP", "PER", "PET", "PEW",
  "PIE", "PIG", "PIN", "PIT", "PLY", "POD", "POP", "POT", "POW", "PRY",
  "PUB", "PUN", "PUP", "PUS", "PUT", "RAG", "RAM", "RAN", "RAP", "RAT",
  "RAW", "RAY", "RED", "REF", "RIB", "RID", "RIG", "RIM", "RIP", "ROB",
  "ROD", "ROE", "ROT", "ROW", "RUB", "RUG", "RUM", "RUN", "RUT", "RYE",
  "SAC", "SAD", "SAG", "SAP", "SAT", "SAW", "SAY", "SEA", "SEE", "SEW",
  "SEX", "SHE", "SHY", "SIN", "SIP", "SIR", "SIS", "SIT", "SIX", "SKI",
  "SKY", "SLY", "SOB", "SOD", "SON", "SOT", "SOW", "SOY", "SPA", "SPY",
  "STY", "SUB", "SUE", "SUM", "SUN", "SUP", "TAB", "TAD", "TAG", "TAN",
  "TAP", "TAR", "TAT", "TAX", "TEA", "TEN", "THE", "THY", "TIC", "TIE",
  "TIN", "TIP", "TOE", "TON", "TOO", "TOP", "TOT", "TOW", "TOY", "TRY",
  "TUB", "TUG", "TWO", "URN", "USE", "VAN", "VAT", "VET", "VEX", "VIA",
  "VIE", "VOW", "WAD", "WAG", "WAR", "WAS", "WAX", "WAY", "WEB", "WED",
  "WEE", "WET", "WHO", "WHY", "WIG", "WIN", "WIT", "WOE", "WOK", "WON",
  "WOO", "WOW", "YAK", "YAM", "YAP", "YAW", "YEA", "YES", "YET", "YEW",
  "YIN", "YOU", "ZAP", "ZEE", "ZEN", "ZIP", "ZIT", "ZOO"
];

function generateInviteCode(): string {
  const word1 = WORDS[Math.floor(Math.random() * WORDS.length)];
  const word2 = WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${word1}${word2}`;
}

async function generateUniqueInviteCode(): Promise<string> {
  let code: string;
  let exists = true;
  do {
    code = generateInviteCode();
    const existing = await prisma.classroom.findUnique({ where: { inviteCode: code } });
    exists = !!existing;
  } while (exists);
  return code;
}

export async function GET() {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.classroomMember.findMany({
    where: { userId: session.user.id },
    include: {
      classroom: {
        include: {
          _count: { select: { members: true, courses: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return NextResponse.json(memberships.map((m) => ({ ...m.classroom, myRole: m.role })));
}

export async function POST(req: Request) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "TEACHER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only teachers can create classrooms" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  // 確保教師有 org，沒有就建一個個人 org
  let org = await prisma.organization.findFirst({
    where: { memberships: { some: { userId: session.user.id } } },
  });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: `${session.user.name ?? "My"}'s Org`,
        memberships: {
          create: { userId: session.user.id, role: "TEACHER" },
        },
      },
    });
  }

  const classroom = await prisma.classroom.create({
    data: {
      name: name.trim(),
      organizationId: org.id,
      inviteCode: await generateUniqueInviteCode(),
      members: {
        create: { userId: session.user.id, role: "TEACHER" },
      },
    },
  });

  return NextResponse.json(classroom, { status: 201 });
}
