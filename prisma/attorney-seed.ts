import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ATTORNIES = [
  {
    email: "landlord.attorney@example.com",
    full_name: "Sarah Jenkins",
    firm_name: "Jenkins & Associates",
    specialties: "landlord_tenant",
    years_experience: 12,
    phone: "1234567890",
  },
  {
    email: "employment.lawyer@example.com",
    full_name: "Michael Chen",
    firm_name: "Pacific Legal Group",
    specialties: "employment",
    years_experience: 8,
    phone: "1234567890",
  },
  {
    email: "contract.expert@example.com",
    full_name: "Robert Miller",
    firm_name: "Miller Contract Law",
    specialties: "contracts",
    years_experience: 15,
    phone: "1234567890",
  },
  {
    email: "family.lawyer@example.com",
    full_name: "Elena Rodriguez",
    firm_name: "Heritage Family Law",
    specialties: "family",
    years_experience: 10,
    phone: "1234567890",
  },
  {
    email: "consumer.advocate@example.com",
    full_name: "David Thompson",
    firm_name: "Consumer Protection Partners",
    specialties: "consumer",
    years_experience: 7,
    phone: "1234567890",
  },
  {
    email: "general.counsel@example.com",
    full_name: "Amanda White",
    firm_name: "White & Blue Legal",
    specialties: "small_claims, other",
    years_experience: 5,
    phone: "1234567890",
  }
];

async function main() {
  console.log("Starting attorney seeding...");
  const password_hash = await bcrypt.hash("123456!", 12);

  for (const att of ATTORNIES) {
    const user = await prisma.user.upsert({
      where: { email: att.email },
      update: {
        full_name: att.full_name,
        password_hash,
        firm_name: att.firm_name,
        specialties: att.specialties,
        years_experience: att.years_experience,
        role: "ATTORNEY",
        phone: att.phone,
      },
      create: {
        email: att.email,
        password_hash,
        full_name: att.full_name,
        firm_name: att.firm_name,
        specialties: att.specialties,
        years_experience: att.years_experience,
        role: "ATTORNEY",
        membership_tier: "basic",
        phone: att.phone,
      },
    });
    console.log(`✅ Seeded attorney: ${user.email} (${user.specialties})`);
  }

  console.log("Attorney seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
