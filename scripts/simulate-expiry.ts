/**
 * simulate-expiry.ts
 * Sets stripe_subscription_id to null for a user to test the expired membership UI.
 * Usage: bun scripts/simulate-expiry.ts <email>
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2];

if (!email) {
  console.error("Usage: bun scripts/simulate-expiry.ts <email>");
  process.exit(1);
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  console.log(`Before: stripe_subscription_id = ${user.stripe_subscription_id}`);

  await prisma.user.update({
    where: { email },
    data: {
      stripe_subscription_id: null,
    },
  });

  try {
    await fetch('http://localhost:3001/emit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room: user.id, event: 'membership-expired', payload: {} })
    });
    console.log(`✓ Fired realtime membership-expired socket event`);
  } catch (err) {
    console.error(`Failed to fire socket event. Is socket server running?`);
  }

  console.log(`✓ Simulated subscription expiry for ${email}`);
  console.log(`  stripe_subscription_id → null`);
  console.log(`  membership_tier remains unchanged`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
