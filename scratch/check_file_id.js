const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const id = "33a891fb-614b-4a9c-8679-3e551080316e";
  const call = await prisma.callLog.findUnique({ where: { id } });
  const session = await prisma.encounterSession.findUnique({ where: { id } });

  console.log(`Checking ID ${id}:`);
  console.log("CallLog:", call ? "Found" : "Missing");
  console.log("EncounterSession:", session ? "Found" : "Missing");
}

main();
