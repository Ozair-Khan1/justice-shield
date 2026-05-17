const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const recordings = await prisma.encounterSession.findMany({
    where: { recording_url: { not: null } },
    include: { user: true, assigned_attorney: true }
  });
  
  console.log("Found SOS Recordings:", recordings.length);
  recordings.forEach(r => {
    console.log("---");
    console.log("ID:", r.id);
    console.log("User:", r.user ? r.user.full_name : "NULL");
    console.log("Recording URL:", r.recording_url);
    console.log("Recorded By ID:", r.recorded_by_id);
    console.log("Started At:", r.started_at);
  });
}

main();
