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

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      password_hash,
      role: "ADMIN",
      full_name: "Platform Admin",
    },
    create: {
      email: adminEmail,
      password_hash,
      role: "ADMIN",
      full_name: "Platform Admin",
      membership_tier: "enterprise",
    },
  });

  console.log(`✅ Admin ${admin.email} is ready (Created or Updated)`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
