import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Civil Coverage — Justice Shield",
  description: "Beyond police encounters. Justice Shield civil coverage handles landlord disputes, contracts, employment, family matters and more.",
};

const CATEGORIES = [
  { tag: "Housing", title: "Landlord & Tenant", desc: "Security deposits, eviction defense, habitability, lease disputes." },
  { tag: "Employment", title: "Employment & Wages", desc: "Unpaid wages, wrongful termination, discrimination, severance review." },
  { tag: "Contracts", title: "Contracts & Agreements", desc: "Review, drafting, breach claims, demand letters, settlements." },
  { tag: "Civil", title: "Small Claims", desc: "Pre-filing strategy, demand letters, court prep up to $10,000." },
  { tag: "Family", title: "Family Matters", desc: "Custody questions, divorce intake, child support, restraining orders." },
  { tag: "Consumer", title: "Consumer & Debt", desc: "Debt collection harassment, credit disputes, fraud, FDCPA violations." },
];

export default function CivilPage() {
  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <SiteHeader />
      <main>
        <section className="border-b border-titanium-800 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">
              Tier 2 — Strategic Civil Counsel
            </span>
            <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-7xl">
              Beyond the badge.
              <br />
              <span className="text-titanium-400">Civil coverage.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-titanium-400">
              Most legal trouble doesn&apos;t arrive in flashing lights. Justice Shield extends your
              membership into the everyday legal battles that actually drain your wallet.
            </p>
          </div>
        </section>

        <section className="border-b border-titanium-800 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="font-display text-3xl font-bold">Covered matters</h2>
            <div className="mt-12 grid gap-px bg-titanium-800 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORIES.map((c) => (
                <div key={c.title} className="bg-titanium-950 p-8 transition-colors hover:bg-titanium-900">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-action">
                    {c.tag}
                  </span>
                  <h3 className="mt-4 font-display text-xl font-bold">{c.title}</h3>
                  <p className="mt-3 text-sm text-titanium-400">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-titanium-800 px-6 py-20">
          <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-titanium-400">
                Response SLA
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold">Predictable callback windows</h2>
            </div>
            <div className="space-y-4">
              <SLA tier="Urgent" hours="4 hours" />
              <SLA tier="Standard" hours="24 hours" />
              <SLA tier="Routine" hours="3 days" />
            </div>
          </div>
        </section>

        <section className="bg-titanium-900 px-6 py-24 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            One membership. Both shields.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-titanium-400">
            Civil coverage is included with every Justice membership at the Pro tier and above.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/pricing"
              className="rounded-sm bg-action px-8 py-5 text-sm font-bold uppercase tracking-widest text-action-foreground hover:bg-action/90"
            >
              View Pricing
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function SLA({ tier, hours }: { tier: string; hours: string }) {
  return (
    <div className="flex items-center justify-between rounded-sm border border-titanium-800 bg-titanium-900 p-5">
      <span className="font-mono text-xs uppercase tracking-widest text-titanium-300">{tier}</span>
      <span className="font-display text-lg font-bold text-action">{hours}</span>
    </div>
  );
}
