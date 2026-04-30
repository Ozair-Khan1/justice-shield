import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(token);

    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("SOS Trigger Payload:", body);
    const { encounter_type, location_lat, location_lng } = body;

    let address = null;
    if (location_lat !== null && location_lng !== null) {
      console.log(`Reverse Geocoding: ${location_lat}, ${location_lng}`);
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location_lat}&lon=${location_lng}`,
          { headers: { "User-Agent": "JusticeShieldApp/1.0" } }
        );

        if (!geoRes.ok) {
          console.error("Nominatim Rate Limit Hit (429)");
          address = "Address lookup pending (Rate limited)";
        } else {
          const geoData = await geoRes.json();
          address = geoData.display_name;
          console.log("Resolved Address:", address);
        }
      } catch (e) {
        console.error("Geocoding network error:", e);
        address = "Address lookup failed (Network error)";
      }
    }

    // Create the session
    const session = await prisma.encounterSession.create({
      data: {
        user_id: payload.id as string,
        encounter_type,
        status: "active",
        location_lat: (location_lat !== null && location_lat !== undefined) ? Number(location_lat) : null,
        location_lng: (location_lng !== null && location_lng !== undefined) ? Number(location_lng) : null,
        location_address: address,
        attorney_name: "Testing Attorney",
      },
    });

    console.log("Session Created Successfully:", session.id);

    // Fetch user for emergency contact details
    const user = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { emergency_contact_name: true, emergency_contact_phone: true },
    });

    // Create an alert record if contact info exists
    if (user?.emergency_contact_name || user?.emergency_contact_phone) {
      await prisma.emergencyAlert.create({
        data: {
          session_id: session.id,
          user_id: payload.id as string,
          contact_name: user.emergency_contact_name,
          contact_phone: user.emergency_contact_phone,
          message: `EMERGENCY: ${user.emergency_contact_name || "Contact"}, your contact is in a ${encounter_type.replace("_", " ")} and has triggered an SOS through Justice Shield.`,
        },
      });
    }

    return NextResponse.json({ session });
  } catch (error) {
    console.error("SOS API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
