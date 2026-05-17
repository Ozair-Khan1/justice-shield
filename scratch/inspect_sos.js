const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const sosId = "2c08f704-3821-48b3-8516-f85376f68a33";
  const session = await prisma.encounterSession.findUnique({ where: { id: sosId } });
  console.log("Full SOS Session Data:", session);
}

main();
