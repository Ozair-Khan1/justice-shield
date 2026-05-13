const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const calls = await prisma.callLog.findMany({
    orderBy: { started_at: "desc" },
    take: 5,
    include: {
        caller: { select: { email: true, full_name: true } },
        receiver: { select: { email: true, full_name: true } }
    }
  });
  console.log(JSON.stringify(calls, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
