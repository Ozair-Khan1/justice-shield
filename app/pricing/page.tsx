import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing — Justice Shield",
  description: "Justice Shield membership tiers. Police encounter coverage from $19/mo, full civil coverage from $49/mo.",
};

const TIERS = [
  {
    name: "Standard",
    tag: "Tier 01",
    price: "$19",
    blurb: "Essential police-encounter coverage.",
    features: [
      "Unlimited SOS attorney calls",
      "Police encounter coverage 24/7",
      "Encrypted session vault",
      "Emergency contact alerts",
    ],
    cta: "Start Standard",
    accent: false,
  },
  {
    name: "Pro",
    tag: "Tier 02",
    price: "$49",
    blurb: "Add full civil legal coverage.",
    features: [
      "Everything in Standard",
      "Civil intake (all categories)",
      "Document review up to 35 pages",
      "Demand letter drafting",
      "Member Protection Warranty",
    ],
    cta: "Start Pro",
    accent: true,
  },
  {
    name: "Family",
    tag: "Tier 03",
    price: "$89",
    blurb: "Up to 5 family members protected.",
    features: [
      "Everything in Pro",
      "5 family members covered",
      "Family law priority intake",
      "Annual estate review",
    ],
    cta: "Start Family",
    accent: false,
  },
];


export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">
            Membership Tiers
          </span>
          <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-7xl">
            Pick your shield.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-titanium-400">
            All plans billed monthly. Cancel anytime. No setup fees.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative flex flex-col rounded-lg border p-8 ${t.accent
                ? "border-action bg-gradient-to-b from-action/10 to-titanium-900"
                : "border-titanium-800 bg-titanium-900/40"
                }`}
            >
              {t.accent && (
                <span className="absolute -top-3 left-8 rounded-sm bg-action px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-action-foreground">
                  Most Protection
                </span>
              )}
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">
                {t.tag}
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold">{t.name}</h2>
              <p className="mt-2 text-sm text-titanium-400">{t.blurb}</p>
              <div className="mt-8 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold tabular-nums">{t.price}</span>
                <span className="font-mono text-xs uppercase tracking-widest text-titanium-500">
                  / month
                </span>
              </div>
              <ul className="mt-8 flex-1 space-y-3 border-t border-titanium-800 pt-6">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-titanium-300">
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${t.accent ? "bg-action" : "bg-titanium-500"}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/"
                className={`mt-8 inline-flex items-center justify-center rounded-sm px-6 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${t.accent
                  ? "bg-action text-action-foreground hover:bg-action/90"
                  : "border border-titanium-700 bg-titanium-900 text-titanium-50 hover:bg-titanium-800"
                  }`}
              >
                {t.cta} →
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-lg border border-titanium-800 bg-titanium-900/40 p-8 text-center">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">
            Member Protection Warranty
          </span>
          <p className="mx-auto mt-3 max-w-2xl text-titanium-300">
            If a Justice attorney fails to connect during a covered law-enforcement encounter, your
            annual fee is refunded.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
