"use client";

import { useState, type FormEvent } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!name) {
        throw new Error("Name is required");
      } else if (name.length < 2) {
        throw new Error("Name must be at least 2 characters long");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("Please enter a valid email address.");
      }

      if (!message) {
        throw new Error("Message is required");
      } else if (message.length < 5) {
        throw new Error("Message must be at least 5 characters long");
      }

      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to send message");
      setSubmitted(true);
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      setError(message);
    } finally {
      setLoading(false);
    }
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
            <Field label="Name" type="text" name="name" value={name} onChange={(e) => setName(e.target.value)} />
            <Field label="Email" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="block">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">
                Message
              </span>
              <textarea
                name="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="mt-2 w-full resize-y rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action"
              />
            </label>
            {error && (
              <div className="rounded-sm border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="rounded-sm bg-action px-6 py-4 text-sm font-bold uppercase tracking-widest text-action-foreground hover:bg-action/90 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send →"}
            </button>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, type, name, required, value, onChange }: { label: string; type: string; name: string; required?: boolean, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">
        {label}
      </span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action"
      />
    </label>
  );
}
