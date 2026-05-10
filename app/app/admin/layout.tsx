"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ShieldMark } from "@/components/ShieldMark";
import { useEffect } from "react";
import { motion } from "framer-motion";

const adminNav = [
  { href: "/app/admin", label: "Overview", exact: true },
  { href: "/app/admin/users", label: "Users" },
  { href: "/app/admin/attorneys", label: "Attorneys" },
  { href: "/app/admin/vendors", label: "Vendors" },
  { href: "/app/admin/cases", label: "Cases" },
  { href: "/app/admin/messages", label: "Messages" },
  { href: "/app/admin/account", label: "Account" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-titanium-950">
        <span className="font-mono text-xs text-titanium-500">Loading...</span>
      </div>
    );
  }

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <nav className="sticky top-0 z-40 border-b border-titanium-800 bg-titanium-950/95 backdrop-blur-md">
        <div className="mx-auto flex min-h-[64px] max-w-7xl items-center justify-between px-4 py-2 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <ShieldMark className="size-6 sm:size-7 text-red-500" />
            <span className="font-display text-sm sm:text-lg font-bold uppercase italic tracking-tighter">
              Justice <span className="text-action">Shield</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 sm:gap-6">
            <span className="hidden sm:inline font-mono text-[9px] uppercase tracking-widest text-titanium-500 max-w-[150px] truncate">
              {user?.email}
            </span>
            <div className="flex items-center gap-4">
              <Link
                href="/app"
                className="font-mono text-[10px] uppercase tracking-widest text-titanium-400 hover:text-titanium-50 whitespace-nowrap"
              >
                ← <span className="xs:inline">Dashboard</span>
              </Link>
              <button
                onClick={() => signOut()}
                className="font-mono text-[10px] uppercase tracking-widest text-titanium-400 hover:text-titanium-50 whitespace-nowrap"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-titanium-800/60 bg-titanium-950/50">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4 no-scrollbar scroll-smooth">
            {adminNav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative whitespace-nowrap px-4 py-3.5 font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors ${active ? "text-red-500" : "text-titanium-400 hover:text-titanium-50"
                    }`}
                >
                  {item.label}
                  {active && <motion.span layoutId="activeNav" className="absolute inset-x-2 bottom-0 h-0.5 bg-red-500 rounded-full" />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        {children}
      </main>
    </div>
  );
}
