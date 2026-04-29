import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const vendor = await prisma.vendorApplication.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ vendor });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
