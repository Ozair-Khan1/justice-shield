"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";

const MATTER_TYPES = [
  { id: "landlord_tenant", label: "Landlord / Tenant" },
  { id: "employment", label: "Employment & Wages" },
  { id: "contracts", label: "Contracts" },
  { id: "small_claims", label: "Small Claims" },
  { id: "family", label: "Family Matters" },
  { id: "consumer", label: "Consumer / Debt" },
  { id: "other", label: "Other" },
];

export default function CivilIntakePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [matterType, setMatterType] = useState("landlord_tenant");
  const [urgency, setUrgency] = useState("standard");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [preferredContact, setPreferredContact] = useState("phone");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (!subject) {
        throw new Error("Please enter a subject");
      } else if (subject.length < 3) {
        throw new Error("Subject must be at least 3 characters long");
      } else if (subject.length > 100) {
        throw new Error("Subject must be less than 140 characters long");
      }

      if (!description) {
        throw new Error("Description is required");
      } else if (description.length < 10) {
        throw new Error("Description must be at least 10 characters long");
      }

      if (!user) {
        throw new Error("You must be logged in to submit an intake.");
      }

      setError(null);
      setSubmitting(true);

      const res = await fetch("/api/civil/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matterType,
          urgency,
          subject,
          description,
          preferredContact,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit intake");

      // Redirect to history upon successful submission
      router.push("/app/history");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-titanium-400">Tier 2 — Strategic Civil Counsel</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">File a civil intake.</h1>
        <p className="mt-3 max-w-2xl text-titanium-400">Submit non-urgent civil matters here. A vetted attorney will reach out within 4 hours (urgent) or 24 hours (standard).</p>
      </header>

      <form onSubmit={onSubmit} className="grid gap-8 rounded-lg border border-titanium-800 bg-titanium-900/40 p-6 sm:p-8">
        <div>
          <Label>Matter Type</Label>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MATTER_TYPES.map((m) => (
              <button type="button" key={m.id} onClick={() => setMatterType(m.id)}
                className={`rounded-sm border px-3 py-2.5 text-left text-sm transition-colors ${matterType === m.id ? "border-action bg-action/10 text-action" : "border-titanium-700 bg-titanium-900 text-titanium-300 hover:border-titanium-500"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Urgency</Label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[{ id: "urgent", label: "Urgent · 4h" }, { id: "standard", label: "Standard · 24h" }, { id: "routine", label: "Routine · 3d" }].map((u) => (
              <button type="button" key={u.id} onClick={() => setUrgency(u.id)}
                className={`rounded-sm border px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${urgency === u.id ? "border-action bg-action/10 text-action" : "border-titanium-700 bg-titanium-900 text-titanium-400 hover:border-titanium-500"}`}>
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Subject</Label>
          <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Landlord refuses to return security deposit"
            className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action" />
        </div>

        <div>
          <Label>Describe the situation</Label>
          <textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Include dates, parties involved, and what outcome you're seeking..."
            className="mt-2 w-full resize-y rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm leading-relaxed outline-none focus:border-action" />
        </div>

        <div>
          <Label>Preferred Contact</Label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[{ id: "phone", label: "Phone Call" }, { id: "email", label: "Email" }].map((c) => (
              <button type="button" key={c.id} onClick={() => setPreferredContact(c.id)}
                className={`rounded-sm border px-3 py-2.5 text-sm transition-colors ${preferredContact === c.id ? "border-action bg-action/10 text-action" : "border-titanium-700 bg-titanium-900 text-titanium-300 hover:border-titanium-500"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="rounded-sm border border-destructive/40 bg-destructive/10 p-3 font-mono text-xs text-destructive">{error}</div>}

        <button type="submit" disabled={submitting}
          className="rounded-sm bg-action px-6 py-4 text-sm font-bold uppercase tracking-widest text-action-foreground transition-colors hover:bg-action/90 disabled:opacity-50">
          {submitting ? "Submitting..." : "Submit Intake →"}
        </button>
      </form>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">{children}</span>;
}
