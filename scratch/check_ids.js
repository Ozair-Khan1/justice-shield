const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const recordings = await prisma.encounterSession.findMany({
    where: { recording_url: { not: null } },
    select: { id: true, user_id: true, recorded_by_id: true, recording_url: true }
  });
  
  console.log("SOS Recording Details:");
  recordings.forEach(r => {
    console.log(`- SessionID: ${r.id}`);
    console.log(`  OwnerID: ${r.user_id}`);
    console.log(`  RecorderID: ${r.recorded_by_id}`);
    console.log(`  URL: ${r.recording_url}`);
  });
}

main();
