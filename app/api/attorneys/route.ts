import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const specialty = searchParams.get("specialty");

    const attorneys = await prisma.user.findMany({
      where: {
        role: "ATTORNEY",
        ...(specialty ? {
          specialties: {
            contains: specialty,
            mode: "insensitive"
          }
        } : {})
      },
      orderBy: { full_name: "asc" },
      select: {
        id: true,
        full_name: true,
        email: true,
        phone: true,
        firm_name: true,
        specialties: true,
        years_experience: true,
      },
    });

    return NextResponse.json({ attorneys });
  } catch (err) {
    console.error("Attorneys API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
