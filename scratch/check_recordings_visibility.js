const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const userId = "a73d4224-6a60-43c1-915c-0daaeefa9627"; // The user from logs
  
  const sessions = await prisma.encounterSession.findMany({
    where: {
      recording_url: { not: null },
      OR: [
        { recorded_by_id: userId },
        { 
          AND: [
            { recorded_by_id: null },
            { OR: [{ user_id: userId }, { assigned_attorney_id: userId }] }
          ]
        }
      ]
    }
  });
  
  console.log("Recordings for User:", sessions.length);
  sessions.forEach(s => {
    console.log(`- ID: ${s.id}, URL: ${s.recording_url}, RecordedBy: ${s.recorded_by_id}`);
  });
}

main();
