import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
      where: {
        role: {
          in: ["USER", "ATTORNEY"],
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        full_name: true,
        phone: true,
        membership_tier: true,
        created_at: true,
        _count: {
          select: {
            encounter_sessions: true,
            civil_intakes: true,
            emergency_alerts: true,
          },
        },
      },
    });

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
