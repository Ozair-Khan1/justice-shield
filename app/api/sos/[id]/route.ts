import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.encounterSession.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            full_name: true,
            email: true,
            phone: true,
          }
        },
        assigned_attorney: {
          select: {
            full_name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
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
    const { status, assigned_attorney_id, notes } = body;

    const data: any = {};
    if (status) data.status = status;
    if (assigned_attorney_id) {
        data.assigned_attorney_id = assigned_attorney_id;
        // If an attorney is assigned, status automatically becomes "assigned" unless it's already "resolved"
        if (!status || status === "active") {
            data.status = "assigned";
        }
    }
    if (notes) data.notes = notes;
    if (status === "resolved") data.ended_at = new Date();

    const updatedSession = await prisma.encounterSession.update({
      where: { id },
      data,
      include: {
        assigned_attorney: {
            select: { full_name: true }
        }
      }
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("SOS PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
