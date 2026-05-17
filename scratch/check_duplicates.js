const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const sosId = "2c08f704-3821-48b3-8516-f85376f68a33";
  const call = await prisma.callLog.findUnique({ where: { id: sosId } });
  const session = await prisma.encounterSession.findUnique({ where: { id: sosId } });
  
  console.log("Checking for duplicate entries with ID:", sosId);
  console.log("Found in CallLog:", !!call);
  console.log("Found in EncounterSession:", !!session);
}

main();
