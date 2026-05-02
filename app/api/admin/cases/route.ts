import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const intakes = await prisma.civilIntake.findMany({
      include: {
        user: {
          select: {
            full_name: true,
            email: true,
          }
        },
        assigned_attorney: {
          select: {
            full_name: true,
          }
        }
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ intakes });
  } catch (error) {
    console.error("Admin fetch cases error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
