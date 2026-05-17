import { NextRequest, NextResponse } from "next/server";
import { EgressClient, EgressStatus } from "livekit-server-sdk";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


const LIVEKIT_URL = process.env.LIVEKIT_URL || "http://localhost:7800";
const API_KEY = process.env.LIVEKIT_API_KEY!;
const API_SECRET = process.env.LIVEKIT_API_SECRET!;

const egressClient = new EgressClient(
  LIVEKIT_URL,
  API_KEY,
  API_SECRET
);

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

    const callLog = await prisma.callLog.findUnique({
      where: { id: callId },
    });

    if (!callLog?.egress_id) {
      return NextResponse.json({ success: true });
    }

    const list = await egressClient.listEgress();
    const egress = list.find(
      (e) => e.egressId === callLog.egress_id
    );

    if (egress && egress.status === EgressStatus.EGRESS_ACTIVE) {
      await egressClient.stopEgress(callLog.egress_id);
    }

    // Update with end time
    await prisma.callLog.update({
      where: { id: callId },
      data: { recording_ended_at: new Date() }
    });

    // Check if it's also an EncounterSession and update it if so
    await prisma.encounterSession.updateMany({
      where: { id: callId },
      data: { recording_ended_at: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Stop error:", err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}