"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { ShieldMark } from "./ShieldMark";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export function SiteHeader() {
  const { user, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/how-it-works", label: "How" },
    { href: "/civil", label: "Civil" },
    { href: "/pricing", label: "Pricing" },
    { href: "/vendors", label: "Vendors" },
    { href: "/contact", label: "Contact" },
  ];

  const handleDashboardRedirect = () => {
    if (user?.role === "ADMIN") {
      return "/app/admin";
    } else {
      return "/app";
    }
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-titanium-800/60 bg-titanium-950/85 backdrop-blur-md h-auto">
      <div className="mx-auto flex h-auto py-4 max-w-7xl items-center justify-between px-4 sm:px-6 change-direction">
        <div className="flex items-center gap-3 sm:gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <ShieldMark className="size-7 text-action" />
            <span className="font-display text-base sm:text-lg font-bold uppercase italic tracking-tighter">
              Justice <span className="text-action">Shield</span>
            </span>
          </Link>
          <div className="hidden items-center gap-1 rounded-full border border-titanium-800 bg-titanium-900 px-3 py-1 min-[876px]:flex">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-400">
              1,842 Attorneys Live
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Desktop Links */}
          <div className="hidden items-center gap-3 sm:gap-6 min-[876px]:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-xs uppercase tracking-widest text-titanium-400 transition-colors hover:text-titanium-50"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {user ? (
            <>
              <Link
                href={handleDashboardRedirect()}
                className="rounded-sm bg-action px-4 py-2 text-xs font-bold uppercase tracking-widest text-action-foreground transition-colors hover:bg-action/90"
              >
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="hidden font-mono text-xs uppercase tracking-widest text-titanium-400 hover:text-titanium-50 min-[876px]:block"
              >
                Exit
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="rounded-sm bg-titanium-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-titanium-950 transition-colors hover:bg-titanium-200"
            >
              Sign In
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-titanium-400 hover:text-titanium-50 min-[876px]:hidden"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="absolute inset-x-0 top-16 border-b border-titanium-800 bg-titanium-950/95 p-4 backdrop-blur-md min-[876px]:hidden">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-sm px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-titanium-400 transition-colors hover:bg-titanium-900 hover:text-titanium-50"
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <>
                <div className="my-2 h-px bg-titanium-800/60" />
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut(); }}
                  className="block w-full rounded-sm px-4 py-3 text-left font-mono text-[11px] font-bold uppercase tracking-widest text-titanium-400 transition-colors hover:bg-titanium-900 hover:text-titanium-50"
                >
                  Exit
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
