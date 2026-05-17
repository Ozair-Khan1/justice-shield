const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const userId = "8b4cdcb4-938c-47d3-8f1a-7ba7917b07cd";
  
  const callLogs = await prisma.callLog.findMany({
    where: {
      recording_url: { not: null },
      OR: [{ recorded_by_id: userId }, { caller_id: userId }, { receiver_id: userId }]
    },
    orderBy: { started_at: "desc" }
  });

  const sessions = await prisma.encounterSession.findMany({
    where: {
      recording_url: { not: null },
      OR: [{ user_id: userId }, { assigned_attorney_id: userId }, { recorded_by_id: userId }]
    },
    orderBy: { started_at: "desc" }
  });

  console.log(`User ${userId} Recordings:`);
  console.log("--- CALLS ---");
  callLogs.forEach(l => console.log(`[${l.started_at.toISOString()}] ${l.id}`));
  console.log("--- SOS ---");
  sessions.forEach(s => console.log(`[${s.started_at.toISOString()}] ${s.id}`));
}

main();
