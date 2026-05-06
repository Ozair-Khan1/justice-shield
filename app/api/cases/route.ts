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

    const intakes = await prisma.civilIntake.findMany({
      where: {
        user_id: payload.id as string,
        status: { in: ["assigned", "pending", "draft"] },
      },
      include: {
        assigned_attorney: {
          select: {
            full_name: true,
            email: true,
            phone: true,
            firm_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Map assigned_attorney to attorney to match frontend interface
    const cases = intakes.map(i => ({
      ...i,
      attorney: i.assigned_attorney
    }));

    return NextResponse.json({ cases });
  } catch (error) {
    console.error("Fetch user cases error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
