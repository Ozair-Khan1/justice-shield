import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyJwt, getAuthToken } from "@/lib/jwt";

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is missing');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-04-22.dahlia',
});

export async function POST(req: Request) {
  try {
    const { plan, period, trial } = await req.json();

    // Verify authentication
    const token = await getAuthToken(req);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId;
    let userEmail;
    try {
      const payload = await verifyJwt(token);
      if (!payload) throw new Error('Invalid token');
      userId = payload.id as string;
      userEmail = payload.email as string;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (!plan || !period) {
      return NextResponse.json({ error: 'Plan and period are required' }, { status: 400 });
    }

    // Determine the Stripe lookup key based on the pricing table format
    const lookupKey = `${plan.toLowerCase()}_${period.toLowerCase().replace('-', '_')}`;

    console.log(`[Stripe] Creating checkout session for user ${userId}, plan ${lookupKey}`);

    const prices = await stripe.prices.list({
      lookup_keys: [lookupKey],
      expand: ['data.product'],
    });

    if (prices.data.length === 0) {
      return NextResponse.json({ error: `Price not found for plan: ${plan} and period: ${period}` }, { status: 404 });
    }

    const priceId = prices.data[0].id;

    // Fetch user from DB to check for existing customer/subscription
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // We will always create a new checkout session.
    // If the user has an existing active subscription, we will cancel it in the webhook
    // after they successfully complete the checkout for the new plan.

    // Create a Checkout Session
    const sessionConfig: any = {
      payment_method_types: ['card'],
      mode: 'subscription',
      client_reference_id: userId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.WEB_URL || 'http://localhost:3000'}/app?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${process.env.WEB_URL || 'http://localhost:3000'}/app?canceled=true`,
      subscription_data: {
        metadata: {
          userId: userId,
          plan: plan.toLowerCase(),
        },
        ...(trial ? { trial_period_days: 7 } : {}),
      },
      metadata: {
        userId: userId,
        plan: plan.toLowerCase(),
      },
    };

    if (user?.stripe_customer_id) {
      sessionConfig.customer = user.stripe_customer_id;
    } else {
      sessionConfig.customer_email = userEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Error creating checkout session:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
