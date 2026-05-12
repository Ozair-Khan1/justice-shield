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

    const { status, assigned_attorney_id, rejection_message } = await req.json();

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

    const data: any = { status };
    if (assigned_attorney_id !== undefined) {
      if (assigned_attorney_id === null) {
        data.assigned_attorney = { disconnect: true };
      } else {
        data.assigned_attorney = { connect: { id: assigned_attorney_id } };
      }
    }

    if (rejection_message !== undefined) {
      data.rejection_message = rejection_message;
    }

    const updated = await prisma.civilIntake.update({
      where: { id },
      data,
      include: {
        user: { select: { full_name: true } }
      }
    });

    // Trigger Notification for Admins/Attorneys
    const { emitSocketEvent } = await import("@/lib/socket-emit");
    await emitSocketEvent("civil-intake-triggered", {
      type: "CIVIL_UPDATE",
      id: updated.id,
      owner_id: updated.user_id,
      user_name: updated.user.full_name || "Unknown Member",
      subject: updated.subject,
      urgency: updated.urgency,
      assigned_attorney_id: updated.assigned_attorney_id || null,
      status: updated.status,
      performed_by: payload.id,
      timestamp: new Date()
    });

    return NextResponse.json({ success: true, intake: updated });
  } catch (error) {
    console.error("Status update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
