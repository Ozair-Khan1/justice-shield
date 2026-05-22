import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn('Stripe keys are missing');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-04-22.dahlia',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        // Metadata contains the plan they subscribed to
        const plan = session.metadata?.plan || 'basic';

        // Extract billing period from subscription
        let billingPeriod = 'monthly';
        if (subscriptionId) {
          try {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const price = subscription.items?.data?.[0]?.price;
            if (price && price.lookup_key) {
              // Extract period from lookup_key like "pro_monthly", "pro_semi_annual", "pro_annual"
              const parts = price.lookup_key.split('_');
              if (parts.length >= 2) {
                if (parts[parts.length - 1] === 'annual' && parts[parts.length - 2] === 'semi') {
                  billingPeriod = 'semi-annual';
                } else if (parts[parts.length - 1] === 'annual') {
                  billingPeriod = 'annual';
                } else {
                  billingPeriod = 'monthly';
                }
              }
            }
          } catch (err: any) {
            console.error(`[Webhook] Failed to retrieve subscription details: ${err.message}`);
          }
        }

        if (userId) {
          const user = await prisma.user.findUnique({ where: { id: userId } });

          // Cancel the old subscription if they had one and it's different
          if (user?.stripe_subscription_id && user.stripe_subscription_id !== subscriptionId) {
            console.log(`[Webhook] Canceling old subscription ${user.stripe_subscription_id} for user ${userId}`);
            try {
              await stripe.subscriptions.cancel(user.stripe_subscription_id);
            } catch (err: any) {
              console.error(`[Webhook] Failed to cancel old subscription: ${err.message}`);
            }
          }

          await prisma.user.update({
            where: { id: userId },
            data: {
              membership_tier: plan,
              billing_period: billingPeriod,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_cancel_at: null, // clear any stale cancel date
            },
          });
          console.log(`Updated user ${userId} to plan ${plan} with billing period ${billingPeriod}`);
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await prisma.user.findUnique({
          where: { stripe_customer_id: customerId },
        });

        if (user) {
          // Determine plan from lookup_key
          let plan = subscription.metadata?.plan || user.membership_tier;
          let billingPeriod = 'monthly';
          const price = subscription.items?.data?.[0]?.price;
          if (price && price.lookup_key) {
            plan = price.lookup_key.split('_')[0]; // e.g. "pro_monthly" -> "pro"
            // Extract billing period
            const parts = price.lookup_key.split('_');
            if (parts.length >= 2) {
              if (parts[parts.length - 1] === 'annual' && parts[parts.length - 2] === 'semi') {
                billingPeriod = 'semi-annual';
              } else if (parts[parts.length - 1] === 'annual') {
                billingPeriod = 'annual';
              } else {
                billingPeriod = 'monthly';
              }
            }
          }

          if (subscription.status === 'active' || subscription.status === 'trialing') {
            // Check if a cancellation was scheduled or cleared
            const cancelAt = subscription.cancel_at
              ? new Date(subscription.cancel_at * 1000)
              : null;

            const isTrial = subscription.status === 'trialing';

            await prisma.user.update({
              where: { id: user.id },
              data: {
                membership_tier: plan,
                billing_period: billingPeriod,
                stripe_subscription_id: subscription.id,
                subscription_cancel_at: cancelAt,
                trial_started_at: isTrial && subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
                ...(isTrial && !((user as any).used_trial_tiers || []).includes(plan) ? {
                  used_trial_tiers: { push: plan }
                } : {}),
              },
            });

            if (cancelAt) {
              console.log(`User ${user.id} subscription scheduled to cancel at ${cancelAt.toISOString()}`);
            } else {
              console.log(`Updated user ${user.id} subscription to ${plan} (status: ${subscription.status})`);
            }
          } else {
            // past_due, canceled, etc.
            if (user.stripe_subscription_id === subscription.id) {
              await prisma.user.update({
                where: { id: user.id },
                data: {
                  stripe_subscription_id: null,
                  // Preserve the cancellation time as the message cutoff date
                  // Use the subscription's ended_at if available, otherwise now
                  subscription_cancel_at: subscription.ended_at
                    ? new Date(subscription.ended_at * 1000)
                    : new Date(),
                },
              });
              console.log(`Removed active subscription for user ${user.id} due to status ${subscription.status}`);

              // Notify via socket
              fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/emit`, {
                method: 'POST',
                body: JSON.stringify({ room: user.id, event: 'membership-expired', payload: {} })
              }).catch(console.error);
            } else {
              console.log(`Ignored status ${subscription.status} for sub ${subscription.id} as user already has a new sub`);
            }
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const user = await prisma.user.findUnique({
          where: { stripe_customer_id: customerId },
        });

        if (user) {
          if (user.stripe_subscription_id === subscription.id) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                stripe_subscription_id: null,
                // Preserve the cancellation time — use ended_at from Stripe or now
                subscription_cancel_at: subscription.ended_at
                  ? new Date(subscription.ended_at * 1000)
                  : new Date(),
              },
            });
            console.log(`Removed active subscription for user ${user.id} due to subscription deletion`);

            // Notify via socket
            fetch(`${process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'}/emit`, {
              method: 'POST',
              body: JSON.stringify({ room: user.id, event: 'membership-expired', payload: {} })
            }).catch(console.error);
          } else {
            console.log(`Ignored deletion of sub ${subscription.id} as user already has a new sub`);
          }
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error handling webhook event:', err);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
