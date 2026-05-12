import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";
import { emitSocketEvent } from "@/lib/socket-emit";

export async function POST(req: Request) {
  console.log("!!! CIVIL INTAKE API HIT !!!");
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { id, matterType, urgency, subject, description, preferredContact, metadata, assignedAttorneyId, opposingParty, opposingPartyLocation, status } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
    }

    let intake;
    if (id) {
      // Update existing (e.g. from draft to pending)
      intake = await prisma.civilIntake.update({
        where: { id, user_id: user.id },
        data: {
          matter_type: matterType,
          urgency: urgency,
          subject,
          description,
          preferred_contact: preferredContact,
          status: status || "pending",
          metadata: metadata || {},
          assigned_attorney_id: assignedAttorneyId || null,
          opposing_party: opposingParty || null,
          opposing_party_location: opposingPartyLocation || null,
        },
      });
    } else {
      // Create new
      intake = await prisma.civilIntake.create({
        data: {
          user_id: user.id,
          matter_type: matterType || "other",
          urgency: urgency || "standard",
          subject,
          description,
          preferred_contact: preferredContact || "phone",
          status: status || "pending",
          metadata: metadata || {},
          assigned_attorney_id: assignedAttorneyId || null,
          opposing_party: opposingParty || null,
          opposing_party_location: opposingPartyLocation || null,
        },
      });
    }

    // Trigger Socket Notification for Admins/Attorneys
    if (intake.status === "pending" || intake.status === "assigned") {
      console.log("[CIVIL_API] Triggering Civil Intake notification...");
      await emitSocketEvent("civil-intake-triggered", {
        type: "CIVIL_INTAKE",
        id: intake.id,
        owner_id: intake.user_id,
        user_name: user.full_name || "Unknown Member",
        subject: intake.subject,
        urgency: intake.urgency,
        assigned_attorney_id: intake.assigned_attorney_id || null,
        performed_by: payload.id,
        timestamp: new Date()
      });
    }

    return NextResponse.json({ intake });
  } catch (error) {
    console.error("Civil intake creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
