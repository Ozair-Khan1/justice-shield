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
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const intake = await prisma.civilIntake.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, full_name: true, email: true, phone: true, city: true, country: true, emergency_contact_name: true, emergency_contact_phone: true, } },
        assigned_attorney: { select: { id: true, full_name: true, email: true, phone: true, firm_name: true, role: true, specialties: true } }
      },
    });

    if (!intake) {
      return NextResponse.json({ error: "Intake not found" }, { status: 404 });
    }

    return NextResponse.json({ intake });
  } catch (error) {
    console.error("Admin fetch case detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
