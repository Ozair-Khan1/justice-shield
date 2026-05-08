"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <SiteHeader />

      <main>
        {/* HERO */}
        <section className="relative border-b border-titanium-800">
          <div className="absolute inset-0 tactical-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
          <div className="relative items-center justify-center mx-auto grid max-w-7xl gap-16 px-6 pt-16 pb-24 lg:grid-cols-2 lg:items-center lg:pt-24">
            <div className="space-y-8 w-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-action/30 bg-action/5 px-3 py-1">
                <span className="size-1.5 animate-pulse rounded-full bg-action" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-action">
                  Immediate Intervention Protocol
                </span>
              </div>

              <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-balance md:text-7xl">
                Tactical Law
                <br />
                <span className="text-titanium-400">On Demand.</span>
              </h1>

              <p className="max-w-[45ch] text-lg leading-relaxed text-titanium-400 md:text-xl">
                24/7 legal backup. From police encounters to high-stakes civil disputes, deploy a
                vetted attorney to your screen in under 30 seconds.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/auth"
                  className="text-wrap group relative inline-flex items-center justify-center gap-3 rounded-sm bg-action px-8 py-5 text-sm font-bold uppercase tracking-widest text-action-foreground transition-all hover:glow-action"
                >
                  Get Protected
                  <span className="opacity-60 transition-transform group-hover:translate-x-1">→</span>
                </Link>
                <Link
                  href="/how-it-works"
                  className="text-wrap inline-flex items-center justify-center rounded-sm border border-titanium-700 bg-titanium-900/50 px-8 py-5 text-sm font-bold uppercase tracking-widest text-titanium-50 transition-colors hover:bg-titanium-800"
                >
                  How It Works
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-6 border-t border-titanium-800 pt-8">
                <Stat label="Response" value="28.4s" />
                <Stat label="Encryption" value="AES-256" />
                <Stat label="Uptime" value="99.9%" />
              </div>
            </div>

            <div className="relative">
              <div className="-inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-action/10 via-transparent to-transparent" />
              <DualModePanel />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS QUICK */}
        <section className="border-b border-titanium-800 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionTag>02 / Operating Protocol</SectionTag>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
              Four taps. Counsel on the line.
            </h2>
            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Step n="01" title="Activate Shield" body="One tap on the SOS panel triggers GPS log, audio recording, and an alert to your emergency contact." />
              <Step n="02" title="Attorney Patches In" body="A vetted attorney in your jurisdiction is bridged into a live, encrypted video session within seconds." />
              <Step n="03" title="Privileged Record" body="The session is sealed under attorney–client privilege and stored in your encrypted vault." />
              <Step n="04" title="AI-Powered Analysis" body="Real-time AI monitors your encounters, identifying critical moments and structuring evidence automatically." />
            </div>
          </div>
        </section>

        {/* COVERAGE */}
        <section className="border-b border-titanium-800 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <SectionTag>03 / Coverage Matrix</SectionTag>
            <h2 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
              Built for the moment things escalate.
            </h2>
            <div className="mt-16 grid gap-px bg-titanium-800 md:grid-cols-2">
              <Coverage
                kind="critical"
                tag="Tier 1 — Emergency"
                title="Law Enforcement Encounters"
                items={["Traffic stops", "Pedestrian stops", "Domestic incidents", "Accidents & DUI", "Search & seizure", "Arrest situations"]}
                cta="Instant attorney call"
              />
              <Coverage
                kind="standard"
                tag="Tier 2 — Strategic"
                title="Civil Legal Matters"
                items={["Landlord / tenant disputes", "Employment & wage claims", "Contracts & agreements", "Small claims", "Bankruptcy", "Personal injury", "Family matters"]}
                cta="Intake → callback within 4 hours"
              />
            </div>
          </div>
        </section>

        {/* WARRANTY */}
        <section className="border-b border-titanium-800 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 md:grid-cols-3">
              <div>
                <SectionTag>04 / Warranty</SectionTag>
                <h2 className="mt-4 font-display text-4xl font-bold tracking-tight">
                  Member Protection Warranty
                </h2>
              </div>
              <div className="md:col-span-2 space-y-6">
                <p className="text-lg leading-relaxed text-titanium-400">
                  If a Justice attorney fails to connect during a covered law-enforcement
                  encounter, your annual membership is refunded.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-3 font-mono text-xs font-bold uppercase tracking-widest text-action hover:text-action/80"
                >
                  See membership tiers <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-titanium-900 py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight md:text-6xl">
              Don&apos;t wait for the lights to come on.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-titanium-400">
              Membership activates immediately. Cancel anytime.
            </p>
            <Link
              href="/auth"
              className="mt-10 inline-flex items-center justify-center gap-3 rounded-sm bg-action px-10 py-6 text-sm font-bold uppercase tracking-widest text-action-foreground transition-all hover:glow-action"
            >
              Establish Protection →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <div className="font-mono text-[10px] uppercase tracking-tighter text-titanium-500">
        {label}
      </div>
      <div className="font-display text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">
      {children}
    </span>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="border border-titanium-800 bg-titanium-900/30 p-8">
      <div className="font-display text-5xl font-bold text-action/80 tabular-nums">{n}</div>
      <h3 className="mt-6 font-display text-xl font-bold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-titanium-400">{body}</p>
    </div>
  );
}

