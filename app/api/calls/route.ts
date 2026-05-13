import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { room, receiverId, callType } = await req.json();

    const callLog = await prisma.callLog.create({
      data: {
        room,
        caller_id: payload.id as string,
        receiver_id: receiverId as string,
        call_type: callType || "video",
        status: "initiated"
      }
    });

    return NextResponse.json({ callLog });
  } catch (error) {
    console.error("Create call log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
