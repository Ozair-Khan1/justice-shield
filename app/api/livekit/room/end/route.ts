import { NextResponse } from "next/server";
import { RoomServiceClient } from "livekit-server-sdk";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { room } = await req.json();
    if (!room) {
      return NextResponse.json({ error: "Missing room name" }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ error: "LiveKit not configured" }, { status: 500 });
    }

    const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);
    
    try {
      await roomService.deleteRoom(room);
      console.log(`[LiveKit API] Room closed on dashboard: ${room}`);
    } catch (e: any) {
      const msg = e.message || String(e);
      // If room was already closed/deleted, it is expected and clean
      if (!msg.toLowerCase().includes("does not exist") && !msg.toLowerCase().includes("not found")) {
        console.log(`[LiveKit API] Notice when closing room ${room}:`, msg);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[LiveKit API] Failed to end room:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
