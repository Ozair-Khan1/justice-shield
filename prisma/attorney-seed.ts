import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { email } from "zod";

const prisma = new PrismaClient();

const ATTORNIES = [
  {
    email: "landlord.attorney@example.com",
    full_name: "Sarah Jenkins",
    firm_name: "Jenkins & Associates",
    specialties: "landlord_tenant",
    years_experience: 12,
    phone: "1234567890",
    city: 'Karachi',
    country: 'Pakistan'
  },
  {
    email: "employment.lawyer@example.com",
    full_name: "Michael Chen",
    firm_name: "Pacific Legal Group",
    specialties: "employment",
    years_experience: 8,
    phone: "1234567890",
    city: 'Karachi',
    country: 'Pakistan'
  },
  {
    email: "contract.expert@example.com",
    full_name: "Robert Miller",
    firm_name: "Miller Contract Law",
    specialties: "contracts",
    years_experience: 15,
    phone: "1234567890",
    city: 'hyderabad',
    country: 'Pakistan'
  },
  {
    email: "family.lawyer@example.com",
    full_name: "Elena Rodriguez",
    firm_name: "Heritage Family Law",
    specialties: "family",
    years_experience: 10,
    phone: "1234567890",
    city: 'Karachi',
    country: 'Pakistan'
  },
  {
    email: "general.counsel@example.com",
    full_name: "Amanda White",
    firm_name: "White & Blue Legal",
    specialties: "small_claims, other",
    years_experience: 5,
    phone: "1234567890",
    city: 'Karachi',
    country: 'Pakistan'
  },
  {
    email: "accident@gmail.com",
    full_name: "Trent Bolt",
    specialties: "accident",
    year_experience: 6,
    phone: "1234567890",
    city: 'hyderabad',
    country: 'Pakistan'
  },
  {
    email: "accident2@gmail.com",
    full_name: "Trent Bolt",
    specialties: "accident",
    year_experience: 6,
    phone: "1234567890",
    city: 'hyderabad',
    country: 'Pakistan'
  },
  {
    email: "test@gmail.com",
    full_name: "Trent Bolt",
    specialties: "accident",
    year_experience: 6,
    phone: "1234567890",
    city: 'hyderabad',
    country: 'Pakistan'
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
        city: att.city,
        country: att.country || 'Pakistan',
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
        city: att.city,
        country: att.country || 'Pakistan',
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
