import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req);

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(token);

    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch accepted cases for this user
    const civilIntakes = await prisma.civilIntake.findMany({
      where: {
        user_id: payload.id as string,
        status: "assigned", // we used "assigned" in the accept API
      },
      orderBy: { created_at: "desc" },
    });

    // Map attorney info since assigned_attorney stores the attorney's User ID
    const casesWithAttorneys = await Promise.all(
      civilIntakes.map(async (intake) => {
        if (!intake.assigned_attorney) {
          return { ...intake, attorney: null };
        }

        const attorney = await prisma.user.findUnique({
          where: { id: intake.assigned_attorney },
          select: {
            full_name: true,
            email: true,
            phone: true,
            firm_name: true,
          },
        });

        return { ...intake, attorney };
      })
    );

    return NextResponse.json({ cases: casesWithAttorneys });
  } catch (error) {
    console.error("Fetch user cases error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
