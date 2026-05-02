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

    // Update the intake with the assigned attorney
    const updatedIntake = await prisma.civilIntake.update({
      where: { id },
      data: {
        assigned_attorney_id: attorneyId,
        status: "assigned", // Immediately mark as assigned
      },
    });

    return NextResponse.json({ success: true, intake: updatedIntake });
  } catch (error) {
    console.error("Assign attorney error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
