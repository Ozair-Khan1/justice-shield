import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const specialty = searchParams.get("specialty");
    const city = searchParams.get("city");
    const country = searchParams.get("country");

    // Build location conditions
    const locationConditions: any[] = [
      ...(city ? [{ city: { contains: city, mode: "insensitive" as const } }] : []),
      ...(country ? [{ country: { contains: country, mode: "insensitive" as const } }] : []),
    ];

    // If specialty is provided, location (city or country) is REQUIRED.
    // Attorney-only specialty match without a location overlap is not returned.
    const where: any = {
      role: "ATTORNEY",
      password_hash: { not: `LOCKED${process.env.LOCKED_PASS}` }
    };

    if (specialty && locationConditions.length > 0) {
      // Must match specialty AND (city OR country)
      where.AND = [
        { specialties: { contains: specialty, mode: "insensitive" } },
        { OR: locationConditions },
      ];
    } else if (specialty && locationConditions.length === 0) {
      // Specialty provided but no location — return nothing (location required)
      return NextResponse.json({ attorneys: [] });
    } else if (!specialty && locationConditions.length > 0) {
      // Location only (no specialty filter) — return all attorneys in that location
      where.OR = locationConditions;
    }
    // If neither specialty nor location: return all attorneys (admin/general use)

    const attorneys = await prisma.user.findMany({
      where,
      orderBy: [
        // City matches first, then country matches
        { city: "asc" },
        { full_name: "asc" },
      ],
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
    });

    const attorneysWithCount = attorneys.map(a => ({
      ...a,
      total_cases: a.assigned_intakes.length + a.assigned_encounters.length,
      resolved_cases: a.assigned_intakes.filter(i => i.status === "resolved").length +
        a.assigned_encounters.filter(e => e.status === "resolved").length,
      assigned_intakes: undefined,
      assigned_encounters: undefined
    }));

    return NextResponse.json({ attorneys: attorneysWithCount });
  } catch (err) {
    console.error("Attorneys API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
