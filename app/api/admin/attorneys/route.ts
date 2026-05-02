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
        _count: {
          select: {
            encounter_sessions: true,
            civil_intakes: true,
          },
        },
      },
    });

    return NextResponse.json({ attorneys });
  } catch (err) {
    console.error("Admin attorneys API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
