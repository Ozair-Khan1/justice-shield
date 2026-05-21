import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { verifyJwt, getAuthToken } from "@/lib/jwt";

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-04-22.dahlia',
});

export async function POST(req: Request) {
  try {
    const token = await getAuthToken(req);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyJwt(token);
    if (!payload || !payload.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = payload.id as string;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription found to cancel" }, { status: 400 });
    }

    // Schedule cancellation at period end instead of immediate cancel
    const subscription = await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // Save the cancellation date so UI can display it
    const cancelAt = subscription.cancel_at
      ? new Date(subscription.cancel_at * 1000)
      : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscription_cancel_at: cancelAt,
      }
    });

    return NextResponse.json({ success: true, cancel_at: cancelAt });
  } catch (error: any) {
    console.error("Cancel Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
