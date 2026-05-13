import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";
import { emitSocketEvent } from "@/lib/socket-emit";

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(token);

    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is an attorney or admin
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { id: true, role: true, full_name: true },
    });

    if (!user || (user.role !== "ATTORNEY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied. Attorney role required." }, { status: 403 });
    }

    const body = await req.json();
    const { intakeId } = body;

    if (!intakeId) {
      return NextResponse.json({ error: "Missing intakeId" }, { status: 400 });
    }

    const updatedIntake = await prisma.civilIntake.update({
      where: { id: intakeId },
      data: {
        status: "active",
        assigned_attorney_id: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    // Notify the case owner via socket
    await emitSocketEvent("case-accepted", {
      userId: updatedIntake.user_id,
      attorneyName: user.full_name || "An Attorney",
      caseSubject: updatedIntake.subject,
      caseId: updatedIntake.id,
      caseType: "civil",
    });

    return NextResponse.json({ success: true, intake: updatedIntake });
  } catch (error) {
    console.error("Accept case error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
