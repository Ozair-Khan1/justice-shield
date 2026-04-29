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

    const [userCount, sessionCount, intakeCount, alertCount, vendorCount, pendingVendors] =
      await Promise.all([
        prisma.user.count(),
        prisma.encounterSession.count(),
        prisma.civilIntake.count(),
        prisma.emergencyAlert.count(),
        prisma.vendorApplication.count(),
        prisma.vendorApplication.count({ where: { status: "pending" } }),
      ]);

    const recentUsers = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      where: {
        role: {
          in: ["USER", "ATTORNEY"],
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        full_name: true,
        membership_tier: true,
        created_at: true,
      },
    });

    const recentVendors = await prisma.vendorApplication.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      select: {
        id: true,
        vendor_type: true,
        full_name: true,
        email: true,
        status: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      stats: { userCount, sessionCount, intakeCount, alertCount, vendorCount, pendingVendors },
      recentUsers,
      recentVendors,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
