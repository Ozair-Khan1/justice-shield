import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJwt, getAuthToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = payload.id as string;

    // Fetch user from DB to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    const isAdmin = user?.role === "ADMIN";

    // Fetch recordings
    const callLogs = await prisma.callLog.findMany({
      where: {
        recording_url: { not: null },
        ...(isAdmin ? {} : {
          OR: [
            { recorded_by_id: userId },
            {
              AND: [
                { recorded_by_id: null },
                { OR: [{ caller_id: userId }, { receiver_id: userId }] }
              ]
            }
          ]
        })
      },
      include: {
        caller: { select: { full_name: true, email: true } },
        receiver: { select: { full_name: true, email: true } },
      },
      orderBy: { started_at: "desc" },
    });

    const encounterSessions = await prisma.encounterSession.findMany({
      where: {
        recording_url: { not: null },
        ...(isAdmin ? {} : {
          OR: [
            { user_id: userId },
            { assigned_attorney_id: userId },
            { recorded_by_id: userId }
          ]
        })
      },
      include: {
        user: { select: { full_name: true, email: true } },
        assigned_attorney: { select: { full_name: true, email: true } },
      },
      orderBy: { started_at: "desc" },
    });

    console.log(`[Recordings API] Found ${callLogs.length} calls and ${encounterSessions.length} SOS sessions for user ${userId}`);

    const recordings = [
      ...callLogs.map(log => ({
        id: log.id,
        type: log.call_type?.toLowerCase() === "audio" || log.call_type?.toLowerCase() === "voice" ? "Voice Call" : "Video Call",
        url: log.recording_url,
        started_at: log.recording_started_at || log.started_at,
        ended_at: log.recording_ended_at || log.ended_at,
        participants: `${log.caller?.full_name || log.caller?.email || "Unknown"} & ${log.receiver?.full_name || log.receiver?.email || "Unknown"}`,
        room: log.room
      })),
      ...encounterSessions.map(session => {
        console.log(`[Recordings API] Mapping SOS session ${session.id}, URL: ${session.recording_url}`);
        const userName = session.user?.full_name || session.user?.email || "Unknown User";
        const attorneyName = session.assigned_attorney ? (session.assigned_attorney.full_name || session.assigned_attorney.email) : "(Unassigned)";

        return {
          id: session.id,
          type: "SOS Encounter",
          url: session.recording_url,
          started_at: session.recording_started_at || session.started_at,
          ended_at: session.recording_ended_at || session.ended_at,
          participants: `${userName} & ${attorneyName}`,
          room: session.id
        };
      })
    ];

    // Sort by date descending
    recordings.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    return NextResponse.json({ recordings });
  } catch (error) {
    console.error("Recordings API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
