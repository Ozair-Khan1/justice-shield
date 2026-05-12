import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthToken, verifyJwt } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = payload.id;

    // Fetch messages where this user is the receiver and they are unread
    const unreadMessages = await prisma.chatMessage.findMany({
      where: {
        receiver_id: userId,
        is_read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            full_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
      take: 5, // Limit to recent 10 to avoid toast spam
    });

    return NextResponse.json({ unreadMessages });
  } catch (error) {
    console.error("Unread messages fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