function Coverage({
  kind,
  tag,
  title,
  items,
  cta,
}: {
  kind: "critical" | "standard";
  tag: string;
  title: string;
  items: string[];
  cta: string;
}) {
  const isCritical = kind === "critical";
  return (
    <div className={`p-10 ${isCritical ? "bg-titanium-950" : "bg-titanium-900"}`}>
      <div className="flex items-center justify-between">
        <span
          className={`font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${isCritical ? "text-action" : "text-titanium-400"}`}
        >
          {tag}
        </span>
        <span className="font-mono text-[10px] uppercase text-titanium-500">
          {isCritical ? "STATUS: ARMED" : "STATUS: READY"}
        </span>
      </div>
      <h3 className="mt-12 font-display text-3xl font-bold">{title}</h3>
      <ul className="mt-8 space-y-3">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-3 text-sm text-titanium-300">
            <span
              className={`size-1.5 rounded-full ${isCritical ? "bg-action" : "bg-titanium-500"}`}
            />
            {it}
          </li>
        ))}
      </ul>
      <div
        className={`mt-10 border-t pt-6 font-mono text-xs uppercase tracking-widest ${isCritical ? "border-action/30 text-action" : "border-titanium-700 text-titanium-400"}`}
      >
        {cta}
      </div>
    </div>
  );
}

function DualModePanel() {
  return (
    <div className="overflow-hidden rounded-xl border border-titanium-700 bg-titanium-900 shadow-2xl shadow-black/60">
      <div className="flex items-center justify-between border-b border-titanium-800 bg-titanium-950/60 p-4">
        <div className="size-2 rounded-full bg-red-500" />
        <div className="font-mono text-[10px] tracking-widest text-titanium-500">
          ENCRYPTED_SESSION // 882-990
        </div>
        <div className="size-2 rounded-full bg-titanium-700" />
      </div>
      <div className="space-y-8 p-8">
        <div>
          <div className="flex items-end justify-between">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-action">
              Tier 1 / Emergency SOS
            </h3>
            <span className="font-mono text-[10px] text-titanium-500">LAT: 34.05° N</span>
          </div>
          <div className="mt-4 rounded-lg border border-action/30 bg-gradient-to-br from-action/15 to-transparent p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-display text-2xl font-bold">POLICE ENCOUNTER</div>
                <p className="mt-1 text-sm text-titanium-400">
                  Instant video link with local counsel
                </p>
              </div>
              <span className="bg-action px-2 py-1 font-mono text-[10px] font-black uppercase text-action-foreground">
                ACTIVE
              </span>
            </div>
            <div className="mt-4 flex h-12 items-center justify-center rounded-sm border border-action/20 bg-titanium-950">
              <span className="animate-pulse font-mono text-xs text-action">
                CONNECTING TO ATTORNEY...
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-400">
              Tier 2 / Civil Intake
            </h3>
            <span className="font-mono text-[10px] text-titanium-500">NON-URGENT</span>
          </div>
          <div className="mt-4 rounded-lg border border-titanium-800 bg-titanium-950 p-6">
            <div className="font-display text-2xl font-bold text-titanium-200">CIVIL DISPUTE</div>
            <p className="mt-1 text-sm text-titanium-500">Document review & strategic advisory</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-titanium-800">
              <div className="h-full w-1/3 bg-titanium-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
