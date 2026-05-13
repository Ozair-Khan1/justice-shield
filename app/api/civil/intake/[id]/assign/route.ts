import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { attorneyId } = await req.json();

    // Verify the intake belongs to the user
    const intake = await prisma.civilIntake.findUnique({
      where: { id },
      select: { user_id: true }
    });

    if (!intake || intake.user_id !== payload.id) {
      return NextResponse.json({ error: "Intake not found or unauthorized" }, { status: 404 });
    }

    const attorney = await prisma.user.findUnique({
      where: { id: attorneyId },
      select: { full_name: true, email: true, phone: true, firm_name: true, role: true, specialties: true }
    });

    if (!attorney) {
      return NextResponse.json({ error: "Attorney not found" }, { status: 404 });
    }

    // Update the intake with the assigned attorney
    const updatedIntake = await prisma.civilIntake.update({
      where: { id },
      data: {
        assigned_attorney_id: attorneyId,
        status: "assigned", // Immediately mark as assigned
      },
      include: {
        assigned_attorney: {
          select: {
            full_name: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Trigger Notification for User
    const { emitSocketEvent } = await import("@/lib/socket-emit");
    await emitSocketEvent("attorney-assigned", {
      userId: updatedIntake.user_id,
      attorneyName: updatedIntake.assigned_attorney?.full_name || "An Attorney",
      caseSubject: updatedIntake.subject,
      caseId: updatedIntake.id,
      caseType: "civil",
    });

    return NextResponse.json({ success: true, intake: updatedIntake });
  } catch (error) {
    console.error("Assign attorney error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
