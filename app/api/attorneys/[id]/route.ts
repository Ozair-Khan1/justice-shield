import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { role, id: currentUserId } = payload as { role: string; id: string };

    const attorney = await prisma.user.findUnique({
      where: { id, role: "ATTORNEY" },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        firm_name: true,
        specialties: true,
        years_experience: true,
        city: true,
        country: true,
        assigned_intakes: {
          select: {
            id: true,
            subject: true,
            status: true,
            matter_type: true,
            urgency: true,
            created_at: true,
            user_id: true,
            description: true,
            preferred_contact: true,
            opposing_party: true,
            opposing_party_location: true,
            rejection_message: true,
            user: {
              select: {
                full_name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { created_at: "desc" }
        },
        assigned_encounters: {
          select: {
            id: true,
            encounter_type: true,
            status: true,
            started_at: true,
            user_id: true,
            notes: true,
            location_address: true,
            rejection_message: true,
            user: {
              select: {
                full_name: true,
                email: true,
                phone: true
              }
            }
          },
          orderBy: { started_at: "desc" }
        }
      }
    });

    if (!attorney) return NextResponse.json({ error: "Attorney not found" }, { status: 404 });

    // Filter cases based on role
    // Admins see everything, Users see only their own cases with this attorney
    let filteredIntakes = attorney.assigned_intakes;
    let filteredEncounters = attorney.assigned_encounters;

    if (role !== "ADMIN") {
      filteredIntakes = attorney.assigned_intakes.filter(i => i.user_id === currentUserId);
      filteredEncounters = attorney.assigned_encounters.filter(e => e.user_id === currentUserId);
    }

    return NextResponse.json({
      attorney: {
        ...attorney,
        assigned_intakes: filteredIntakes,
        assigned_encounters: filteredEncounters
      }
    });
  } catch (error) {
    console.error("Attorney details API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
