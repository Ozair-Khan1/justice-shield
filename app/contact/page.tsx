"use client";

import { useState, type FormEvent } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">
          Direct Channel
        </span>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
          Talk to operations.
        </h1>
        <p className="mt-6 text-titanium-400">
          Questions about coverage, billing, or enterprise plans? Drop a line.
        </p>

        {submitted ? (
          <div className="mt-12 rounded-lg border border-action/40 bg-action/10 p-8">
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-action">
              Message Received
            </div>
            <h2 className="mt-3 font-display text-2xl font-bold">We&apos;ll be in touch within 24h.</h2>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-12 space-y-4 rounded-lg border border-titanium-800 bg-titanium-900/40 p-8">
            <Field label="Name" type="text" required />
            <Field label="Email" type="email" required />
            <label className="block">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">
                Message
              </span>
              <textarea
                required
                rows={5}
                className="mt-2 w-full resize-y rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action"
              />
            </label>
            <button
              type="submit"
              className="rounded-sm bg-action px-6 py-4 text-sm font-bold uppercase tracking-widest text-action-foreground hover:bg-action/90"
            >
              Send →
            </button>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, type, required }: { label: string; type: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">
        {label}
      </span>
      <input
        type={type}
        required={required}
        className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action"
      />
    </label>
  );
}
