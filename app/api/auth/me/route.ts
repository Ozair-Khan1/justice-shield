import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req);

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = await verifyJwt(token);

    if (!payload || !payload.id) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: {
        id: true,
        email: true,
        role: true,
        full_name: true,
        phone: true,
        membership_tier: true,
        emergency_contact_name: true,
        emergency_contact_phone: true,
        city: true,
        country: true,
        emergency_alerts: {
          select: {
            id: true,
            contact_name: true,
            contact_phone: true,
            message: true,
            sent_at: true,
          }
        },
        encounter_sessions: {
          select: {
            id: true,
            encounter_type: true,
            status: true,
            started_at: true,
          }
        },
        civil_intakes: {
          select: {
            id: true,
            matter_type: true,
            status: true,
            created_at: true,
          }
        },
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  try {
    const token = await getAuthToken(req);

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyJwt(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { full_name, phone, emergency_contact_name, emergency_contact_phone, city, country } = await req.json();

    const updatedUser = await prisma.user.update({
      where: { id: user.id as string },
      data: {
        full_name,
        phone,
        emergency_contact_name,
        emergency_contact_phone,
        city,
        country,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
