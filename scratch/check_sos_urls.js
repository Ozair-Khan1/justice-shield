const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.encounterSession.findMany({
    where: { recording_url: { not: null } },
    select: { id: true, recording_url: true }
  });
  
  console.log("SOS Recordings in DB:");
  sessions.forEach(s => {
    console.log(`- ID: ${s.id}, URL: ${s.recording_url}`);
  });
}

main();
