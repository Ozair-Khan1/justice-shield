"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { MembershipChangeModal } from "@/components/MembershipChangeModal";

type BillingPeriod = "monthly" | "semi-annual" | "annual";

const TIERS = [
  {
    name: "Basic",
    tag: "Tier 01",
    monthlyPrice: 19,
    semiAnnualPrice: 16,
    annualPrice: 14,
    blurb: "Essential police-encounter coverage.",
    features: [
      "Unlimited SOS attorney calls",
      "Police encounter coverage 24/7",
      "Encrypted session vault",
      "Emergency contact alerts",
    ],
    cta: "Start Basic",
    accent: false,
  },
  {
    name: "Pro",
    tag: "Tier 02",
    monthlyPrice: 49,
    semiAnnualPrice: 42,
    annualPrice: 37,
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
    monthlyPrice: 89,
    semiAnnualPrice: 76,
    annualPrice: 67,
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
  {
    name: "Elite",
    tag: "Tier 04",
    monthlyPrice: 149,
    semiAnnualPrice: 127,
    annualPrice: 112,
    blurb: "AI-Powered Elite legal protection.",
    features: [
      "Everything in Pro",
      "AI powered Technology *Complex Litigation",
      "Unlimited recorded sessions",
      "Document review up to 95 pages",
    ],
    cta: "Start Elite",
    accent: false,
  },
];

export function PricingTable() {
  const [period, setPeriod] = useState<BillingPeriod>("monthly");
  const { user } = useAuth();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [pendingChange, setPendingChange] = useState<{
    plan: string;
    trial: boolean;
    event: React.MouseEvent;
  } | null>(null);

  const handleCheckout = async (e: React.MouseEvent, plan: string, trial: boolean = false) => {
    if (!user) return;
    e.preventDefault();

    // Check if user has an active membership and is trying to change it
    const hasActiveMembership = user.membership_tier && 
                                 user.membership_tier !== 'none' && 
                                 user.membership_tier !== 'free';
    const isDifferentPlan = user.membership_tier?.toLowerCase() !== plan.toLowerCase() || user.membership_tier.toLowerCase() === plan.toLowerCase() && user.stripe_subscription_id !== null;

    if (hasActiveMembership && isDifferentPlan) {
      // Show confirmation modal
      setPendingChange({ plan, trial, event: e });
      setShowChangeModal(true);
      return;
    }

    // Proceed with checkout
    await proceedWithCheckout(plan, trial);
  };

  const proceedWithCheckout = async (plan: string, trial: boolean = false) => {
    setLoadingTier(plan + (trial ? "-trial" : ""));
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.toLowerCase(), period, trial })
      });
      const data = await res.json();
      if (data.upgraded) {
        // Plan was swapped in-place — no Stripe redirect needed
        toast.success(`Membership changed to ${data.plan}!`, {
          description: "Your plan has been updated immediately.",
        });
        setTimeout(() => window.location.reload(), 1500);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
      setLoadingTier(null);
    }
  };

  const handleConfirmChange = async () => {
    if (!pendingChange) return;
    setShowChangeModal(false);
    await proceedWithCheckout(pendingChange.plan, pendingChange.trial);
    setPendingChange(null);
  };

  const getPrice = (t: typeof TIERS[0]) => {
    if (period === "annual") return t.annualPrice;
    if (period === "semi-annual") return t.semiAnnualPrice;
    return t.monthlyPrice;
  };

  const getBillingLabel = () => {
    if (period === "annual") return "billed annually";
    if (period === "semi-annual") return "billed every 6 months";
    return "billed monthly";
  };

  const isCurrentPlan = (planName: string) => {
    if (!user?.membership_tier || !user?.billing_period || !user?.stripe_subscription_id) return false;
    
    // Normalize the billing period for comparison
    const userPeriod = user?.billing_period.replace('_', '-'); // Convert "semi_annual" to "semi-annual"
    
    return (
      user.membership_tier.toLowerCase() === planName.toLowerCase() &&
      userPeriod === period
    );
  };

  return (
    <div className="space-y-12">
      <MembershipChangeModal
        open={showChangeModal}
        onOpenChange={setShowChangeModal}
        currentTier={user?.membership_tier || ""}
        newTier={pendingChange?.plan || ""}
        onConfirm={handleConfirmChange}
        loading={loadingTier !== null}
      />

      <div className="flex justify-center">
        <div className="flex text-wrap rounded-sm bg-titanium-900/50 p-1 border border-titanium-800">
          {(["monthly", "semi-annual", "annual"] as BillingPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-wrap transition-all ${period === p
                ? "bg-action text-action-foreground shadow-lg"
                : "text-titanium-500 hover:text-titanium-300"
                }`}
            >
              {p.replace("-", " ")}
              {p === "annual" && <span className="ml-1 text-[8px] opacity-70">(-25%)</span>}
              {p === "semi-annual" && <span className="ml-1 text-[8px] opacity-70">(-15%)</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t) => (
          <div
            key={t.name}
            className={`relative flex flex-col rounded-lg border p-8 transition-all duration-500 ${t.accent
              ? "border-action bg-linear-to-b from-action/10 to-titanium-900"
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

            <div className="mt-8">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold tabular-nums text-titanium-50">
                  ${getPrice(t)}
                </span>
                <span className="font-mono text-xs uppercase tracking-widest text-titanium-500">
                  / month
                </span>
              </div>
              <p className="mt-1 font-mono text-[9px] uppercase tracking-widest text-action/70">
                {getBillingLabel()}
              </p>
            </div>

            <ul className="mt-8 flex-1 space-y-3 border-t border-titanium-800 pt-6">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-titanium-300">
                  <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${t.accent ? "bg-action" : "bg-titanium-500"}`} />
                  {f}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3">
              {isCurrentPlan(t.name) ? (
                <div className="inline-flex items-center justify-center rounded-sm border-2 border-action bg-action/10 px-6 py-4 text-sm font-bold uppercase tracking-widest text-action">
                  ✓ Current Plan
                </div>
              ) : (
                <>
                  <Link
                    href={`/auth?plan=${t.name.toLowerCase()}&period=${period}`}
                    onClick={(e) => user && handleCheckout(e, t.name, false)}
                    className={`inline-flex items-center justify-center rounded-sm px-6 py-4 text-sm font-bold uppercase tracking-widest transition-colors ${t.accent
                      ? "bg-action text-action-foreground hover:bg-action/90 shadow-[0_0_20px_rgba(var(--action-rgb),0.3)]"
                      : "border border-titanium-700 bg-titanium-900 text-titanium-50 hover:bg-titanium-800"
                      } ${loadingTier === t.name ? "opacity-50 cursor-wait" : ""}`}
                  >
                    {loadingTier === t.name ? "Processing..." : `${t.cta} →`}
                  </Link>
                  {!user || !(user as any).used_trial_tiers?.includes(t.name.toLowerCase()) ? (
                    <Link
                      href={`/auth?trial=true&plan=${t.name.toLowerCase()}&period=${period}`}
                      onClick={(e) => user && handleCheckout(e, t.name, true)}
                      className={`inline-flex items-center justify-center rounded-sm border border-titanium-800 bg-titanium-950/50 py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400 transition-all hover:border-action/50 hover:text-action ${loadingTier === t.name + "-trial" ? "opacity-50 cursor-wait" : ""}`}
                    >
                      {loadingTier === t.name + "-trial" ? "Processing..." : "Start 7-Day Free Trial"}
                    </Link>
                  ) : null}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
