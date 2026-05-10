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

    // Fetch all messages involving this user (sent or received)
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { sender_id: userId },
          { receiver_id: userId },
        ],
      },
      orderBy: { created_at: "desc" },
      include: {
        sender: { select: { id: true, full_name: true, email: true, role: true } },
        receiver: { select: { id: true, full_name: true, email: true, role: true } },
      },
    });

    // Build unique conversation threads grouped by the other participant
    const threadMap = new Map<string, {
      participant: { id: string; full_name: string | null; email: string; role: string };
      lastMessage: string;
      lastMessageSenderId: string;
      lastMessageIsRead: boolean;
      updatedAt: Date;
      unreadCount: number;
    }>();

    for (const msg of messages) {
      const other = msg.sender_id === userId ? msg.receiver : msg.sender;
      const existing = threadMap.get(other.id);

      if (!existing) {
        threadMap.set(other.id, {
          participant: other,
          lastMessage: msg.content,
          lastMessageSenderId: msg.sender_id,
          lastMessageIsRead: msg.is_read,
          updatedAt: msg.created_at,
          unreadCount: (!msg.is_read && msg.receiver_id === userId) ? 1 : 0,
        });
      } else {
        if (!msg.is_read && msg.receiver_id === userId) {
          existing.unreadCount += 1;
        }
      }
    }


    const conversations = Array.from(threadMap.entries()).map(([participantId, thread]) => ({
      id: participantId, // use participant's userId as the conversation identifier
      participant: thread.participant,
      lastMessage: thread.lastMessage,
      updatedAt: thread.updatedAt,
      unreadCount: thread.unreadCount,
    }));

    conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Conversations fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
