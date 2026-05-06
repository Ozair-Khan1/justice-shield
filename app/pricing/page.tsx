import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import { PricingTable } from "@/components/PricingTable";

export const metadata: Metadata = {
  title: "Pricing — Justice Shield",
  description: "Justice Shield membership tiers. Police encounter coverage from $19/mo, full civil coverage from $49/mo.",
};

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
            Choose your billing frequency and save up to 25% with annual protection.
          </p>
        </div>

        <div className="mt-16">
          <PricingTable />
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
