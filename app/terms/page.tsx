// @ts-nocheck

import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';



export default function TermsPage() {
  const lastUpdated = "April 22, 2026";

  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">
          Legal
        </span>
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tight md:text-6xl">
          Terms of Agreement
        </h1>
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-titanium-500">
          Last updated: {lastUpdated}
        </p>

        <div className="mt-12 space-y-10 text-titanium-300 leading-relaxed">
          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">1. Acceptance of terms</h2>
            <p className="mt-3">
              By creating an account or using Justi ce Shield ("the Service"), you agree to be bound by these Terms of Agreement and our <a href="/privacy" className="text-action underline-offset-4 hover:underline">Privacy Statement</a>. If you do not agree, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">2. Not a law firm</h2>
            <p className="mt-3">
              Justice Shield is a private legal response network and technology platform. We are not a law firm and do not provide legal advice. Attorneys dispatched through the Service are independent professionals responsible for their own representation, advice, and conduct.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">2.1 Complimentary document review & demand letters</h2>
            <p className="mt-3">
              As a benefit of active membership, a network attorney will review member-submitted documents and, where appropriate, draft and send demand letters on the member's behalf at no additional charge. This complimentary service is subject to attorney availability, reasonable scope and volume limits, conflict-of-interest checks, and the attorney's independent professional judgment. It does not create an attorney-client relationship with Justice Shield, does not cover litigation, court appearances, negotiations beyond the demand letter, or matters the attorney declines to accept, and may be modified, limited, or discontinued at any time.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">3. Eligibility</h2>
            <p className="mt-3">
              You must be at least 18 years old and able to enter into a binding contract to use the Service. By registering, you represent that the information you provide is accurate and complete.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">4. Membership & billing</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Membership fees are billed in advance on a recurring basis.</li>
              <li>Fees are non-refundable except where required by law.</li>
              <li>You may cancel at any time; access continues through the end of the paid period.</li>
              <li>We may change pricing with at least 30 days' notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">5. Acceptable use</h2>
            <p className="mt-3">You agree not to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Use the Service for unlawful purposes or to facilitate criminal activity.</li>
              <li>Submit false, misleading, or fraudulent incident reports.</li>
              <li>Interfere with, disrupt, or attempt to gain unauthorized access to the Service.</li>
              <li>Resell, sublicense, or commercially exploit the Service without written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">6. Attorney engagement</h2>
            <p className="mt-3">
              When an attorney is dispatched, an attorney-client relationship forms directly between you and that attorney, subject to their engagement terms. Justice Shield is not a party to that relationship and is not responsible for the legal services provided.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">7. Protection warranty</h2>
            <p className="mt-3">
              Coverage limits, response-time targets, and warranty terms are described on our pricing page and may be updated from time to time. Warranty obligations are subject to your compliance with these Terms and active membership status.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">8. Disclaimers</h2>
            <p className="mt-3">
              The Service is provided "as is" and "as available" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose, and non-infringement. We do not guarantee any particular legal outcome.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">9. Limitation of liability</h2>
            <p className="mt-3">
              To the maximum extent permitted by law, Justice Shield's aggregate liability arising out of or relating to the Service shall not exceed the fees you paid in the twelve (12) months preceding the claim. We are not liable for indirect, incidental, consequential, or punitive damages.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">10. Indemnification</h2>
            <p className="mt-3">
              You agree to indemnify and hold harmless Justice Shield, its affiliates, and their personnel from any claims arising out of your use of the Service or breach of these Terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">11. Termination</h2>
            <p className="mt-3">
              We may suspend or terminate your account for violations of these Terms or for any activity that risks harm to other members, attorneys, or the Service.
            </p>
          </section>

          <section id="dispute-resolution">
            <h2 className="font-display text-2xl font-bold text-titanium-50">12. Dispute resolution</h2>
            <p className="mt-3">
              This Section 12 governs any dispute, claim, or controversy between you and Justice Shield arising out of or relating to these Terms, the Service, or the relationship between us, whether based in contract, tort, statute, fraud, misrepresentation, or any other legal theory (each, a "Dispute"). It applies to both Users and Vendors. PLEASE READ CAREFULLY — IT AFFECTS YOUR LEGAL RIGHTS, INCLUDING YOUR RIGHT TO A JURY TRIAL AND TO PARTICIPATE IN A CLASS ACTION.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.1 Informal resolution</h3>
            <p className="mt-3">
              Before initiating arbitration, the party raising a Dispute must send a written notice describing the Dispute, the relief sought, and the contact information of the claimant to the other party through the <a href="/contact" className="text-action underline-offset-4 hover:underline">contact page</a>. The parties shall negotiate in good faith for at least sixty (60) days before commencing arbitration. The statute of limitations and any filing-fee deadlines are tolled during the informal-resolution period.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.2 Binding arbitration</h3>
            <p className="mt-3">
              If the Dispute is not resolved informally, it shall be resolved exclusively by final and binding arbitration administered by JAMS under its Streamlined Arbitration Rules and Procedures (for claims under $250,000) or its Comprehensive Arbitration Rules and Procedures (for larger claims), as in effect at the time the arbitration is commenced. The Federal Arbitration Act (9 U.S.C. § 1 et seq.) governs the interpretation and enforcement of this Section.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.3 Arbitrator and authority</h3>
            <p className="mt-3">
              The arbitration shall be conducted by a single neutral arbitrator with substantial experience in commercial or technology disputes. The arbitrator has exclusive authority to resolve any Dispute, including any threshold question of arbitrability, the validity, scope, or enforceability of this Section, and any claim that all or part of these Terms is void or voidable. The arbitrator may grant any remedy that a court could grant under applicable law, including declaratory and injunctive relief, but only in favor of the individual party seeking relief and only to the extent necessary to provide relief warranted by that party's individual claim.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.4 Seat, venue & language</h3>
            <p className="mt-3">
              The seat of arbitration shall be Cherokee County, Georgia. Hearings may be conducted by videoconference, telephone, or in person at a mutually agreeable location. For claims of $25,000 or less, the arbitration shall be conducted on documents only unless the arbitrator orders otherwise. The arbitration shall be conducted in English.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.5 Class action waiver</h3>
            <p className="mt-3">
              YOU AND JUSTICE SHIELD AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN AN INDIVIDUAL CAPACITY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS, COLLECTIVE, CONSOLIDATED, MASS, OR REPRESENTATIVE ACTION OR PROCEEDING. The arbitrator may not consolidate more than one party's claims and may not preside over any form of class or representative proceeding. If this class-action waiver is found unenforceable as to a particular claim or remedy, then that claim or remedy (and only that claim or remedy) shall be severed and brought in a court of competent jurisdiction, and the remaining claims shall be arbitrated.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.6 Jury trial waiver</h3>
            <p className="mt-3">
              YOU AND JUSTICE SHIELD KNOWINGLY AND VOLUNTARILY WAIVE ANY RIGHT TO TRIAL BY JURY FOR ANY DISPUTE ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.7 Fees & costs</h3>
            <p className="mt-3">
              Arbitration fees and the arbitrator's compensation shall be allocated according to the applicable JAMS rules, except that Justice Shield will pay the portion of filing, administrative, and arbitrator fees that exceeds the cost of filing a comparable lawsuit in court for any consumer User claim under $10,000, unless the arbitrator determines the claim is frivolous or brought for an improper purpose. Each party otherwise bears its own attorneys' fees and costs, except where a statute or these Terms expressly provide for fee-shifting.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.8 Confidentiality</h3>
            <p className="mt-3">
              The existence, content, submissions, and award of the arbitration shall be kept confidential by the parties and the arbitrator, except as necessary to enforce or challenge the award, to comply with applicable law or court order, or to pursue legitimate business or legal interests.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.9 Exceptions to arbitration</h3>
            <p className="mt-3">
              Notwithstanding the foregoing, either party may: (a) bring an individual action in small-claims court for any qualifying claim; (b) seek temporary, preliminary, or permanent injunctive or other equitable relief in a court of competent jurisdiction to protect its intellectual property, confidential information, or to enforce Sections 14 (NCNDA), 15 (Non-Compete), or 17 (Intellectual Property); and (c) bring any claim that, by law, cannot be subject to mandatory pre-dispute arbitration.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.10 Governing law</h3>
            <p className="mt-3">
              These Terms and any Dispute are governed by the laws of the State of Georgia, without regard to its conflict-of-laws principles, except that the Federal Arbitration Act governs the interpretation and enforcement of this Section 12. For any matter not subject to arbitration, the parties consent to the exclusive jurisdiction and venue of the state and federal courts located in the Northern District of Georgia, Atlanta Division, Cherokee County, Georgia.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.11 Opt-out right</h3>
            <p className="mt-3">
              You may opt out of this arbitration agreement by sending a written opt-out notice within thirty (30) days of first accepting these Terms via the <a href="/contact" className="text-action underline-offset-4 hover:underline">contact page</a>, including your full name, account email, and a clear statement that you wish to opt out of arbitration. Opting out does not affect any other provision of these Terms.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">12.12 Severability & survival</h3>
            <p className="mt-3">
              If any portion of this Section 12 (other than the class-action waiver in Section 12.5) is found unenforceable, that portion shall be severed and the remainder shall remain in full force. If the class-action waiver is found unenforceable as to all claims, then this entire Section 12 shall be null and void. The obligations in this Section 12 survive termination of your membership or vendor relationship.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">13. Modification of the agreement</h2>
            <p className="mt-3">
              We reserve the right, in our sole discretion, to modify, amend, supplement, or replace these Terms (including any policies, schedules, or guidelines incorporated by reference) at any time. This Section governs how such modifications take effect and your rights with respect to them.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">13.1 Right to modify</h3>
            <p className="mt-3">
              We may revise these Terms to reflect changes in law, regulation, our Service, business operations, security or risk posture, fee structure, or for any other legitimate business reason. Modifications may be made to any provision, including pricing, features, eligibility, dispute-resolution procedures, and acceptable-use rules.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">13.2 Notice of changes</h3>
            <p className="mt-3">
              When we make a material change, we will provide reasonable advance notice by one or more of the following methods: (a) email to the address on file with your account; (b) in-app or in-dashboard notice; (c) a prominent banner on the Service; or (d) posting an updated version on our website with a revised "Last updated" date. Non-material changes (such as typographical corrections, clarifications, or formatting updates) may be made without advance notice.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">13.3 Effective date</h3>
            <p className="mt-3">
              Material changes become effective no fewer than fourteen (14) days after notice is given, unless a shorter period is required by law, regulation, security imperative, or to comply with a court or governmental order — in which case the change takes effect on the date stated in the notice.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">13.4 Acceptance through continued use</h3>
            <p className="mt-3">
              Your continued access to or use of the Service on or after the effective date of any modification constitutes your binding acceptance of the revised Terms. If you do not agree to a modification, your sole and exclusive remedy is to stop using the Service and cancel your account before the effective date in accordance with Section 11 (Termination).
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">13.5 No oral or informal modifications</h3>
            <p className="mt-3">
              No modification, amendment, or waiver of these Terms by you shall be valid or enforceable unless made in a writing signed by an authorized officer of the Company. Statements, representations, or assurances made by support agents, sales personnel, or third parties — whether oral, by chat, by email, or otherwise — do not modify these Terms and are not binding on the Company. The Company is not bound by, and you may not rely on, any course of dealing, course of performance, or trade usage that conflicts with these Terms.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">13.6 Versioning & retention</h3>
            <p className="mt-3">
              The version of these Terms in effect at the time of any given use of the Service governs that use. Prior versions may be made available on request through the <a href="/contact" className="text-action underline-offset-4 hover:underline">contact page</a>. Modifications apply prospectively only and do not retroactively affect Disputes that arose before the effective date, except that procedural changes (including changes to Section 12 — Arbitration, and Section 18 — Governing Law & Jurisdiction) apply to all Disputes filed on or after the effective date, regardless of when the underlying claim arose.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">13.7 Arbitration changes & opt-out</h3>
            <p className="mt-3">
              If we make a material change to Section 12 (Arbitration) after you have accepted these Terms, you may reject that specific change by sending written notice through the <a href="/contact" className="text-action underline-offset-4 hover:underline">contact page</a> within thirty (30) days of the effective date. Such rejection will preserve the prior version of Section 12 as between you and the Company; it will not affect any other provision of these Terms or the continued application of subsequent non-arbitration modifications.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">14. Non-Circumvention & Non-Disclosure (NCNDA)</h2>
            <p className="mt-3">
              This clause applies to all members ("Users") and to all attorneys, marketing specialists, and other professionals in our network ("Vendors"). By using or participating in the Service, both Users and Vendors agree to the following mutual non-circumvention and non-disclosure obligations.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">14.1 Confidential information</h3>
            <p className="mt-3">
              "Confidential Information" includes, without limitation: member identities and contact details, vendor identities and contact details, case facts, incident reports, dispatch records, pricing, fee arrangements, referral sources, internal processes, technology, business methods, and any information marked or reasonably understood to be confidential. Confidential Information does not include information that is publicly available through no breach of this clause.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">14.2 Non-circumvention</h3>
            <p className="mt-3">
              Users and Vendors agree not to bypass, avoid, or circumvent Justice Shield in connection with any relationship, introduction, matter, or opportunity originated through the Service. Specifically, for a period of twenty-four (24) months following the last interaction facilitated by Justice Shield, neither party shall:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Directly or indirectly contact, solicit, retain, refer, or transact with a counterparty introduced through the Service outside of the Justice Shield platform for matters within the scope of the Service.</li>
              <li>Encourage, induce, or assist any third party (including affiliates, employees, family members, or related entities) to do the same.</li>
              <li>Use information obtained through the Service to compete with Justice Shield, to build a competing network, or to divert members or vendors away from the Service.</li>
            </ul>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">14.3 Non-disclosure</h3>
            <p className="mt-3">
              Users and Vendors shall: (a) hold all Confidential Information in strict confidence; (b) use it only for the purpose of receiving or providing services through Justice Shield; (c) not disclose it to any third party without prior written consent, except as required by law or professional rules of conduct; and (d) protect it with at least the same degree of care used to protect their own confidential information, and in no event less than reasonable care.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">14.4 Attorney professional obligations</h3>
            <p className="mt-3">
              Nothing in this clause overrides an attorney's professional, ethical, or legal obligations to a client, including obligations of confidentiality, loyalty, and independent professional judgment under applicable rules of professional conduct. Where this clause conflicts with such obligations, those obligations control.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">14.5 Remedies</h3>
            <p className="mt-3">
              The parties acknowledge that a breach of this clause would cause irreparable harm for which monetary damages alone would be inadequate. Justice Shield is therefore entitled to seek injunctive relief, specific performance, and any other equitable remedies, in addition to monetary damages, reasonable attorneys' fees, and costs.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">14.6 Survival</h3>
            <p className="mt-3">
              The obligations in this Section 14 survive termination of your membership, vendor relationship, or any other arrangement with Justice Shield, and remain in effect for the durations stated above.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">15. Non-Compete</h2>
            <p className="mt-3">
              This clause applies to all members ("Users") and to all attorneys, marketing specialists, and other professionals in our network ("Vendors"). By using or participating in the Service, both Users and Vendors agree to the following non-compete obligations, subject to applicable law and professional rules of conduct.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">15.1 Restricted activities</h3>
            <p className="mt-3">
              During active membership or vendor engagement, and for a period of twelve (12) months following its termination, Users and Vendors shall not, directly or indirectly (whether as owner, partner, employee, contractor, advisor, investor, or otherwise):
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Establish, operate, finance, or assist any business, platform, or network that competes with Justice Shield's private legal response, civil-rights dispatch, or related membership services.</li>
              <li>Recruit, solicit, or hire any attorney, vendor, employee, or contractor of Justice Shield to participate in or build a competing service.</li>
              <li>Solicit Justice Shield members to obtain comparable services from a competing provider, where that solicitation is based on relationships, data, or information obtained through the Service.</li>
            </ul>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">15.2 Geographic scope</h3>
            <p className="mt-3">
              These restrictions apply in every U.S. state and territory in which Justice Shield offers or actively prepares to offer the Service during the Restricted Period.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">15.3 Permitted activities</h3>
            <p className="mt-3">
              Nothing in this clause prevents an attorney Vendor from maintaining an independent legal practice, representing existing clients, or accepting matters that did not originate through the Service. Nothing prevents a User from retaining counsel of their choice for any matter. Passive ownership of less than 1% of a publicly traded company is also permitted.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">15.4 Attorney professional obligations</h3>
            <p className="mt-3">
              Nothing in this clause overrides an attorney's professional, ethical, or legal obligations under applicable rules of professional conduct, including a client's right to choose counsel. Where this clause conflicts with such obligations or with applicable law (including jurisdictions that limit or prohibit non-compete agreements), the obligation or law controls and the remainder of this clause continues to apply to the maximum extent permitted.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">15.5 Reasonableness & reformation</h3>
            <p className="mt-3">
              The parties agree that the duration, scope, and geographic reach of this clause are reasonable and necessary to protect Justice Shield's legitimate business interests. If a court finds any portion unenforceable, that portion shall be reformed to the minimum extent necessary to make it enforceable, and the remainder shall remain in full force.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">15.6 Remedies & survival</h3>
            <p className="mt-3">
              A breach of this clause would cause irreparable harm for which monetary damages alone would be inadequate. Justice Shield is entitled to seek injunctive relief and any other equitable remedies, in addition to monetary damages, reasonable attorneys' fees, and costs. The obligations in this Section 15 survive termination of your membership or vendor relationship for the durations stated above.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">16. Testimonials, likeness & promotional use</h2>
            <p className="mt-3">
              This clause applies to all members ("Users") and to all attorneys, marketing specialists, and other professionals in our network ("Vendors"). By using or participating in the Service, both Users and Vendors grant Justice Shield the rights described below to support marketing, advertising, and promotion of the Service.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">16.1 License grant</h3>
            <p className="mt-3">
              You grant Justice Shield and its affiliates a worldwide, royalty-free, sublicensable, transferable, and perpetual (subject to Section 16.5) license to use, reproduce, modify, adapt, edit, publish, distribute, display, perform, and create derivative works from any testimonials, reviews, quotes, statements, ratings, photographs, video or audio recordings, name, voice, likeness, image, biographical information, professional credentials (for Vendors), and other materials you submit, provide, or authorize in connection with the Service (collectively, "Promotional Materials").
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">16.2 Permitted uses</h3>
            <p className="mt-3">
              Justice Shield may use Promotional Materials to advertise, market, and promote its products and services across any media now known or later developed, including websites, social media, email, mobile applications, print, broadcast, streaming, paid advertising, investor materials, and press communications. Justice Shield may edit Promotional Materials for length, clarity, and format, provided that the substance of any testimonial is not materially altered.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">16.3 Confidentiality & privilege</h3>
            <p className="mt-3">
              Notwithstanding the license above, Justice Shield will not publish content that is subject to attorney-client privilege, attorney work product, or sealed or confidential case information without your separate, specific, written consent. Vendors remain bound by their professional and ethical obligations, which control over this clause where they conflict.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">16.4 No additional compensation</h3>
            <p className="mt-3">
              You acknowledge that membership in or participation with Justice Shield is sufficient consideration for the rights granted in this Section, and you waive any right to inspect or approve the finished promotional materials or the compensation derived from their use.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">16.5 Withdrawal of consent</h3>
            <p className="mt-3">
              You may withdraw consent for future use of your name, likeness, or testimonial by submitting a written request through the <a href="/contact" className="text-action underline-offset-4 hover:underline">contact page</a>. Justice Shield will cease new uses within a commercially reasonable time but is not obligated to recall, destroy, or modify materials already produced, printed, distributed, or placed with third parties.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">16.6 Representations</h3>
            <p className="mt-3">
              You represent and warrant that any Promotional Materials you submit are truthful and accurate, that you own or control all rights necessary to grant this license, and that the use of such materials by Justice Shield will not violate the rights of any third party or any applicable law or rule of professional conduct.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">17. Intellectual property</h2>
            <p className="mt-3">
              This clause applies to all members ("Users") and to all attorneys, marketing specialists, and other professionals in our network ("Vendors"). All intellectual property associated with Justice Shield is and remains the exclusive property of Justice Shield and its licensors.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">17.1 Ownership</h3>
            <p className="mt-3">
              Justice Shield owns all right, title, and interest in and to the Service, including without limitation the platform, software, source code, object code, APIs, dispatch system, mobile and web applications, databases, documentation, workflows, response protocols, training materials, designs, user interfaces, graphics, audio, video, text, brand names, logos, trademarks, service marks, trade dress, trade secrets, know-how, methodologies, and all related intellectual property rights worldwide (collectively, the "IP"). All rights not expressly granted are reserved.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">17.2 Limited license to users and vendors</h3>
            <p className="mt-3">
              Subject to your continued compliance with these Terms, Justice Shield grants you a limited, revocable, non-exclusive, non-transferable, non-sublicensable license to access and use the Service solely for its intended purpose: for Users, to receive protection and dispatch services; for Vendors, to deliver services to Users through the Service. This license terminates automatically upon termination of your membership or vendor engagement.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">17.3 Restrictions</h3>
            <p className="mt-3">You shall not, and shall not permit any third party to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Copy, reproduce, modify, translate, adapt, or create derivative works of any portion of the Service or IP.</li>
              <li>Reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code, structure, or underlying ideas of the Service.</li>
              <li>Rent, lease, sell, sublicense, distribute, publish, or otherwise commercially exploit the Service or IP.</li>
              <li>Use the Service or IP to build, train, or improve any competing product, service, dataset, or machine-learning model.</li>
              <li>Scrape, crawl, harvest, or otherwise extract data from the Service through automated means without prior written consent.</li>
              <li>Remove, alter, or obscure any copyright, trademark, or other proprietary notices, or use Justice Shield's name, logos, or marks without prior written permission.</li>
            </ul>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">17.4 Feedback</h3>
            <p className="mt-3">
              If you submit ideas, suggestions, feature requests, or other feedback regarding the Service ("Feedback"), you grant Justice Shield a perpetual, irrevocable, worldwide, royalty-free, sublicensable, and transferable license to use, incorporate, and exploit such Feedback for any purpose without obligation or compensation to you.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">17.5 User and vendor content</h3>
            <p className="mt-3">
              You retain ownership of content you submit to the Service ("Your Content"). You grant Justice Shield a worldwide, royalty-free, sublicensable license to host, store, reproduce, process, and display Your Content solely as necessary to operate, secure, improve, and provide the Service. Vendor work product remains subject to applicable engagement terms and professional rules of conduct.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">17.6 Enforcement & remedies</h3>
            <p className="mt-3">
              Unauthorized use of the IP would cause irreparable harm for which monetary damages alone would be inadequate. Justice Shield is entitled to seek injunctive relief, specific performance, and any other equitable remedies, in addition to monetary damages, reasonable attorneys' fees, and costs. The obligations in this Section 17 survive termination of your membership or vendor relationship.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">18. Governing law & jurisdiction</h2>
            <p className="mt-3">
              This Section supplements and, to the extent of any conflict, controls over the governing-law provisions in Section 12.10. It applies to both Users and Vendors and to any Dispute, claim, or proceeding arising out of or relating to these Terms, the Service, or the relationship between us.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">18.1 Governing law</h3>
            <p className="mt-3">
              These Terms, and any non-contractual obligations arising out of or in connection with them, are governed by and construed in accordance with the laws of the State of Georgia, United States, without regard to its conflict-of-laws principles. The United Nations Convention on Contracts for the International Sale of Goods does not apply. The Federal Arbitration Act (9 U.S.C. § 1 et seq.) governs the interpretation and enforcement of the arbitration agreement in Section 12.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">18.2 Exclusive forum for non-arbitrable matters</h3>
            <p className="mt-3">
              For any Dispute that is not subject to arbitration under Section 12 — including actions to compel arbitration, confirm, modify, or vacate an arbitral award, or to seek injunctive or equitable relief permitted under Section 12.9 — the parties irrevocably consent to the exclusive jurisdiction and venue of the state courts of Cherokee County, Georgia, and the United States District Court for the Northern District of Georgia (Atlanta Division) whose federal venue encompasses Cherokee County, and waive any objection based on improper venue, forum non conveniens, or lack of personal jurisdiction. The parties further agree that no action shall be filed in any other state, county, or federal district.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">18.3 Service of process</h3>
            <p className="mt-3">
              You consent to service of process by (a) certified or registered U.S. mail, return receipt requested, (b) a nationally recognized overnight courier (such as FedEx or UPS) with tracking and signature confirmation, or (c) electronic mail sent to the email address on file with your account, in each case directed to the most recent address you have provided. Service shall be deemed effective: for certified mail, three (3) business days after deposit; for overnight courier, on the next business day after pickup; and for email, on the date of transmission absent a bounce or non-delivery notice. You are responsible for keeping your contact information current and waive any defense of insufficient service of process based on use of these methods. Nothing in this Section limits either party's right to effect service by any other means permitted by the Georgia Civil Practice Act, the Federal Rules of Civil Procedure, or applicable law, nor either party's right to serve process on a registered agent where one has been designated.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">18.4 International users</h3>
            <p className="mt-3">
              The Service is operated from the United States and intended for users located in the United States. If you access the Service from outside the United States, you do so at your own initiative and are responsible for compliance with local laws. You agree that Georgia law and the Cherokee County, Georgia forum selections in this Section apply regardless of your location.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">18.5 Sovereign immunity</h3>
            <p className="mt-3">
              To the extent you may be entitled to claim sovereign or any similar immunity in connection with these Terms, you irrevocably waive that immunity solely for purposes of arbitration, suit, enforcement of judgments, and execution under this Section.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">18.6 Severability</h3>
            <p className="mt-3">
              If any portion of this Section 18 is found unenforceable, that portion shall be reformed to the minimum extent necessary to make it enforceable, and the remainder shall remain in full force.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">19. Severability, reformation & survival</h2>
            <p className="mt-3">
              This Section applies to these Terms as a whole and supplements (and, to the extent of any conflict, controls over) any section-specific severability language elsewhere in these Terms, including Section 18.6.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">19.1 Invalid or unenforceable provisions</h3>
            <p className="mt-3">
              If any provision, sub-provision, sentence, clause, or word of these Terms is held by a court of competent jurisdiction or arbitrator to be invalid, illegal, void, or unenforceable for any reason — whether under present or future law, in whole or in part, or as applied to any person, entity, or circumstance — such determination shall not affect the validity or enforceability of (a) the remaining provisions of these Terms, or (b) that same provision as applied to any other person, entity, or circumstance. The remainder of these Terms shall continue in full force and effect as if the invalid provision had never been included.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">19.2 Reformation & blue-pencil</h3>
            <p className="mt-3">
              Where any provision is found overbroad, excessive in scope, duration, or geographic reach, or otherwise unenforceable as written, the parties expressly authorize the court or arbitrator to reform, modify, narrow, or "blue-pencil" the provision to the minimum extent necessary to render it valid and enforceable while preserving, to the greatest extent permitted by law, the original intent and economic effect of the parties. If reformation is not permitted under applicable law, the unenforceable provision shall be deemed severed and replaced by a valid, enforceable provision that most closely reflects the parties' original intent.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">19.3 Class-action waiver carve-out</h3>
            <p className="mt-3">
              Notwithstanding the foregoing, if the Class Action Waiver in Section 12.5 is held unenforceable as to any claim or remedy, that specific claim or remedy shall be severed and adjudicated in court in accordance with Section 18, and the remainder of the arbitration agreement in Section 12 shall remain in full force and effect.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">19.4 Survival</h3>
            <p className="mt-3">
              All provisions of these Terms that by their nature should survive termination or expiration of your account, membership, or vendor relationship shall so survive, including without limitation: ownership and intellectual property rights; confidentiality and NCNDA obligations; disclaimers and limitations of liability; indemnification; dispute resolution and arbitration (Section 12); governing law and jurisdiction (Section 18); this Severability section (Section 19); and any accrued payment obligations.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">19.5 No waiver</h3>
            <p className="mt-3">
              The failure of either party to enforce any provision of these Terms, or to exercise any right or remedy, shall not be construed as a waiver of that provision, right, or remedy, nor shall any single or partial exercise preclude any further exercise. Any waiver must be in writing and signed by the waiving party to be effective, and shall apply only to the specific instance and purpose for which it was given.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">20. Third-party links, content & services</h2>
            <p className="mt-3">
              The Service may contain links, references, integrations, or pointers to third-party websites, applications, vendors, attorneys, bail agents, content, advertisements, products, or services (collectively, "Third-Party Resources"). Third-Party Resources are provided for your convenience and informational purposes only.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">20.1 No endorsement</h3>
            <p className="mt-3">
              Inclusion of any Third-Party Resource in or through the Service does not constitute an endorsement, sponsorship, recommendation, affiliation, partnership, joint venture, agency, or guarantee by us. Listings of attorneys, bail agents, or other vendors are directory-style references and do not establish an attorney-client, fiduciary, or representational relationship with us.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">20.2 No control or responsibility</h3>
            <p className="mt-3">
              We do not own, operate, monitor, control, or endorse Third-Party Resources and are not responsible for their availability, accuracy, legality, decency, quality, safety, security, privacy practices, terms, pricing, or content. Your access to and use of Third-Party Resources is solely at your own risk and is governed by the terms, conditions, and privacy policies of the applicable third party, not by these Terms.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">20.3 Independent transactions</h3>
            <p className="mt-3">
              Any interaction, communication, engagement, retention, payment, or transaction between you and any third party — including any attorney, bail agent, vendor, advertiser, or other provider reached through the Service — is solely between you and that third party. We are not a party to, and bear no responsibility or liability for, any such interaction or transaction, including any dispute, loss, damage, malpractice, breach, or injury arising out of or related to it.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">20.4 No legal advice via third parties</h3>
            <p className="mt-3">
              Information, materials, or communications provided by or through Third-Party Resources do not constitute legal advice from us, and accessing such materials through the Service does not create an attorney-client relationship with us. You should independently verify any information and consult a qualified, licensed attorney regarding your specific circumstances.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">20.5 Right to remove or restrict</h3>
            <p className="mt-3">
              We reserve the right, in our sole discretion and without notice or liability, to add, modify, suspend, restrict, disable, or remove any link to or integration with any Third-Party Resource at any time and for any or no reason.
            </p>

            <h3 className="mt-6 font-display text-lg font-bold text-titanium-50">20.6 Release & indemnification</h3>
            <p className="mt-3">
              To the maximum extent permitted by applicable law, you release us and our affiliates, officers, directors, employees, and agents from any and all claims, demands, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) of every kind and nature, known and unknown, arising out of or in any way connected with your access to, use of, or reliance on any Third-Party Resource. You agree to indemnify and hold us harmless from any such claims to the extent caused by your dealings with any third party reached through the Service.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold text-titanium-50">21. Contact</h2>
            <p className="mt-3">
              Questions about these Terms? Reach us through the <a href="/contact" className="text-action underline-offset-4 hover:underline">contact page</a>.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

