"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ShieldMark } from "@/components/ShieldMark";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const adminNav = [
  { href: "/app/admin", label: "Overview", exact: true },
  { href: "/app/admin/users", label: "Users" },
  { href: "/app/admin/vendors", label: "Vendors" },
  { href: "/app/admin/account", label: "Account" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== "ADMIN") {
      router.push("/app");
    }
  }, [user, loading, router]);

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
      <nav className="sticky top-0 z-40 border-b border-titanium-800 bg-titanium-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 flex-wrap">
          <Link href="/" className="flex items-center gap-2.5">
            <ShieldMark className="size-7 text-red-500" />
            <span className="font-display text-base sm:text-lg font-bold uppercase italic tracking-tighter">
              Justice <span className="text-action">Shield</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">
              {user?.email}
            </span>
            <Link
              href="/app"
              className="font-mono text-[10px] uppercase tracking-widest text-titanium-400 hover:text-titanium-50"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
        <div className="border-t border-titanium-800/60">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4">
            {adminNav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative whitespace-nowrap px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${active ? "text-red-500" : "text-titanium-400 hover:text-titanium-50"
                    }`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-red-500" />}
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
