import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";
import { emitSocketEvent } from "@/lib/socket-emit";

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { intakeId, sessionId, attorneyId } = await req.json();

    if (!(intakeId || sessionId) || !attorneyId) {
      return NextResponse.json({ error: "Missing ID or attorneyId" }, { status: 400 });
    }

    let updated: any;
    if (intakeId) {
      updated = await prisma.civilIntake.update({
        where: { id: intakeId },
        data: {
          assigned_attorney_id: attorneyId,
          status: "assigned",
        },
        include: {
          user: { select: { id: true, full_name: true } },
          assigned_attorney: {
            select: { full_name: true, email: true, phone: true }
          }
        }
      });

      // Trigger Notification for Attorney
      await emitSocketEvent("civil-intake-triggered", {
        type: "CIVIL_UPDATE",
        id: updated.id,
        owner_id: updated.user_id,
        user_name: updated.user?.full_name || "Unknown Member",
        subject: updated.subject,
        urgency: updated.urgency,
        assigned_attorney_id: updated.assigned_attorney_id,
        status: updated.status,
        performed_by: payload.id,
        timestamp: new Date()
      });

      // Notify User
      await emitSocketEvent("attorney-assigned", {
        userId: updated.user_id,
        attorneyName: updated.assigned_attorney?.full_name || "An Attorney",
        caseSubject: updated.subject,
        caseId: updated.id,
        caseType: "civil",
      });

    } else {
      updated = await prisma.encounterSession.update({
        where: { id: sessionId },
        data: {
          assigned_attorney_id: attorneyId,
          status: "assigned",
        },
        include: {
          user: { select: { id: true, full_name: true } },
          assigned_attorney: {
            select: { full_name: true, email: true, phone: true }
          }
        }
      });

      // Trigger Notification for Attorney
      await emitSocketEvent("sos-triggered", {
        type: "SOS_UPDATE",
        id: updated.id,
        owner_id: updated.user_id,
        user_name: updated.user?.full_name || "Member",
        encounter_type: updated.encounter_type.replace("_", " "),
        location: updated.location_address || "Unknown",
        assigned_attorney_id: updated.assigned_attorney_id,
        status: updated.status,
        performed_by: payload.id,
        timestamp: new Date()
      });

      // Notify User
      await emitSocketEvent("attorney-assigned", {
        userId: updated.user_id,
        attorneyName: updated.assigned_attorney?.full_name || "An Attorney",
        caseSubject: updated.encounter_type.replace("_", " "),
        caseId: updated.id,
        caseType: "sos",
      });
    }

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Case assignment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
