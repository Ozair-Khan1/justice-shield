import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "How It Works — Justice Shield",
  description: "From SOS tap to attorney bridge in under 30 seconds. See the Justice Shield protocol.",
};

export default function HowItWorksPage() {
  const steps = [
    { n: "01", title: "Tap the SOS", body: "Open the app and select the encounter type. Shield activates instantly — GPS, audio, contact alert." },
    { n: "02", title: "Attorney is dispatched", body: "Justice routes your incident to a vetted attorney licensed in your state in under 30 seconds." },
    { n: "03", title: "Live, encrypted bridge", body: "Two-way video. The attorney can speak directly to officers on your behalf and assert your rights." },
    { n: "04", title: "Sealed record", body: "The full session — audio, video, GPS — is stored in your privileged vault. Never accessible without your consent." },
    { n: "05", title: "Follow-up & defense", body: "If charges are filed, the recorded session becomes immediate evidence for your defense team." },
  ];

  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-20">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">
          Operating Protocol
        </span>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-7xl">
          From tap to counsel
          <br />
          in under 30 seconds.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-titanium-400">
          Every second matters when officers are at your window. Here&apos;s exactly how Justice Shield
          deploys.
        </p>

        <div className="mt-16 space-y-px bg-titanium-800">
          {steps.map((s) => (
            <div key={s.n} className="grid gap-6 bg-titanium-950 p-8 md:grid-cols-[120px_1fr] md:p-10">
              <div className="font-display text-6xl font-bold text-action/80 tabular-nums">
                {s.n}
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">{s.title}</h2>
                <p className="mt-3 text-titanium-400">{s.body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-start gap-4 sm:flex-row">
          <Link
            href="/auth"
            className="rounded-sm bg-action px-8 py-5 text-sm font-bold uppercase tracking-widest text-action-foreground hover:bg-action/90"
          >
            Get Protected →
          </Link>
          <Link
            href="/civil"
            className="rounded-sm border border-titanium-700 bg-titanium-900 px-8 py-5 text-sm font-bold uppercase tracking-widest hover:bg-titanium-800"
          >
            See Civil Coverage
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
