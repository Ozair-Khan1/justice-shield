import { NextRequest, NextResponse } from "next/server";
import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  RoomServiceClient,
} from "livekit-server-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const LIVEKIT_URL = process.env.LIVEKIT_URL || "http://localhost:7800";
const API_KEY = process.env.LIVEKIT_API_KEY!;
const API_SECRET = process.env.LIVEKIT_API_SECRET!;

const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);
const roomService = new RoomServiceClient(LIVEKIT_URL, API_KEY, API_SECRET);

export async function POST(req: NextRequest) {
  try {
    const { roomName, callId, recordedById } = await req.json();

    if (!roomName || !callId || !recordedById) {
      return NextResponse.json(
        { error: "Missing roomName, callId, or recordedById" },
        { status: 400 }
      );
    }

    console.log("[START] Called at:", new Date().toISOString(), "roomName:", roomName);

    let type: "call" | "session" = "call";
    let existing = await prisma.callLog.findUnique({ where: { id: callId } });
    if (!existing) {
      const session = await prisma.encounterSession.findUnique({ where: { id: callId } });
      if (session) {
        existing = session as any;
        type = "session";
      }
    }

    if (existing?.egress_id) {
      return NextResponse.json({
        message: "Recording already active",
        egressId: existing.egress_id,
      });
    }

    // Wait for at least 1 participant to be in the room
    let participants = [];
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      try {
        participants = await roomService.listParticipants(roomName);
        console.log(`[START] Participants in room: ${participants.length}`);
        if (participants.length >= 1) break;
      } catch (e) {
        console.log(`[START] Room not ready yet, attempt ${attempts + 1}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    if (participants.length === 0) {
      return NextResponse.json(
        { error: "No participants in room after waiting" },
        { status: 400 }
      );
    }

    // Extra buffer for tracks to be published
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const fileName = `recording_${roomName}_${Date.now()}.mp4`;
    const dbPath = `/recordings/${fileName}`;
    const containerPath = `/recordings/${fileName}`;

    const fileOutput = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: containerPath,
    });

    const info = await egressClient.startRoomCompositeEgress(roomName, fileOutput, {
      layout: "grid",
      customBaseUrl: "http://127.0.0.1:7800",
    });

    console.log("[START] Egress started:", info.egressId);

    const updateData = {
      egress_id: info.egressId,
      recording_url: dbPath,
      recorded_by_id: recordedById,
      recording_started_at: new Date(),
    };

    if (type === "call") {
      await prisma.callLog.update({ where: { id: callId }, data: updateData });
    } else {
      await prisma.encounterSession.update({ where: { id: callId }, data: updateData });
    }

    return NextResponse.json({ egressId: info.egressId });
  } catch (err: any) {
    console.error("FULL ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}