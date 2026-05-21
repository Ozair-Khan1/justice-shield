import Stripe from 'stripe';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not defined in .env');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-04-22.dahlia',
});

const tiers = [
  { name: 'Basic', monthly: 1900, semiAnnual: 1600 * 6, annual: 1400 * 12 },
  { name: 'Pro', monthly: 4900, semiAnnual: 4200 * 6, annual: 3700 * 12 },
  { name: 'Family', monthly: 8900, semiAnnual: 7600 * 6, annual: 6700 * 12 },
  { name: 'Elite', monthly: 14900, semiAnnual: 12700 * 6, annual: 11200 * 12 },
];

async function seedStripe() {
  console.log('Seeding Stripe Products and Prices...');
  for (const tier of tiers) {
    console.log(`Processing tier: ${tier.name}`);
    const products = await stripe.products.search({
      query: `name:'${tier.name} Plan'`,
    });
    
    let product;
    if (products.data.length > 0) {
      product = products.data[0];
      console.log(`Found existing product: ${product.id}`);
    } else {
      product = await stripe.products.create({
        name: `${tier.name} Plan`,
        description: `Justice Shield ${tier.name} Membership`,
      });
      console.log(`Created product: ${product.id}`);
    }
    
    const prices = await stripe.prices.list({ product: product.id });
    
    const createPriceIfNotExists = async (amount: number, interval: 'month' | 'year', interval_count: number, lookup_key: string) => {
      const existing = prices.data.find(p => p.lookup_key === lookup_key);
      if (existing) {
         console.log(`Price ${lookup_key} already exists: ${existing.id}`);
      } else {
         const p = await stripe.prices.create({
           product: product.id,
           unit_amount: amount,
           currency: 'usd',
           recurring: { interval, interval_count },
           lookup_key,
         });
         console.log(`Created price ${lookup_key}: ${p.id}`);
      }
    };
    
    await createPriceIfNotExists(tier.monthly, 'month', 1, `${tier.name.toLowerCase()}_monthly`);
    await createPriceIfNotExists(tier.semiAnnual, 'month', 6, `${tier.name.toLowerCase()}_semi_annual`);
    await createPriceIfNotExists(tier.annual, 'year', 1, `${tier.name.toLowerCase()}_annual`);
  }
  console.log('Seeding complete!');
}

seedStripe().catch((err) => {
  console.error('Error seeding Stripe:', err.message);
});
