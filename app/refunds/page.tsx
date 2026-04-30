// @ts-nocheck

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';



export default function RefundsPage() {
  const lastUpdated = "April 22, 2026";

  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">
          Legal
        </span>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
          Returns &amp; Refund Policy
        </h1>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-titanium-500">
          Last updated: {lastUpdated}
        </p>

        <div className="mt-12 space-y-10 text-titanium-300 leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">1. Overview</h2>
            <p className="mt-3">
              Justice Shield is a subscription-based private legal response network. Because our
              service stands ready to dispatch attorneys 24/7 from the moment your membership is
              active, all fees are generally non-refundable except as described below or where
              required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">2. 14-day satisfaction window</h2>
            <p className="mt-3">
              New members may request a full refund of their first membership payment within
              fourteen (14) days of initial signup, provided no SOS dispatch, civil intake, or
              attorney engagement has been initiated under the account. Refunds in this window
              are issued to the original payment method within 5-10 business days.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">3. Recurring renewals</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Monthly and annual renewals are non-refundable once charged.</li>
              <li>You may cancel at any time from your account; access continues through the end of the paid period.</li>
              <li>Partial-period refunds are not provided for unused time after a renewal.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">4. Service-failure refunds</h2>
            <p className="mt-3">
              If Justice Shield fails to dispatch an attorney within the response-time targets
              published on our pricing page during a covered incident, you may be eligible for a
              prorated credit or refund. Submit a claim within 30 days of the incident through
              the contact page.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">5. Attorney fees</h2>
            <p className="mt-3">
              Fees paid directly to dispatched attorneys for legal services are governed by your
              engagement agreement with that attorney and are not refundable by Justice Shield.
              Disputes over attorney fees should be raised with the attorney or their firm.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">6. Non-refundable items</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Add-on services already delivered (e.g., document review, consultations).</li>
              <li>Any period in which an SOS or civil dispatch was initiated.</li>
              <li>Promotional, discounted, or third-party-bundled memberships, unless required by law.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">7. How to request a refund</h2>
            <p className="mt-3">
              Submit refund requests through the{" "}
              <a href="/contact" className="text-action underline-offset-4 hover:underline">
                contact page
              </a>{" "}
              with your account email, transaction date, and reason for the request. Approved
              refunds are returned to the original payment method.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">8. Chargebacks</h2>
            <p className="mt-3">
              Please contact us before initiating a chargeback. Disputed charges filed without
              first attempting resolution may result in account suspension pending review.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">9. Changes to this policy</h2>
            <p className="mt-3">
              We may update this Returns &amp; Refund Policy from time to time. Material changes
              will be communicated via email or in-app notice and apply to charges made after the
              effective date.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

