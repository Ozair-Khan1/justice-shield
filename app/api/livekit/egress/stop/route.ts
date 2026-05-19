import { NextRequest, NextResponse } from "next/server";
import { EgressClient, EgressStatus } from "livekit-server-sdk";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

const LIVEKIT_URL = process.env.LIVEKIT_URL || "http://localhost:7800";
const API_KEY = process.env.LIVEKIT_API_KEY!;
const API_SECRET = process.env.LIVEKIT_API_SECRET!;

const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);

export async function POST(req: NextRequest) {
  try {
    const { callId } = await req.json();

    if (!callId) {
      return NextResponse.json(
        { error: "Missing callId" },
        { status: 400 }
      );
    }

    console.log("[STOP] Called at:", new Date().toISOString(), "callId:", callId);

    // Check both CallLog and EncounterSession
    let type: "call" | "session" = "call";
    let record = await prisma.callLog.findUnique({ where: { id: callId } });
    if (!record) {
      const session = await prisma.encounterSession.findUnique({ where: { id: callId } });
      if (session) {
        record = session as any;
        type = "session";
      }
    }

    if (!record?.egress_id) {
      return NextResponse.json({ success: true });
    }

    // Stop the egress
    const list = await egressClient.listEgress();
    const egress = list.find((e) => e.egressId === record!.egress_id);

    let recordingEndTime = new Date();
    if (egress && egress.status === EgressStatus.EGRESS_ACTIVE) {
      recordingEndTime = new Date();
      await egressClient.stopEgress(record.egress_id!);
    }

    // Wait for Egress to finish encoding
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Files are now automatically available in the mapped volume,
    // so we don't need to copy them manually or list them!
    let recordingUrl: string | null = null;

    // Fetch final egress info to get exact recording timestamps
    const finalList = await egressClient.listEgress();
    const finalEgress = finalList.find((e) => e.egressId === record!.egress_id);

    let exactStartedAt = recordingEndTime;
    let exactEndedAt = recordingEndTime;

    if (finalEgress?.fileResults?.[0]) {
      // LiveKit returns nanoseconds as BigInt, convert to milliseconds
      exactStartedAt = new Date(Number(finalEgress.fileResults[0].startedAt / BigInt(1000000)));
      exactEndedAt = new Date(Number(finalEgress.fileResults[0].endedAt / BigInt(1000000)));
    }

    // Update DB with exact timestamps and recording url
    const updateData: any = {
      recording_started_at: exactStartedAt,
      recording_ended_at: exactEndedAt,
    };

    if (recordingUrl) {
      updateData.recording_url = recordingUrl;
    }

    if (type === "call") {
      await prisma.callLog.update({ where: { id: callId }, data: updateData });
    } else {
      await prisma.encounterSession.update({ where: { id: callId }, data: updateData });
    }

    // Emit notification that recording is saved
    try {
      const { emitSocketEvent } = await import("@/lib/socket-emit");
      const targetUserId = (record as any).recorded_by_id;
      
      if (targetUserId) {
        await emitSocketEvent("recording-saved", { 
          callId, 
          targetUserId 
        });
      }
    } catch (err) {
      console.error("[STOP] Failed to emit recording notification:", err);
    }

    return NextResponse.json({ success: true, recordingUrl });
  } catch (err: any) {
    console.error("Stop error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}