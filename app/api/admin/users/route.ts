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
        role: "USER",
        password_hash: { not: `LOCKED${process.env.LOCKED_PASS}` }
      },
      select: {
        id: true,
        email: true,
        role: true,
        full_name: true,
        phone: true,
        city: true,
        country: true,
        membership_tier: true,
        created_at: true,
        civil_intakes: { select: { status: true } },
        encounter_sessions: { select: { status: true } },
        _count: {
          select: {
            encounter_sessions: true,
            civil_intakes: true,
            emergency_alerts: true,
          },
        },
      },
    });

    const enrichedUsers = users.map((u) => {
      const allCases = [
        ...u.civil_intakes,
        ...u.encounter_sessions
      ];
      const case_stats = {
        pending: allCases.filter(c => c.status === "pending").length,
        active: allCases.filter(c => c.status === "active").length,
        assigned: allCases.filter(c => c.status === "assigned").length,
        resolved: allCases.filter(c => c.status === "resolved").length,
        rejected: allCases.filter(c => c.status === "rejected").length,
      };

      const {
        civil_intakes,
        encounter_sessions,
        ...userWithoutArrays
      } = u;
      return { ...userWithoutArrays, case_stats };
    });

    return NextResponse.json({ users: enrichedUsers });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
