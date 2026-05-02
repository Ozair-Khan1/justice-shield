import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status } = await req.json();

    // Verify ownership or admin
    const intake = await prisma.civilIntake.findUnique({
      where: { id },
    });

    if (!intake) return NextResponse.json({ error: "Case not found" }, { status: 404 });

    const isAdmin = payload.role === "ADMIN";
    const isAssignedAttorney = intake.assigned_attorney_id === payload.id;

    if (!isAdmin && !isAssignedAttorney) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.civilIntake.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, intake: updated });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
