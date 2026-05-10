import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthToken, verifyJwt } from "@/lib/jwt";
import { sendContactReplyEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, replyMessage, hasReplied } = await req.json();

    if (!id || !replyMessage) {
      return NextResponse.json({ error: "Message ID and reply content are required" }, { status: 400 });
    }

    // Fetch the original message
    const contactMessage = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!contactMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (contactMessage.hasReplied) {
      return NextResponse.json({ error: "This message has already been replied to" }, { status: 400 });
    }

    // Send the email
    await sendContactReplyEmail(
      contactMessage.email,
      contactMessage.name,
      contactMessage.message,
      replyMessage
    );

    // Mark as replied, and update status to read if it was unread
    await prisma.contactMessage.update({
      where: { id },
      data: {
        hasReplied: true,
        status: contactMessage.status === "unread" ? "read" : contactMessage.status
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reply Contact Message Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send reply" }, { status: 500 });
  }
}
