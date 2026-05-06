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

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { id: true, role: true },
    });

    if (!user || (user.role !== "ATTORNEY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied. Attorney role required." }, { status: 403 });
    }

    // Fetch accepted cases for this attorney
    const civilIntakes = await prisma.civilIntake.findMany({
      where: {
        assigned_attorney_id: user.id,
        status: "assigned",
      },
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            full_name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      cases: civilIntakes,
      sessions: [] // SOS sessions removed from this view
    });
  } catch (error) {
    console.error("Fetch attorney cases error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
