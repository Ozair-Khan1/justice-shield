// @ts-nocheck

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';



export default function DisclaimerPage() {
  const lastUpdated = "April 22, 2026";

  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">
          Legal
        </span>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
          Disclaimer
        </h1>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-titanium-500">
          Last updated: {lastUpdated}
        </p>

        <div className="mt-12 space-y-10 text-titanium-300 leading-relaxed">
          <section className="rounded border border-action/40 bg-action/5 p-6">
            <h2 className="font-display text-2xl font-bold text-titanium-50">Service area</h2>
            <p className="mt-3">
              Justice Shield is presently operating in the <strong className="text-titanium-50">State of Georgia</strong>, with plans to expand nationwide. Our legal services currently provide coverage for the <strong className="text-titanium-50">State of Georgia only</strong>. Membership and dispatched attorney response is unavailable outside Georgia at this time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">Excluded Law</h2>
            <p className="mt-3">
              Provider firms within the Justice Shield network <strong className="text-titanium-50">do not assist</strong> with International Law, Military Law, or Tribal Law.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">Not a law firm</h2>
            <p className="mt-3">
              Justice Shield is a private legal response network and technology platform. We are not a law firm and do not provide legal advice. Attorneys dispatched through the Service are independent licensed professionals solely responsible for their own representation, advice, and conduct.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">No attorney-client relationship with Justice Shield</h2>
            <p className="mt-3">
              Use of this website, our app, or our Service does not create an attorney-client relationship between you and Justice Shield. An attorney-client relationship is formed only between you and the independent attorney engaged on your behalf, subject to that attorney's engagement terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">No guarantee of outcome</h2>
            <p className="mt-3">
              Nothing on this site or in our communications should be interpreted as a guarantee, warranty, or prediction regarding the outcome of any legal matter. Past results do not guarantee future outcomes.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">Informational content</h2>
            <p className="mt-3">
              Content on this website is provided for general informational purposes only and is not legal advice. You should consult a licensed attorney in your jurisdiction for advice regarding your specific situation.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">Emergency situations</h2>
            <p className="mt-3">
              Justice Shield is not a substitute for emergency services. If you are in immediate danger or witnessing a crime in progress, call 911.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">Third-party links</h2>
            <p className="mt-3">
              Our Service may include links to third-party websites or resources. We do not endorse and are not responsible for the content, policies, or practices of any third party.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">Questions</h2>
            <p className="mt-3">
              For questions about this Disclaimer, reach us through the{" "}
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

