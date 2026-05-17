const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.encounterSession.findMany({
    where: { recording_url: { not: null } },
    select: { id: true, recording_url: true, recorded_by_id: true }
  });
  console.log("Recorded SOS Sessions:", sessions);
}

main();
