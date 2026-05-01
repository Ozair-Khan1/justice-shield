import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASS;

  if (!adminEmail || !adminPassword) {
    throw new Error("❌ Missing ADMIN_EMAIL or ADMIN_PASS in .env file");
  }

  console.log(`Checking admin: ${adminEmail}`);

  const password_hash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.delete({
    where: { email: 'admin@test' },
  });
  console.log(`✅ Admin ${admin.email} is deleted`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
