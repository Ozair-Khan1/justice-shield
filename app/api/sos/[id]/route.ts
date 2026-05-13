import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";
import { emitSocketEvent } from "@/lib/socket-emit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Try to find an actual Session
    let session = await prisma.encounterSession.findUnique({
      where: { id },
      include: {
        user: {
          select: { full_name: true, email: true, phone: true }
        },
        assigned_attorney: {
          select: { full_name: true, email: true, phone: true }
        }
      }
    });

    // 2. If not found, it might be an ID of an EmergencyAlert (pre-confirmation)
    if (!session) {
      const alert = await prisma.emergencyAlert.findUnique({
        where: { id },
        include: {
          user: {
            select: { full_name: true, email: true, phone: true }
          },
          session: {
            include: {
              user: { select: { full_name: true, email: true, phone: true } },
              assigned_attorney: { select: { full_name: true, email: true, phone: true } }
            }
          }
        }
      });

      if (alert) {
        if (alert.session) {
          session = alert.session as any;
        } else {
          // It's a preliminary alert - map it to session shape so UI works
          session = {
            id: alert.id,
            user_id: alert.user_id,
            encounter_type: "SOS_ALERT",
            status: "pending",
            location_address: alert.message?.split(" at ")?.[1] || "Unknown",
            started_at: alert.sent_at,
            user: alert.user,
            notes: alert.message,
            assigned_attorney: null,
            assigned_attorney_id: null,
            is_preliminary: true
          } as any;
        }
      }
    }

    if (!session) {
      return NextResponse.json({ error: "SOS Record not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("SOS GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { status, assigned_attorney_id, rejection_message } = body;

    const existing = await prisma.encounterSession.findUnique({
      where: { id },
      select: { assigned_attorney_id: true }
    });

    if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const isAdmin = payload.role === "ADMIN";
    const isAssigned = existing.assigned_attorney_id === payload.id;

    if (!isAdmin && !isAssigned) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const data: any = {};
    if (status) data.status = status;
    if (assigned_attorney_id) {
      const attorney = await prisma.user.findUnique({
        where: { id: assigned_attorney_id },
        select: { full_name: true }
      });
      data.assigned_attorney_id = assigned_attorney_id;
      data.attorney_name = attorney?.full_name;

      if (!status || status === "active") {
        data.status = "assigned";
      }
    }
    if (rejection_message) data.rejection_message = rejection_message;
    if (status === "resolved") data.ended_at = new Date();

    const updatedSession = await prisma.encounterSession.update({
      where: { id },
      data,
      include: {
        user: { select: { full_name: true } },
        assigned_attorney: {
          select: { full_name: true, email: true, phone: true }
        }
      }
    });

    // Trigger Notification
    console.log("[SOS_PATCH] Triggering notification update...");
    await emitSocketEvent("sos-triggered", {
      type: "SOS_UPDATE",
      id: updatedSession.id,
      owner_id: updatedSession.user_id,
      user_name: (updatedSession as any).user?.full_name || "Member",
      encounter_type: updatedSession.encounter_type.replace("_", " "),
      location: updatedSession.location_address || "Unknown",
      assigned_attorney_id: updatedSession.assigned_attorney_id || null,
      status: updatedSession.status,
      performed_by: payload.id,
      timestamp: new Date()
    });

    if (updatedSession.assigned_attorney_id && (updatedSession.status === "assigned" || updatedSession.status === "active")) {
      const eventType = payload.role === "ATTORNEY" ? "case-accepted" : "attorney-assigned";
      await emitSocketEvent(eventType, {
        userId: updatedSession.user_id,
        attorneyName: updatedSession.assigned_attorney?.full_name || "An Attorney",
        caseSubject: updatedSession.encounter_type.replace("_", " "),
        caseId: updatedSession.id,
        caseType: "sos",
      });
    }

    if (updatedSession.status === "rejected") {
      await emitSocketEvent("case-rejected", {
        userId: updatedSession.user_id,
        attorneyName: updatedSession.assigned_attorney?.full_name || "An Attorney",
        caseSubject: updatedSession.encounter_type.replace("_", " "),
        caseId: updatedSession.id,
        caseType: "sos",
        reason: updatedSession.rejection_message,
      });
    }

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("SOS PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
