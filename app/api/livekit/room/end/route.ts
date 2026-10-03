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
      console.log(`[LiveKit API] Room deleted successfully on dashboard: ${room}`);
    } catch (e: any) {
      // Room may already be closed or empty
      console.log(`[LiveKit API] Notice when closing room ${room}:`, e.message || e);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[LiveKit API] Failed to end room:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
