import { AccessToken } from "livekit-server-sdk";
import { NextResponse } from "next/server";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get("room");
    const username = searchParams.get("username");

    if (!room) {
      return NextResponse.json({ error: "Missing room parameter" }, { status: 400 });
    }

    if (!username) {
      return NextResponse.json({ error: "Missing username parameter" }, { status: 400 });
    }

    // Optional: Authenticate the user
    const token = await getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const currentUserId = payload.id as string;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Security Check: Ensure the user is part of the room
    const cleanUserId = currentUserId.replace(/-/g, "");
    if (!room.includes(cleanUserId)) {
      console.error("[LiveKit API] Unauthorized access attempt", { room, cleanUserId });
      return NextResponse.json({ error: "Unauthorized access to this room" }, { status: 403 });
    }

    console.log(`[LiveKit API] Generating token - Room: ${room}, Identity: ${username}, UserID: ${currentUserId}`);

    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
    });

    at.addGrant({
      roomJoin: true,
      room: room,
      canPublish: true,
      canSubscribe: true,
    });

    return NextResponse.json({ token: await at.toJwt() });
  } catch (error) {
    console.error("LiveKit token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
