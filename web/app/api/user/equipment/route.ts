import { NextRequest, NextResponse } from "next/server"
import { getServerAuthSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { EQUIPMENT_REGISTRY, type EquipmentSlot } from "@/components/game/character-avatar"

const VALID_SLOTS: EquipmentSlot[] = ["helmet", "armor", "weapon", "cape", "pet", "accessory", "boots", "offhand"]

export async function PATCH(req: NextRequest) {
  const session = await getServerAuthSession()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { classroomId: string; slot: string; itemKey: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { classroomId, slot, itemKey } = body

  // Validate slot
  if (!VALID_SLOTS.includes(slot as EquipmentSlot)) {
    return NextResponse.json({ error: `Invalid slot: ${slot}` }, { status: 400 })
  }

  // Validate itemKey — must be in registry OR empty string (= unequip)
  if (itemKey !== "" && !EQUIPMENT_REGISTRY[itemKey]) {
    return NextResponse.json({ error: `Unknown item: ${itemKey}` }, { status: 400 })
  }

  // If equipping, verify the item slot matches
  if (itemKey !== "") {
    const def = EQUIPMENT_REGISTRY[itemKey]
    if (def.slot !== slot) {
      return NextResponse.json({ error: `Item ${itemKey} cannot go into slot ${slot}` }, { status: 400 })
    }
  }

  // Find ClassroomMember record
  const member = await prisma.classroomMember.findUnique({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
  })
  if (!member) {
    return NextResponse.json({ error: "Not a member of this classroom" }, { status: 404 })
  }

  // Parse existing equipment JSON
  let currentEquipment: Record<string, string | null> = {}
  try { currentEquipment = JSON.parse(member.equipment || "{}") } catch {}

  // Update the slot
  if (itemKey === "") {
    delete currentEquipment[slot]
  } else {
    currentEquipment[slot] = itemKey
  }

  // Persist
  const updated = await prisma.classroomMember.update({
    where: { classroomId_userId: { classroomId, userId: session.user.id } },
    data: { equipment: JSON.stringify(currentEquipment) },
  })

  return NextResponse.json({ equipment: JSON.parse(updated.equipment || "{}") })
}
