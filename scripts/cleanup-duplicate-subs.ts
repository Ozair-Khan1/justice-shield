import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

const email = process.argv[2] || "nenal38598@deapad.com";

async function main() {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.stripe_customer_id) return console.log("No customer ID found");

  const subs = await stripe.subscriptions.list({ customer: user.stripe_customer_id, status: "active" });

  console.log(`Found ${subs.data.length} active subscriptions for ${email}`);

  let kept = user.stripe_subscription_id;

  // If the DB subscription ID is not in the list, keep the most recent one
  const validSub = subs.data.find(s => s.id === kept) || subs.data[0];
  kept = validSub?.id;

  for (const sub of subs.data) {
    if (sub.id === kept) {
      console.log(`✓ Keeping: ${sub.id} (${sub.items.data[0]?.price?.lookup_key || sub.id})`);
    } else {
      console.log(`✗ Cancelling duplicate: ${sub.id}`);
      await stripe.subscriptions.cancel(sub.id);
      console.log(`  Cancelled.`);
    }
  }

  // Sync DB to the kept subscription
  if (kept && kept !== user.stripe_subscription_id) {
    const keptSub = await stripe.subscriptions.retrieve(kept);
    const lookupKey = keptSub.items.data[0]?.price?.lookup_key || "";
    const plan = lookupKey.split("_")[0] || user.membership_tier;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripe_subscription_id: kept, membership_tier: plan },
    });
    console.log(`✓ DB synced to subscription ${kept}, plan: ${plan}`);
  } else {
    console.log(`✓ DB already in sync.`);
  }
}

main().catch(console.error);
