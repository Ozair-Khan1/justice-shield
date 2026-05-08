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

    const [intakes, sessions] = await Promise.all([
      prisma.civilIntake.findMany({
        where: {
          user_id: payload.id as string,
          status: { in: ["assigned", "pending", "draft", "rejected", "active"] },
        },
        include: {
          assigned_attorney: {
            select: {
              full_name: true,
              email: true,
              phone: true,
              firm_name: true,
              role: true,
              specialties: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.encounterSession.findMany({
        where: {
          user_id: payload.id as string,
          status: { in: ["rejected"] },
        },
        include: {
          assigned_attorney: {
            select: {
              full_name: true,
              email: true,
              phone: true,
              firm_name: true,
              role: true,
              specialties: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      })
    ]);

    const civilCases = intakes.map(i => ({
      ...i,
      case_type: "civil",
      attorney: i.assigned_attorney
    }));

    const sosCases = sessions.map(s => ({
      ...s,
      case_type: "sos",
      matter_type: s.encounter_type,
      subject: `SOS: ${s.encounter_type.replace("_", " ")}`,
      location_address: s.location_address || `Emergency protocol initiated.`,
      rejection_reason: s.rejection_message,
      urgency: "CRITICAL",
      attorney: s.assigned_attorney
    }));

    const cases = [...civilCases, ...sosCases].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ cases });
  } catch (error) {
    console.error("Fetch user cases error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
