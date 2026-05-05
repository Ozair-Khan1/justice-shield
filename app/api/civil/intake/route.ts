import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function POST(req: Request) {
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
    const { matterType, urgency, subject, description, preferredContact, metadata, assignedAttorneyId } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
    }

    const intake = await prisma.civilIntake.create({
      data: {
        user_id: user.id,
        matter_type: matterType || "other",
        urgency: urgency || "standard",
        subject,
        description,
        preferred_contact: preferredContact || "phone",
        status: "pending",
        metadata: metadata || {},
        assigned_attorney_id: assignedAttorneyId || null,
      },
    });

    return NextResponse.json({ intake });
  } catch (error) {
    console.error("Civil intake creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
