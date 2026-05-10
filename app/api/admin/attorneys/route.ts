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

    const attorneys = await prisma.user.findMany({
      where: { role: "ATTORNEY", NOT: { password_hash: `${"LOCKED" + process.env.LOCKED_PASS}` } },
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        full_name: true,
        phone: true,
        firm_name: true,
        specialties: true,
        bar_number: true,
        years_experience: true,
        membership_tier: true,
        created_at: true,
        city: true,
        country: true,
        assigned_intakes: { select: { status: true } },
        assigned_encounters: { select: { status: true } },
        _count: {
          select: {
            assigned_encounters: true,
            assigned_intakes: true,
          },
        },
      },
    });

    const enrichedAttorneys = attorneys.map((a) => {
      const allCases = [...a.assigned_intakes, ...a.assigned_encounters];
      const case_stats = {
        active: allCases.filter(c => c.status === "active" || c.status === "pending").length,
        assigned: allCases.filter(c => c.status === "assigned").length,
        resolved: allCases.filter(c => c.status === "resolved").length,
      };
      
      const { assigned_intakes, assigned_encounters, ...attorneyWithoutArrays } = a;
      return { ...attorneyWithoutArrays, case_stats };
    });

    return NextResponse.json({ attorneys: enrichedAttorneys });
  } catch (err) {
    console.error("Admin attorneys API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
