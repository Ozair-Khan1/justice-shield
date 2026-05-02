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
      select: { role: true, specialties: true },
    });

    if (!user || (user.role !== "ATTORNEY" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const attorneySpecialties = user.specialties
      ? user.specialties.split(",").map(s => s.trim().toLowerCase())
      : [];

    // Fetch limited active SOS sessions
    const sosSessions = await prisma.encounterSession.findMany({
      where: { status: "active" },
      orderBy: { started_at: "desc" },
      take: 10,
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

    // Fetch limited pending civil intakes matching specialties
    const pendingCases = await prisma.civilIntake.findMany({
      where: {
        status: "pending",
        matter_type: { in: attorneySpecialties }
      },
      orderBy: { created_at: "desc" },
      take: 10,
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

    // Fetch limited cases assigned to THIS attorney that are still active
    const assignedCases = await prisma.civilIntake.findMany({
      where: {
        assigned_attorney_id: payload.id as string,
        status: "assigned"
      },
      orderBy: { updated_at: "desc" },
      take: 10,
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

    // Get counts for the stats cards
    const [totalSosCount, totalPendingCount, totalAssignedCount] = await Promise.all([
      prisma.encounterSession.count({ where: { status: "active" } }),
      prisma.civilIntake.count({
        where: {
          status: "pending",
          matter_type: { in: attorneySpecialties }
        }
      }),
      prisma.civilIntake.count({
        where: {
          assigned_attorney_id: payload.id as string,
          status: "assigned"
        }
      }),
    ]);

    return NextResponse.json({
      sosSessions,
      pendingCases,
      assignedCases,
      stats: {
        totalSosCount,
        totalPendingCount,
        totalAssignedCount
      }
    });
  } catch (error) {
    console.error("Attorney dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
