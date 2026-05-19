import { PrismaClient } from "@prisma/client";
import { EgressClient } from "livekit-server-sdk";

const prisma = new PrismaClient();

const LIVEKIT_URL = "http://127.0.0.1:7800";
const API_KEY = "devkey";
const API_SECRET = "12345678901234567890123456789012";

const egressClient = new EgressClient(LIVEKIT_URL, API_KEY, API_SECRET);

async function main() {
  console.log("Fetching all egresses...");
  const egresses = await egressClient.listEgress();

  const calls = await prisma.callLog.findMany({ where: { egress_id: { not: null } } });
  for (const call of calls) {
    const egress = egresses.find(e => e.egressId === call.egress_id);
    if (egress && egress.fileResults && egress.fileResults.length > 0) {
      const result = egress.fileResults[0];
      if (result.startedAt && result.endedAt) {
        const start = new Date(Number(result.startedAt / BigInt(1000000)));
        const end = new Date(Number(result.endedAt / BigInt(1000000)));
        await prisma.callLog.update({
          where: { id: call.id },
          data: {
            recording_started_at: start,
            recording_ended_at: end,
          }
        });
        console.log(`Updated CallLog ${call.id} with exact duration.`);
      }
    }
  }

  const sessions = await prisma.encounterSession.findMany({ where: { egress_id: { not: null } } });
  for (const session of sessions) {
    const egress = egresses.find(e => e.egressId === session.egress_id);
    if (egress && egress.fileResults && egress.fileResults.length > 0) {
      const result = egress.fileResults[0];
      if (result.startedAt && result.endedAt) {
        const start = new Date(Number(result.startedAt / BigInt(1000000)));
        const end = new Date(Number(result.endedAt / BigInt(1000000)));
        await prisma.encounterSession.update({
          where: { id: session.id },
          data: {
            recording_started_at: start,
            recording_ended_at: end,
          }
        });
        console.log(`Updated EncounterSession ${session.id} with exact duration.`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
