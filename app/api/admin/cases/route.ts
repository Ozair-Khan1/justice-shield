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

    const [intakes, sessions, alerts] = await Promise.all([
      prisma.civilIntake.findMany({
        where: {
          status: { in: ["assigned", "pending", "rejected", "active", "resolved"] }
        },
        include: {
          user: { select: { id: true, full_name: true, email: true, phone: true, city: true, country: true, emergency_contact_name: true, emergency_contact_phone: true, } },
          assigned_attorney: { select: { id: true, full_name: true, email: true, phone: true, firm_name: true, role: true, specialties: true } }
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.encounterSession.findMany({
        select: {
          id: true,
          encounter_type: true,
          status: true,
          location_lat: true,
          location_lng: true,
          location_address: true,
          emergency_contact_phone: true,
          started_at: true,
          rejection_message: true,
          created_at: true,
          user: { select: { id: true, full_name: true, email: true, phone: true, city: true, country: true, emergency_contact_name: true } },
          assigned_attorney: { select: { id: true, full_name: true, email: true, phone: true, firm_name: true, role: true, specialties: true } },
        },
        orderBy: { created_at: "desc" },
      }),
      prisma.emergencyAlert.findMany({
        where: { session_id: null },
        include: {
          user: { select: { id: true, full_name: true, email: true, phone: true, city: true, country: true, emergency_contact_name: true } }
        },
        orderBy: { sent_at: "desc" }
      })
    ]);

    // Map alerts to look like sessions
    const mappedAlerts = alerts.map(alert => ({
      id: alert.id,
      encounter_type: "SOS_ALERT",
      status: "pending",
      location_address: alert.message?.split(" at ")?.[1] || "Unknown",
      started_at: alert.sent_at,
      created_at: alert.sent_at,
      user: alert.user,
      notes: alert.message,
      assigned_attorney: null,
      is_preliminary: true
    }));

    // Combine and sort
    const allSessions = [...sessions, ...mappedAlerts].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );

    return NextResponse.json({ intakes, sessions: allSessions });
  } catch (error) {
    console.error("Admin fetch cases error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
