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
        specialties: true,
        city: true,
        country: true,
        seen_notification_ids: true,
        stripe_customer_id: true,
        stripe_subscription_id: true,
        subscription_cancel_at: true,
        emergency_alerts: {
          select: {
            id: true,
            contact_name: true,
            contact_phone: true,
            message: true,
            sent_at: true,
          },
          orderBy: { sent_at: "desc" },
        },
        encounter_sessions: {
          select: {
            id: true,
            encounter_type: true,
            status: true,
            started_at: true,
          },
          orderBy: { started_at: "desc" },
        },
        civil_intakes: {
          select: {
            id: true,
            matter_type: true,
            status: true,
            created_at: true,
          },
          orderBy: { created_at: "desc" },
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

