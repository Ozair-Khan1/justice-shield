"use client";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, LogOut, User as UserIcon } from "lucide-react";
import { ShieldMark } from "./ShieldMark";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: NavItem[];
  userEmail?: string;
  onSignOut: () => void;
  pathname: string;
  activeColor?: string;
  activeIndicatorColor?: string;
}

export function MobileSidebar({
  isOpen,
  onClose,
  navItems,
  userEmail,
  onSignOut,
  pathname,
  activeColor = "text-action",
  activeIndicatorColor = "bg-action"
}: MobileSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm lg:hidden"
          />
          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[101] w-[280px] bg-titanium-950 border-l border-titanium-800 shadow-2xl lg:hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-titanium-800">
              <div className="flex items-center gap-2">
                <ShieldMark className="size-6 text-action" />
                <span className="font-display text-sm font-bold uppercase italic tracking-tighter text-white">
                  Justice <span className="text-action">Shield</span>
                </span>
              </div>
              <button onClick={onClose} className="p-2 text-titanium-400 hover:text-white transition-colors">
                <X className="size-5" />
              </button>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
              {navItems.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest transition-all rounded-sm ${
                      active 
                        ? `${activeColor} bg-white/5` 
                        : "text-titanium-400 hover:text-titanium-50 hover:bg-white/5"
                    }`}
                  >
                    {item.label}
                    {active && <motion.div layoutId="mobileActive" className={`ml-auto size-1 ${activeIndicatorColor} rounded-full`} />}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-6 border-t border-titanium-800 bg-titanium-900/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-8 rounded-full bg-titanium-800 flex items-center justify-center">
                  <UserIcon className="size-4 text-titanium-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] text-titanium-500 font-mono uppercase tracking-tighter truncate">
                    Logged in as
                  </span>
                  <span className="text-[11px] text-titanium-200 font-mono truncate">
                    {userEmail}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                className="flex items-center justify-center gap-2 w-full py-3 border border-titanium-800 hover:bg-red-500/10 hover:border-red-500/50 text-titanium-400 hover:text-red-500 font-mono text-[10px] uppercase tracking-widest transition-all"
              >
                <LogOut className="size-3" />
                Sign Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
