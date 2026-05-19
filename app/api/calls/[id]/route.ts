import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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

    let record = null;
    try {
      record = await prisma.callLog.update({
        where: { id },
        data: updateData
      });
    } catch (e: any) {
      // If P2025 (Record not found), try EncounterSession
      if (e.code === 'P2025') {
        // Do not update status automatically for EncounterSession to let attorney do it manually
        record = await prisma.encounterSession.update({
          where: { id },
          data: {
            ...(updateData.ended_at ? { ended_at: updateData.ended_at } : {})
          }
        });
      } else {
        throw e;
      }
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Update call log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
