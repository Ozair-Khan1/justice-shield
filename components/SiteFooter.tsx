import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-titanium-800 bg-titanium-950 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-6 md:flex-row">
        <div className="flex items-center gap-12">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">
              Version
            </span>
            <span className="font-mono text-xs">v1.0.0-MVP</span>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">
              Coverage
            </span>
            <span className="font-mono text-xs">CRIMINAL + CIVIL</span>
          </div>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <Link href="/contact" className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-titanium-200">Contact</Link>
          <Link href="/pricing" className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-titanium-200">Pricing</Link>
          <Link href="/faq" className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-titanium-200">FAQ</Link>
          <Link href="/terms" className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-titanium-200">Terms</Link>
          <Link href="/privacy" className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-titanium-200">Privacy</Link>
          <Link href="/refunds" className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-titanium-200">Refunds</Link>
          <Link href="/resources" className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-titanium-200">Resources</Link>
          <Link href="/disclaimer" className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-titanium-200">Disclaimer</Link>
        </div>
        <div className="text-center font-mono text-[10px] text-titanium-500 md:text-right">
          JUSTICE SHIELD — PRIVATE LEGAL RESPONSE NETWORK
          <br />
          NOT A LAW FIRM
          <br />
          2026 © JUSTICE SHIELD. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  );
}
