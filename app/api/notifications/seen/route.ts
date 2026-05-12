import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { notificationIds } = await req.json();
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const userId = payload.id as string;
    // Get current seen IDs
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { seen_notification_ids: true }
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const currentSeen = new Set(user.seen_notification_ids);
    let changed = false;

    notificationIds.forEach(id => {
      if (!currentSeen.has(id)) {
        currentSeen.add(id);
        changed = true;
      }
    });

    if (changed) {
      // Keep only last 100 to avoid huge arrays
      const updatedList = Array.from(currentSeen).slice(-100);
      await prisma.user.update({
        where: { id: userId },
        data: { seen_notification_ids: updatedList }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seen notifications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
