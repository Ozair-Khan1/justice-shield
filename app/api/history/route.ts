import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(token);

    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.encounterSession.findMany({
      where: { user_id: payload.id as string },
      orderBy: { started_at: "desc" },
    });

    const intakes = await prisma.civilIntake.findMany({
      where: {
        user_id: payload.id as string,
        status: {
          in: ["rejected", "pending", "assigned", "active", "resolved"]
        }
      },
      include: {
        assigned_attorney: {
          select: {
            full_name: true,
            email: true,
          }
        }
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ sessions, intakes });
  } catch (error) {
    console.error("History API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
