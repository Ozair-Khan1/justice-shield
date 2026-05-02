import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { intakeId, attorneyId } = await req.json();

    if (!intakeId || !attorneyId) {
      return NextResponse.json({ error: "Missing intakeId or attorneyId" }, { status: 400 });
    }

    const updatedIntake = await prisma.civilIntake.update({
      where: { id: intakeId },
      data: {
        assigned_attorney_id: attorneyId,
        status: "assigned",
      },
    });

    return NextResponse.json({ success: true, intake: updatedIntake });
  } catch (error) {
    console.error("Case assignment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
