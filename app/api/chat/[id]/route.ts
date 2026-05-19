import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthToken, verifyJwt } from "@/lib/jwt";

export const dynamic = "force-dynamic";

async function canChat(userId: string, otherId: string, role?: string) {
  if (role === "ADMIN") return false;

  const otherUser = await prisma.user.findUnique({
    where: { id: otherId },
    select: { role: true },
  });
  if (otherUser?.role === "ADMIN") return false;

  const intakeCount = await prisma.civilIntake.count({
    where: {
      OR: [
        { user_id: userId, assigned_attorney_id: otherId, status: { in: ["resolved", "active"] } },
        { user_id: otherId, assigned_attorney_id: userId, status: { in: ["resolved", "active"] } },
      ],
    },
  });
  if (intakeCount > 0) return true;

  const sessionCount = await prisma.encounterSession.count({
    where: {
      OR: [
        { user_id: userId, assigned_attorney_id: otherId, status: { in: ["active", "resolved"] } },
        { user_id: otherId, assigned_attorney_id: userId, status: { in: ["active", "resolved"] } },
      ],
    },
  });

  return sessionCount > 0;
}

// GET: Fetch all messages between current user and [id] (the other user)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: otherId } = await params;
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = payload.id as string;

    const hasAccess = await canChat(userId, otherId, payload.role as string);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden: No active assignment" }, { status: 403 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { sender_id: userId, receiver_id: otherId },
          { sender_id: otherId, receiver_id: userId },
        ],
      },
      orderBy: { created_at: "asc" },
      include: {
        sender: { select: { id: true, full_name: true, role: true } },
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: Send a message to user [id]
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: receiverId } = await params;
    const { content } = await req.json();
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess = await canChat(payload.id as string, receiverId, payload.role as string);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden: No active assignment" }, { status: 403 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        content,
        sender_id: payload.id as string,
        receiver_id: receiverId,
      },
      include: {
        sender: { select: { id: true, full_name: true, role: true } },
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Chat post error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PATCH: Mark all messages from [id] to current user as read
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: senderId } = await params;
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const hasAccess = await canChat(payload.id as string, senderId, payload.role as string);
    if (!hasAccess) {
      return NextResponse.json({ error: "Forbidden: No active assignment" }, { status: 403 });
    }

    await prisma.chatMessage.updateMany({
      where: {
        sender_id: senderId,
        receiver_id: payload.id,
        is_read: false,
      },
      data: { is_read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Chat read update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
