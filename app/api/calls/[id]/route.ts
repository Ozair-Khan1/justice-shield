import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status } = await req.json();
    const { id } = await params;

    const updateData: any = { status };
    if (status === "ended" || status === "declined" || status === "missed") {
      updateData.ended_at = new Date();
    }

    const callLog = await prisma.callLog.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({ callLog });
  } catch (error) {
    console.error("Update call log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
