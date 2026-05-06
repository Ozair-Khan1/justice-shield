import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify user is an attorney or admin
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { role: true, specialties: true, country: true },
    });

    if (!user || (user.role !== "ATTORNEY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const attorneySpecialties = user.specialties
      ? user.specialties.split(",").map(s => s.trim().toLowerCase())
      : [];

    // Fetch limited cases assigned to THIS attorney that are still active
    const assignedCases = await prisma.civilIntake.findMany({
      where: {
        assigned_attorney_id: payload.id as string,
        status: "assigned"
      },
      orderBy: { updated_at: "desc" },
      take: 20,
      include: {
        user: {
          select: {
            full_name: true,
            email: true,
            phone: true,
            city: true,
            country: true,
            emergency_contact_phone: true,
          }
        }
      }
    });

    // Fetch SOS assigned to this attorney
    const assignedSessions = await prisma.encounterSession.findMany({
      where: {
        assigned_attorney_id: payload.id as string,
        status: "assigned"
      },
      orderBy: { started_at: "desc" },
      include: {
        user: {
          select: {
            full_name: true,
            email: true,
            phone: true,
            city: true,
            country: true,
            emergency_contact_phone: true,
          }
        }
      }
    });

    // Get counts for the stats cards
    const [totalCivilAssignedCount, totalSosAssignedCount] = await Promise.all([
      prisma.civilIntake.count({
        where: {
          assigned_attorney_id: payload.id as string,
          status: "assigned"
        }
      }),
      prisma.encounterSession.count({
        where: {
          assigned_attorney_id: payload.id as string,
          status: "assigned"
        }
      }),
    ]);

    return NextResponse.json({
      sosSessions: [], // Purged for security
      pendingCases: [], // Purged for security
      assignedCases,
      assignedSessions,
      stats: {
        totalSosCount: 0,
        totalPendingCount: 0,
        totalAssignedCount: totalCivilAssignedCount + totalSosAssignedCount
      }
    });
  } catch (error) {
    console.error("Attorney dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
