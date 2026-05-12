import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const intake = await prisma.civilIntake.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, full_name: true, email: true, phone: true, city: true, country: true, emergency_contact_name: true, emergency_contact_phone: true, } },
        assigned_attorney: { select: { id: true, full_name: true, email: true, phone: true, firm_name: true, role: true, specialties: true } }
      },
    });

    if (!intake) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    // Security: Only allow the Admin or the specifically assigned Attorney to view details
    const isAdmin = payload.role === "ADMIN";
    const isAssignedAttorney = intake.assigned_attorney_id === payload.id;

    if (!isAdmin && !isAssignedAttorney) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ case: intake });
  } catch (error) {
    console.error("Case detail fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
