import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, id: userId } = payload as { role: string; id: string };

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { seen_notification_ids: true }
    });
    const seenIds = new Set(user?.seen_notification_ids || []);

    const unreadNotifications: any[] = [];

    if (role === "ADMIN") {
      // Fetch pending civil intakes
      const pendingIntakes = await prisma.civilIntake.findMany({
        where: { status: "pending" },
        take: 5,
        orderBy: { created_at: "desc" },
        include: { user: { select: { full_name: true } } }
      });

      pendingIntakes.forEach(i => {
        unreadNotifications.push({
          type: "CIVIL_INTAKE",
          id: i.id,
          user_name: i.user.full_name || "Unknown Member",
          subject: i.subject,
          urgency: i.urgency,
          timestamp: i.created_at
        });
      });

      // Fetch pending SOS
      const pendingSos = await prisma.encounterSession.findMany({
        where: { status: "pending" },
        take: 5,
        orderBy: { created_at: "desc" },
        include: { user: { select: { full_name: true } } }
      });

      pendingSos.forEach(s => {
        unreadNotifications.push({
          type: "SOS",
          id: s.id,
          user_name: s.user.full_name || "Unknown Member",
          encounter_type: s.encounter_type.replace("_", " "),
          location: s.location_address || "Unknown",
          timestamp: s.created_at
        });
      });
    } else if (role === "ATTORNEY") {
      // ... (existing attorney logic) ...
      // Fetch assigned civil intakes
      const assignedIntakes = await prisma.civilIntake.findMany({
        where: { assigned_attorney_id: userId, status: "assigned" },
        take: 5,
        orderBy: { created_at: "desc" },
        include: { user: { select: { full_name: true } } }
      });

      assignedIntakes.forEach(i => {
        unreadNotifications.push({
          type: "CIVIL_INTAKE",
          id: i.id,
          user_name: i.user.full_name || "Unknown Member",
          subject: i.subject,
          urgency: i.urgency,
          timestamp: i.created_at
        });
      });

      // Fetch assigned SOS
      const assignedSos = await prisma.encounterSession.findMany({
        where: { assigned_attorney_id: userId, status: "assigned" },
        take: 5,
        orderBy: { created_at: "desc" },
        include: { user: { select: { full_name: true } } }
      });

      assignedSos.forEach(s => {
        unreadNotifications.push({
          type: "SOS",
          id: s.id,
          user_name: s.user.full_name || "Unknown Member",
          encounter_type: s.encounter_type.replace("_", " "),
          location: s.location_address || "Unknown",
          timestamp: s.created_at
        });
      });
    } else if (role === "USER") {
      // Fetch their own pending/active/resolved/rejected civil intakes
      const ownIntakes = await prisma.civilIntake.findMany({
        where: { user_id: userId, status: { in: ["pending", "assigned", "active", "resolved", "rejected"] } },
        take: 5,
        orderBy: { created_at: "desc" }
      });

      ownIntakes.forEach(i => {
        unreadNotifications.push({
          type: "CIVIL_CONFIRMATION",
          id: i.id,
          subject: i.subject,
          status: i.status,
          timestamp: i.created_at
        });
      });

      // Fetch their own pending/active/resolved/rejected SOS
      const ownSos = await prisma.encounterSession.findMany({
        where: { user_id: userId, status: { in: ["pending", "active", "assigned", "resolved", "rejected"] } },
        take: 5,
        orderBy: { created_at: "desc" }
      });

      ownSos.forEach(s => {
        unreadNotifications.push({
          type: "SOS_CONFIRMATION",
          id: s.id,
          encounter_type: s.encounter_type.replace("_", " "),
          status: s.status,
          timestamp: s.created_at
        });
      });
    }

    const recentCalls = await prisma.callLog.findMany({
      where: {
        receiver_id: userId,
        status: { in: ["missed", "initiated"] }
      },
      take: 20,
      orderBy: { started_at: "desc" },
      include: { caller: { select: { full_name: true, id: true } } }
    });

    const now = new Date();
    for (const call of recentCalls) {
      const callAgeSeconds = (now.getTime() - new Date(call.started_at).getTime()) / 1000;

      if (call.status === "initiated") {
        if (callAgeSeconds > 60) {
          // Auto-expire to missed in DB
          await prisma.callLog.update({
            where: { id: call.id },
            data: { status: "missed", ended_at: now }
          });
          unreadNotifications.push({
            type: "MISSED_CALL",
            id: call.id,
            caller_id: call.caller.id,
            caller_name: call.caller.full_name || "Unknown Caller",
            call_type: call.call_type,
            timestamp: call.started_at
          });
        } else {
          // Still active! Show as incoming call if not seen
          unreadNotifications.push({
            type: "INCOMING_CALL_RECOVERY", // New type for recovery
            id: call.id,
            room: call.room,
            callerId: call.caller.id,
            senderName: call.caller.full_name || "Member",
            callType: call.call_type,
            timestamp: call.started_at
          });
        }
      } else {
        unreadNotifications.push({
          type: "MISSED_CALL",
          id: call.id,
          caller_id: call.caller.id,
          caller_name: call.caller.full_name || "Unknown Caller",
          call_type: call.call_type,
          timestamp: call.started_at
        });
      }
    }

    return NextResponse.json({
      unreadNotifications: unreadNotifications.filter(n => n.type === "INCOMING_CALL_RECOVERY" || !seenIds.has(n.id))
    });
  } catch (error) {
    console.error("Unread notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
