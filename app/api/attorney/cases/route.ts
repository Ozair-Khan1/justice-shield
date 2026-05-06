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

    // Fetch the attorney's specialties
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { role: true, full_name: true, specialties: true, country: true },
    });

    if (!user || (user.role !== "ATTORNEY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied. Attorney role required." }, { status: 403 });
    }

    // Fetch SOS sessions assigned to THIS attorney
    const sosSessions = await prisma.encounterSession.findMany({
      where: {
        assigned_attorney_id: payload.id as string
      },
      orderBy: { started_at: "desc" },
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

    // Fetch cases assigned to THIS attorney
    const assignedCases = await prisma.civilIntake.findMany({
      where: {
        assigned_attorney_id: payload.id as string
      },
      orderBy: { updated_at: "desc" },
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
      sosSessions,
      pendingCases: [], // Purged discovery queue
      assignedCases
    });
  } catch (error) {
    console.error("Attorney API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
