import { NextRequest, NextResponse } from "next/server";
import {
  EgressClient,
  EncodedFileOutput,
  EncodedFileType,
  RoomServiceClient,
  S3Upload,
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
    const dbPath = `/api/recordings/serve/${fileName}`;

    // Backblaze B2 S3 storage output
    const b2KeyId = process.env.B2_KEY_ID!;
    const b2AppKey = process.env.B2_APPLICATION_KEY!;
    const b2Bucket = process.env.B2_BUCKET_NAME || "Justice-Shield";
    const b2Endpoint = process.env.B2_ENDPOINT || "https://s3.us-east-005.backblazeb2.com";
    const b2Region = process.env.B2_REGION || "us-east-005";

    const s3 = new S3Upload({
      accessKey: b2KeyId,
      secret: b2AppKey,
      bucket: b2Bucket,
      endpoint: b2Endpoint,
      region: b2Region,
      forcePathStyle: true,
    });

    const fileOutput = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: fileName,
      output: {
        case: "s3",
        value: s3,
      },
    });

    console.log("[START] Launching composite egress with Backblaze B2 output to bucket:", b2Bucket);

    const info = await egressClient.startRoomCompositeEgress(roomName, fileOutput, {
      layout: "grid",
    });

    console.log("[START] Egress started successfully:", info.egressId);

    const updateData = {
      egress_id: info.egressId,
      recorded_by_id: recordedById,
      recording_started_at: new Date(),
      recording_url: dbPath,
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
