"use client";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "About Justice Shield",
    items: [
      { q: "What is Justice Shield?", a: "Justice Shield is a private legal response network that connects members with vetted attorneys 24/7 — during law enforcement encounters and for a range of civil legal matters." },
      { q: "Is Justice Shield a law firm?", a: "No. Justice Shield is a technology platform and response network. We do not provide legal advice. Attorneys dispatched through the Service are independent professionals responsible for their own representation." },
      { q: "Where is the service available?", a: "Coverage is expanding. During signup we confirm whether your jurisdiction is currently supported and which matter types are available in your area." },
    ],
  },
  {
    category: "Membership & Billing",
    items: [
      { q: "How much does membership cost?", a: "Current plans and pricing are listed on the pricing page. Memberships are billed in advance on a recurring basis and you can cancel at any time." },
      { q: "Can I cancel anytime?", a: "Yes. You can cancel from your account settings. Access continues through the end of your paid period." },
      { q: "Do you offer refunds?", a: "New members may request a full refund within 14 days of signup if no dispatch has occurred. See our Returns & Refund Policy for full details." },
    ],
  },
  {
    category: "Using the Service",
    items: [
      { q: "How do I trigger an SOS?", a: "Open the app and use the SOS button on your dashboard. Your location, optional audio, and incident details are sent to the response team, who dispatch an attorney to your situation." },
      { q: "What civil legal matters are covered?", a: "Covered matters include — among others — landlord/tenant disputes, employment issues, family law, small claims, traffic, immigration, bankruptcy, and personal injury. Coverage may vary by jurisdiction." },
      { q: "How fast will an attorney respond?", a: "Response-time targets are described on our pricing page. Targets vary by matter type, severity, and jurisdiction." },
      { q: "Are my conversations with attorneys confidential?", a: "Communications between you and a dispatched attorney are protected by attorney-client privilege where applicable. Justice Shield does not access the substance of those communications." },
    ],
  },
  {
    category: "Privacy & Security",
    items: [
      { q: "What data do you collect?", a: "We collect account, profile, incident, payment, and device/usage data as described in our Privacy Statement. We do not sell your personal information." },
      { q: "Can I delete my data?", a: "Yes. You may request deletion at any time through the contact page, subject to legal and accounting retention requirements." },
    ],
  },
  {
    category: "For Attorneys & Vendors",
    items: [
      { q: "How do I join the network as an attorney?", a: "Visit the vendors page to apply. We review credentials, jurisdiction, areas of practice, and references before onboarding." },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">
          Support
        </span>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-titanium-400">
          Answers to the most common questions about membership, dispatch, and how Justice Shield
          works.
        </p>

        <div className="mt-12 space-y-12">
          {faqs.map((group) => (
            <section key={group.category}>
              <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-titanium-500">
                {group.category}
              </h2>
              <Accordion type="single" collapsible className="mt-4 border-t border-titanium-800">
                {group.items.map((item, idx) => (
                  <AccordionItem
                    key={item.q}
                    value={`${group.category}-${idx}`}
                    className="border-titanium-800"
                  >
                    <AccordionTrigger className="text-left font-display text-lg text-titanium-50 hover:text-action">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-titanium-300 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-lg border border-titanium-800 bg-titanium-900 p-6">
          <h3 className="font-display text-xl font-bold text-titanium-50">Still have questions?</h3>
          <p className="mt-2 text-titanium-300">
            Reach our team through the{" "}
            <a href="/contact" className="text-action underline-offset-4 hover:underline">
              contact page
            </a>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
