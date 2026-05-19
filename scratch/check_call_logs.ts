import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const calls = await prisma.callLog.findMany({
    orderBy: { started_at: "desc" },
    take: 5,
  });
  console.log("Recent CallLogs:", JSON.stringify(calls, null, 2));

  const sessions = await prisma.encounterSession.findMany({
    orderBy: { started_at: "desc" },
    take: 5,
  });
  console.log("Recent EncounterSessions:", JSON.stringify(sessions, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
