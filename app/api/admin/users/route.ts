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
        _count: {
          select: {
            encounter_sessions: true,
            civil_intakes: true,
            emergency_alerts: true,
          },
        },
      },
    });

    // Bulk fetch all stats in just 2 queries
    const [allCivilStats, allSosStats] = await Promise.all([
      prisma.civilIntake.groupBy({
        by: ['user_id', 'status'],
        where: { user_id: { in: users.map(u => u.id) } },
        _count: true
      }),
      prisma.encounterSession.groupBy({
        by: ['user_id', 'status'],
        where: { user_id: { in: users.map(u => u.id) } },
        _count: true
      })
    ]);

    const enrichedUsers = users.map((u) => {
      const case_stats = {
        pending: 0,
        active: 0,
        assigned: 0,
        resolved: 0,
        rejected: 0,
      };

      // Aggregate civil stats
      allCivilStats.filter(s => s.user_id === u.id).forEach(s => {
        if (s.status === "pending") case_stats.pending += s._count;
        if (s.status === "active") case_stats.active += s._count;
        if (s.status === "assigned") case_stats.assigned += s._count;
        if (s.status === "resolved") case_stats.resolved += s._count;
        if (s.status === "rejected") case_stats.rejected += s._count;
      });

      // Aggregate SOS stats
      allSosStats.filter(s => s.user_id === u.id).forEach(s => {
        if (s.status === "pending") case_stats.pending += s._count;
        if (s.status === "active") case_stats.active += s._count;
        if (s.status === "assigned") case_stats.assigned += s._count;
        if (s.status === "resolved") case_stats.resolved += s._count;
        if (s.status === "rejected") case_stats.rejected += s._count;
      });

      return { ...u, case_stats };
    });

    return NextResponse.json({ users: enrichedUsers });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
