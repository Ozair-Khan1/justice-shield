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
    const {
      encounter_type,
      location_lat,
      location_lng,
      confirm,
      location_address,
      assigned_attorney_id
    } = body;

    if (confirm) {
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
        select: { full_name: true, emergency_contact_name: true, emergency_contact_phone: true },
      });

      // Create the session
      const session = await prisma.encounterSession.create({
        data: {
          user: { connect: { id: payload.id as string } },
          encounter_type,
          status: assigned_attorney_id ? "assigned" : "active",
          location_lat: (location_lat !== null && location_lat !== undefined) ? Number(location_lat) : null,
          location_lng: (location_lng !== null && location_lng !== undefined) ? Number(location_lng) : null,
          location_address: location_address || null,
          assigned_attorney: assigned_attorney_id ? { connect: { id: assigned_attorney_id } } : undefined,
          attorney_name: attorney_name || null,
          emergency_contact_phone: user?.emergency_contact_phone,
        },
      });

      // Create an alert record if contact info exists
      if (user?.emergency_contact_phone) {
        await prisma.emergencyAlert.create({
          data: {
            session_id: session.id,
            user_id: payload.id as string,
            contact_name: user.emergency_contact_name,
            contact_phone: user.emergency_contact_phone,
            message: `EMERGENCY: ${user.emergency_contact_name || "Contact"}, your contact ${user.full_name || "Member"} is in a ${encounter_type.replace("_", " ")} and has triggered an SOS. ${attorney_name ? `Attorney ${attorney_name} has been assigned.` : "Waiting for attorney dispatch."}`,
          },
        });
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
      select: { city: true, country: true }
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

    // Fetch recommended attorneys based on encounter type
    const keywords = encounter_type.split("_");
    const allMatches = await prisma.user.findMany({
      where: {
        role: "ATTORNEY",
        password_hash: { not: `LOCKED${process.env.LOCKED_PASS}` },
        OR: keywords.map((kw: string) => ({
          specialties: { contains: kw, mode: "insensitive" }
        }))
      },
      select: {
        id: true,
        full_name: true,
        firm_name: true,
        specialties: true,
        years_experience: true,
        city: true,
        country: true,
      },
      take: 20,
    });

    // Prioritize: City match > Country match > Specialty match only
    const recommendedAttorneys = [...allMatches].sort((a, b) => {
      const aCityMatch = matchCity && a.city?.toLowerCase() === matchCity.toLowerCase() ? 2 : 0;
      const aCountryMatch = matchCountry && a.country?.toLowerCase() === matchCountry.toLowerCase() ? 1 : 0;
      const bCityMatch = matchCity && b.city?.toLowerCase() === matchCity.toLowerCase() ? 2 : 0;
      const bCountryMatch = matchCountry && b.country?.toLowerCase() === matchCountry.toLowerCase() ? 1 : 0;

      return (bCityMatch + bCountryMatch) - (aCityMatch + aCountryMatch);
    }).slice(0, 3);

    return NextResponse.json({ address, recommendedAttorneys });
  } catch (error) {
    console.error("SOS API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
