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
      return NextResponse.json({ error: "No subscription found to reactivate" }, { status: 400 });
    }

    // Remove the scheduled cancellation
    await stripe.subscriptions.update(user.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    // Clear the cancellation date from DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscription_cancel_at: null,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Reactivate Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
