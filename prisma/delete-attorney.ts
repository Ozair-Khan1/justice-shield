import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.user.deleteMany({
            where: {
                role: "ATTORNEY"
            }
        });
        console.log(`Deleted ${result.count} attorneys.`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
