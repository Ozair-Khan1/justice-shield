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

    const [userCount, attorneyCount, sessionCount, intakeCount, alertCount, vendorCount, pendingVendors] =
      await Promise.all([
        prisma.user.count({ where: { role: "USER" } }),
        prisma.user.count({ where: { role: "ATTORNEY" } }),
        prisma.encounterSession.count(),
        prisma.civilIntake.count(),
        prisma.emergencyAlert.count(),
        prisma.vendorApplication.count(),
        prisma.vendorApplication.count({ where: { status: "pending" } }),
      ]);

    const recentUsers = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
      where: {
        role: { in: ["USER"] },
        password_hash: { not: `LOCKED${process.env.LOCKED_PASS}` }
      },
      take: 10,
      select: {
        id: true,
        email: true,
        role: true,
        full_name: true,
        membership_tier: true,
        created_at: true,
        city: true,
        country: true,
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

    const sosSessions = await prisma.encounterSession.findMany({
      orderBy: { started_at: "desc" },
      take: 10,
      select: {
        id: true,
        encounter_type: true,
        status: true,
        started_at: true,
        location_address: true,
        rejection_message: true,
        assigned_attorney_id: true,
        emergency_contact_phone: true,
        assigned_attorney: {
          select: {
            full_name: true,
            email: true,
            phone: true,
            specialties: true,
            role: true,
            firm_name: true,
          }
        },
        user: {
          select: {
            full_name: true,
            email: true,
            phone: true,
            city: true,
            country: true,
            emergency_contact_name: true,
          }
        }
      }
    });

    const civilIntakes = await prisma.civilIntake.findMany({
      orderBy: { created_at: "desc" },
      where: {
        status: { in: ["assigned", "pending", "active", "resolved", "rejected"] }
      },
      take: 10,
      include: {
        assigned_attorney: {
          select: {
            full_name: true,
            email: true,
            phone: true,
            specialties: true,
            role: true,
            firm_name: true,
          }
        },
        user: {
          select: {
            full_name: true,
            email: true,
            phone: true,
            city: true,
            country: true,
            emergency_contact_name: true,
            emergency_contact_phone: true,
          }
        }
      }
    });

    const alerts = await prisma.emergencyAlert.findMany({
      orderBy: { sent_at: "desc" },
      take: 10,
      select: {
        id: true,
        contact_name: true,
        contact_phone: true,
        message: true,
        sent_at: true,
        session: {
          select: {
            location_lat: true,
            location_lng: true,
          }
        },
        user: {
          select: {
            full_name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    const emergencyAlerts = alerts.map(a => ({
      ...a,
      link_address: a.session?.location_lat && a.session?.location_lng
        ? `${a.session.location_lat},${a.session.location_lng}`
        : null
    }));

    return NextResponse.json({
      stats: { userCount, attorneyCount, sessionCount, intakeCount, alertCount, vendorCount, pendingVendors },
      recentUsers,
      recentVendors,
      sosSessions,
      civilIntakes,
      emergencyAlerts,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
