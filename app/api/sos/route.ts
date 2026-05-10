import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";
import { any } from "zod";

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
    const {
      encounter_type,
      location_lat,
      location_lng,
      confirm,
      location_address,
      assigned_attorney_id,
      alertId
    } = body;

    if (confirm === true) {
      let attorney_name = null;
      if (assigned_attorney_id) {
        const attorney = await prisma.user.findUnique({
          where: { id: assigned_attorney_id },
          select: { full_name: true }
        });
        attorney_name = attorney?.full_name;
      }

      // Fetch user for emergency contact details
      const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: { full_name: true, email: true, emergency_contact_name: true, emergency_contact_phone: true },
      });

      // Create the session
      const session = await prisma.encounterSession.create({
        data: {
          user: { connect: { id: payload.id as string } },
          encounter_type,
          status: assigned_attorney_id ? "assigned" : "pending",
          location_lat: (location_lat !== null && location_lat !== undefined) ? Number(location_lat) : null,
          location_lng: (location_lng !== null && location_lng !== undefined) ? Number(location_lng) : null,
          location_address: location_address || null,
          assigned_attorney: assigned_attorney_id ? { connect: { id: assigned_attorney_id } } : undefined,
          attorney_name: attorney_name || null,
          emergency_contact_phone: user?.emergency_contact_phone,
          started_at: new Date(),
        },
        include: {
          assigned_attorney: {
            select: { full_name: true, email: true, phone: true }
          }
        }
      });

      // Link the existing alert to this session
      if (alertId) {
        await prisma.emergencyAlert.update({
          where: { id: alertId },
          data: {
            session_id: session.id,
            message: `EMERGENCY: ${user?.emergency_contact_name || "Contact"}, your contact ${user?.full_name || "Member"} is in a ${encounter_type.replace("_", " ")} and has triggered an SOS. ${attorney_name ? `Attorney ${attorney_name} has been assigned.` : "Waiting for attorney dispatch."}`,
          },
        }).catch(e => console.error("Link alert error:", e));
      }

      return NextResponse.json({ session });
    }

    // Recommendation Flow
    let address = null;
    let resolvedCity = null;
    let resolvedCountry = null;
    let geoApiError = false;

    if (location_lat != null && location_lng != null) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location_lat}&lon=${location_lng}&accept-language=en`,
          { headers: { "User-Agent": "JusticeShieldApp/1.0" } }
        );

        if (geoRes.ok) {
          const geoData = await geoRes.json();
          address = geoData.display_name || `${location_lat}, ${location_lng}`;
          resolvedCity = (geoData.address?.city || geoData.address?.town || geoData.address?.village || null);
          if (resolvedCity) {
            resolvedCity = resolvedCity.replace(/\s+Division$/i, "");
          }
          resolvedCountry = geoData.address?.country || null;

          // Automatically update user's account with this location
          if (resolvedCity || resolvedCountry) {
            await prisma.user.update({
              where: { id: payload.id as string },
              data: {
                city: resolvedCity || undefined,
                country: resolvedCountry || undefined
              }
            }).catch(e => console.error("Auto-update location error:", e));
          }
        } else {
          geoApiError = true;
          address = `${location_lat}, ${location_lng}`;
        }
      } catch (e) {
        geoApiError = true;
        address = `${location_lat}, ${location_lng}`;
      }
    }

    // Fetch the user to get their registered location for fallback
    const triggeringUser = await prisma.user.findUnique({
      where: { id: payload.id as string },
      select: { city: true, country: true, email: true, full_name: true, emergency_contact_name: true, emergency_contact_phone: true }
    });

    // Create an alert record immediately in the recommendation phase
    const alert = await prisma.emergencyAlert.create({
      data: {
        user_id: payload.id as string,
        contact_name: triggeringUser?.emergency_contact_name,
        contact_phone: triggeringUser?.emergency_contact_phone,
        message: `${triggeringUser?.full_name} has triggered an SOS of type ${encounter_type.replace("_", " ")} at ${address}`
      },
    });

    // If API failed and user has no location set, return error
    if (geoApiError && !triggeringUser?.city && !triggeringUser?.country) {
      return NextResponse.json({
        error: "Location service unavailable. Please set your City and Country in Account Settings first to enable attorney matching."
      }, { status: 403 });
    }

    // Use current location from GPS if available, otherwise fallback to profile
    const matchCity = resolvedCity || triggeringUser?.city;
    const matchCountry = resolvedCountry || triggeringUser?.country;

    // If no location data at all, we can't match attorneys strictly by location
    if (!matchCity && !matchCountry) {
      return NextResponse.json({
        address,
        recommendedAttorneys: [],
        warning: "No city or country found to filter attorneys."
      });
    }

    // Fetch attorneys that match BOTH specialty AND location (city or country required)
    const keywords = encounter_type.split("_");

    const locationConditions = [
      ...(matchCity ? [{ city: { contains: matchCity, mode: "insensitive" as const } }] : []),
      ...(matchCountry ? [{ country: { contains: matchCountry, mode: "insensitive" as const } }] : []),
    ];

    const allMatches = await prisma.user.findMany({
      where: {
        role: "ATTORNEY",
        password_hash: { not: `LOCKED${process.env.LOCKED_PASS}` },
        AND: [
          // Must match at least one specialty keyword
          {
            OR: keywords.map((kw: any) => ({
              specialties: { contains: kw, mode: "insensitive" }
            }))
          },
          // Must match city OR country — specialty-only match not allowed
          { OR: locationConditions }
        ]
      },
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
          select: { status: true }
        },
        assigned_encounters: {
          select: { status: true }
        }
      },
      take: 20,
    });

    // Within qualifying attorneys, sort city match above country-only match
    const recommendedAttorneys = (allMatches as any[]).map(a => ({
      ...a,
      total_cases: a.assigned_intakes.length + a.assigned_encounters.length,
      resolved_cases: a.assigned_intakes.filter((i: any) => i.status === "resolved").length +
        a.assigned_encounters.filter((e: any) => e.status === "resolved").length,
      assigned_intakes: undefined,
      assigned_encounters: undefined
    })).sort((a: any, b: any) => {
      const aCityMatch = matchCity && a.city?.toLowerCase() === matchCity.toLowerCase() ? 1 : 0;
      const bCityMatch = matchCity && b.city?.toLowerCase() === matchCity.toLowerCase() ? 1 : 0;
      return bCityMatch - aCityMatch;
    }).slice(0, 3);

    return NextResponse.json({ address, recommendedAttorneys, alertId: alert.id });
  } catch (error) {
    console.error("SOS API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
