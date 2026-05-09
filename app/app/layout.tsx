"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ShieldMark } from "@/components/ShieldMark";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const navItems = user?.role === "ATTORNEY"
    ? [
      { href: "/app/attorney", label: "Dashboard", exact: true },
      { href: "/app/attorney/cases", label: "My Cases" },
      { href: "/app/attorney/history", label: "All Records" },
      { href: "/app/messages", label: "Messages" },
      { href: "/app/account", label: "Account" },
    ]
    : [
      { href: "/app", label: "Dashboard", exact: true },
      { href: "/app/sos", label: "SOS" },
      { href: "/app/civil", label: "Civil" },
      { href: "/app/cases", label: "Cases" },
      { href: "/app/attorneys", label: "Attorneys" },
      { href: "/app/history", label: "History" },
      { href: "/app/messages", label: "Messages" },
      { href: "/app/account", label: "Account" },
    ];

  if (pathname.startsWith("/app/admin")) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh bg-titanium-950 text-titanium-50">
      <nav className="sticky top-0 z-40 border-b border-titanium-800 bg-titanium-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <ShieldMark className="size-7 text-action" />
            <span className="font-display text-base font-bold uppercase italic tracking-tighter">
              Justice <span className="text-action">Shield</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[10px] uppercase tracking-widest text-titanium-500 md:inline">
              {user?.email}
            </span>
            {user?.role === "ADMIN" && (
              <Link
                href="/app/admin"
                className="font-mono text-[10px] uppercase tracking-widest text-red-400 hover:text-red-300"
              >
                Admin
              </Link>
            )}
            <button
              onClick={() => signOut()}
              className="font-mono text-[10px] uppercase tracking-widest text-titanium-400 hover:text-titanium-50"
            >
              Exit
            </button>
          </div>
        </div>
        <div className="border-t border-titanium-800/60">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4">
            {navItems.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative whitespace-nowrap px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${active ? "text-action" : "text-titanium-400 hover:text-titanium-50"
                    }`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action" />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
