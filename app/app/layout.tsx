"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ShieldMark } from "@/components/ShieldMark";
import { Lock, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { MobileSidebar } from "@/components/MobileSidebar";
import { NotificationCenter } from "@/components/NotificationCenter";
import { motion, AnimatePresence } from "framer-motion";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, signOut, loading: authLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.role === "USER" && user?.membership_tier === "free" && user?.stripe_customer_id === null && user?.stripe_subscription_id === null && user?.subscription_cancel_at === null) {
      router.push("/pricing");
    }
  }, [user, authLoading]);

  const isExpired = user?.role === "USER" && user?.stripe_customer_id && !user?.stripe_subscription_id;
  const isFree = user?.role === "USER" && user?.membership_tier === "free" && user?.stripe_customer_id === null && user?.stripe_subscription_id === null && user?.subscription_cancel_at === null;

  const navItems = (user?.role === "ATTORNEY"
    ? [
      { href: "/app/attorney", label: "Dashboard", exact: true },
      { href: "/app/attorney/cases", label: "My Cases" },
      { href: "/app/recordings", label: "Recordings" },
      { href: "/app/attorney/history", label: "All Records" },
      { href: "/app/messages", label: "Messages" },
      { href: "/app/account", label: "Account" },
    ]
    : [
      { href: "/app", label: "Dashboard", icon: <span className="text-red-600"><Lock /></span>, exact: true },
      { href: "/app/sos", label: "SOS", icon: <span className="text-red-600"><Lock /></span> },
      { href: "/app/civil", label: "Civil", icon: <span className="text-red-600"><Lock /></span> },
      { href: "/app/cases", label: "Cases", icon: <span className="text-red-600"><Lock /></span> },
      { href: "/app/attorneys", label: "Attorneys", icon: <span className="text-red-600"><Lock /></span> },
      { href: "/app/recordings", label: "Recordings", icon: <span className="text-red-600"><Lock /></span> },
      { href: "/app/history", label: "History", icon: <span className="text-red-600"><Lock /></span> },
      user?.role !== "ADMIN" && { href: "/app/messages", label: "Messages", icon: <span className="text-red-600"><Lock /></span> },
      { href: "/app/account", label: "Account", icon: <span className="text-red-600"><Lock /></span> },
    ]).filter(Boolean) as { href: string; label: string; exact?: boolean }[];

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
            <NotificationCenter />
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
              className="hidden sm:inline font-mono text-[10px] uppercase tracking-widest text-titanium-400 hover:text-titanium-50"
            >
              Exit
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-titanium-400 hover:text-white transition-colors"
            >
              <Menu className="size-6" />
            </button>
          </div>
        </div>
        <div className="hidden md:block border-t border-titanium-800/60">

          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 sm:px-4">
            {navItems.map((item) => {
              // 1. Safe active path matching
              const active = item.exact
                ? pathname === item.href
                : item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              // 2. Clear, centralized access control logic
              const isLockedOut = (isFree || isExpired) && user.role !== "ATTORNEY" && user.role !== "ADMIN";

              const dontLock = item.label === "Account"

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    if (isLockedOut && !dontLock) {
                      e.preventDefault();
                    }
                  }}
                  className={`relative flex whitespace-nowrap px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${active ? "text-action" : "text-titanium-400 hover:text-titanium-50"
                    }`}
                >
                  {item.label}

                  {/* 3. Clean lock rendering */}
                  {isLockedOut && !dontLock && (
                    <span className="ml-2">
                      <Lock className="size-4" />
                    </span>
                  )}

                  {active && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action" />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <MobileSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        navItems={navItems}
        userEmail={user?.email}
        onSignOut={signOut}
        pathname={pathname}
      />

      {user?.role === "USER" && user?.stripe_customer_id && !user?.stripe_subscription_id && (
        <div className="fixed left-0 right-0 bg-red-500/10 border-b border-red-500/20 py-3 px-4 text-center">
          <p className="text-xs font-mono font-bold uppercase tracking-widest text-red-400">
            ⚠️ Warning: Your membership has expired. Emergency SOS and civil callback features are suspended.{" "}
            <Link href="/pricing" className="underline hover:text-white transition-colors">
              Reactivate your protection plan now
            </Link>
          </p>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
        {children}
      </main>
    </div>
  );
}
