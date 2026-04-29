"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

const vendorSchema = z.object({
  vendor_type: z.enum(["attorney", "marketing_specialist"]),
  full_name: z.string().trim().min(3, "Please enter your full name").max(120),
  firm_name: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().min(10, "Phone number is required").max(40),
  location: z.string().trim().min(1, "Location is required").max(160),
  website: z.string().trim().max(255).url("Invalid URL").optional().or(z.literal("")),
  specialties: z.string().trim().min(1, "Please specify your specialties").max(500),
  bar_number: z.string().trim().min(1, "Bar number is required").max(60),
  years_experience: z.coerce.number().int().min(0, "Must be 0 or more").max(80),
  message: z.string().trim().max(1500).optional().or(z.literal("")),
});

export default function VendorsPage() {
  const [vendorType, setVendorType] = useState<"attorney" | "marketing_specialist">("attorney");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | undefined>("");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!acceptedTerms) {
      setError("You must accept the Terms of Agreement to apply.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const raw = {
      vendor_type: vendorType,
      full_name: String(fd.get("full_name") ?? ""),
      firm_name: String(fd.get("firm_name") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: phone || "",
      location: String(fd.get("location") ?? ""),
      website: String(fd.get("website") ?? ""),
      specialties: String(fd.get("specialties") ?? ""),
      bar_number: String(fd.get("bar_number") ?? ""),
      years_experience: String(fd.get("years_experience") ?? ""),
      message: String(fd.get("message") ?? ""),
    };

    const parsed = vendorSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vendors/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-titanium-950 text-titanium-50">
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-titanium-800 px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-action/30 bg-action/5 px-3 py-1">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-action">Vendor Network</span>
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Join the <span className="text-action">Justice Shield</span> network
            </h1>
            <p className="mt-4 text-base text-titanium-400">
              Attorneys and marketing specialists: apply to receive vetted matters and member referrals from across the country.
            </p>
          </div>
        </section>

        <section className="px-6 py-12">
          <div className="mx-auto max-w-3xl">
            {submitted ? (
              <div className="rounded-sm border border-emerald-500/40 bg-emerald-500/5 p-8">
                <h2 className="font-display text-2xl font-bold">Application received</h2>
                <p className="mt-2 text-sm text-titanium-300">Thank you. Our network team will review your application and respond within 3–5 business days.</p>
                <Link href="/" className="mt-6 inline-block font-mono text-xs uppercase tracking-widest text-action hover:underline">← Back to home</Link>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-6">
                <div>
                  <Label>Apply as</Label>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {([["attorney", "Attorney"], ["marketing_specialist", "Marketing Specialist"]] as const).map(([value, label]) => (
                      <button key={value} type="button" onClick={() => setVendorType(value)}
                        className={`rounded-sm border px-4 py-3 text-left text-sm font-bold uppercase tracking-wide transition-colors ${vendorType === value ? "border-action bg-action/10 text-action" : "border-titanium-700 bg-titanium-900 text-titanium-300 hover:border-titanium-600"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="full_name" label="Full name" />
                  <Field name="firm_name" label={vendorType === "attorney" ? "Firm" : "Company"} />
                  <Field name="email" label="Email" type="email" />
                  <div className="block">
                    <Label>Phone *</Label>
                    <div className="mt-2">
                      <PhoneInput
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={setPhone}
                        defaultCountry="US"
                        international={false}
                        className="phone-input-custom"
                      />
                    </div>
                  </div>
                  <Field name="location" label="City / State" />
                  <Field name="website" label="Website" type="url" placeholder="https://" />
                  {vendorType === "attorney" && (
                    <>
                      <Field name="bar_number" label="Bar number" />
                      <Field name="years_experience" label="Years of experience" type="number" />
                    </>
                  )}
                </div>
                <TextArea name="specialties" label={vendorType === "attorney" ? "Practice areas / specialties" : "Marketing specialties (SEO, paid, brand, etc.)"} rows={2} />
                <TextArea name="message" label="Tell us about yourself" rows={5} />
                {error && (
                  <div className="animate-shake rounded-sm border border-red-500/40 bg-red-500/10 p-3 font-mono text-xs text-red-500">
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                      <span>{error}</span>
                    </div>
                  </div>
                )}
                <label className="flex items-start gap-3">
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} required className="mt-0.5 size-4 cursor-pointer accent-action" />
                  <span className="font-mono text-[11px] leading-relaxed text-titanium-400">
                    I have read and agree to the{" "}
                    <Link href="/terms" target="_blank" className="text-action underline-offset-4 hover:underline">Terms of Agreement</Link>{" "}and{" "}
                    <Link href="/privacy" target="_blank" className="text-action underline-offset-4 hover:underline">Privacy Statement</Link>.
                  </span>
                </label>
                <button type="submit" disabled={submitting}
                  className="w-full rounded-sm bg-action px-6 py-4 text-sm font-bold uppercase tracking-widest text-action-foreground transition-colors hover:bg-action/90 disabled:opacity-50">
                  {submitting ? "Submitting..." : "Submit Application →"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">{children}</span>;
}

function Field({ name, label, type = "text", required, placeholder }: { name: string; label: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <Label>{label}{required && " *"}</Label>
      <input name={name} type={type} required={required} placeholder={placeholder}
        className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm text-titanium-50 outline-none transition-colors focus:border-action" />
    </label>
  );
}

function TextArea({ name, label, rows = 4, required }: { name: string; label: string; rows?: number; required?: boolean }) {
  return (
    <label className="block">
      <Label>{label}{required && " *"}</Label>
      <textarea name={name} rows={rows} required={required}
        className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm text-titanium-50 outline-none transition-colors focus:border-action" />
    </label>
  );
}
