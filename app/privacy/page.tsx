// @ts-nocheck

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';



export default function PrivacyPage() {
  const lastUpdated = "April 22, 2026";

  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">
          Legal
        </span>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
          Privacy Statement
        </h1>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-titanium-500">
          Last updated: {lastUpdated}
        </p>

        <div className="mt-12 space-y-10 text-titanium-300 leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">1. Who we are</h2>
            <p className="mt-3">
              Justice Shield ("we," "us," or "our") operates a private legal response network that
              connects members with vetted attorneys during law enforcement encounters and civil
              legal matters. We are not a law firm and do not provide legal advice ourselves.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">2. Information we collect</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li><strong className="text-titanium-100">Account data:</strong> name, email, phone number, and password.</li>
              <li><strong className="text-titanium-100">Profile data:</strong> emergency contacts, jurisdiction, and matter preferences.</li>
              <li><strong className="text-titanium-100">Incident data:</strong> location, audio, photos, and notes you submit during an SOS or civil intake.</li>
              <li><strong className="text-titanium-100">Payment data:</strong> billing details processed by our payment provider â€” we do not store full card numbers.</li>
              <li><strong className="text-titanium-100">Device & usage data:</strong> IP address, device identifiers, browser type, and interaction logs.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">3. How we use your information</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>To dispatch attorneys and coordinate response during an incident.</li>
              <li>To operate, secure, and improve the platform.</li>
              <li>To process payments and manage your subscription.</li>
              <li>To communicate updates, alerts, and service notifications.</li>
              <li>To comply with legal obligations and enforce our terms.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">4. Attorney-client confidentiality</h2>
            <p className="mt-3">
              Communications between you and a dispatched attorney are protected by attorney-client
              privilege where applicable. Justice Shield does not access the substance of your
              privileged communications and routes them directly between you and counsel.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">5. How we share information</h2>
            <p className="mt-3">
              We share information with attorneys you engage, service providers (hosting,
              analytics, payment processing), and as required by law. We do not sell your personal
              information.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">6. Data retention</h2>
            <p className="mt-3">
              We retain account and incident records for as long as your account is active and as
              required to comply with legal, accounting, or reporting obligations. You may request
              deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">7. Security</h2>
            <p className="mt-3">
              We use industry-standard safeguards including encryption in transit, role-based
              access, and audit logging. No system is perfectly secure, and we cannot guarantee
              absolute security.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">8. Your rights</h2>
            <p className="mt-3">
              Depending on your jurisdiction, you may have the right to access, correct, delete,
              or port your personal information, and to object to or restrict certain processing.
              Contact us to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">9. Children</h2>
            <p className="mt-3">
              Justice Shield is not directed to children under 16, and we do not knowingly collect
              personal information from them.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">10. Changes to this statement</h2>
            <p className="mt-3">
              We may update this Privacy Statement from time to time. Material changes will be
              communicated via email or in-app notice.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">11. Contact us</h2>
            <p className="mt-3">
              Questions or requests? Reach us through the{" "}
              <a href="/contact" className="text-action underline-offset-4 hover:underline">
                contact page
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

