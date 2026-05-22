"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, ShieldAlert } from "lucide-react";
import Link from "next/link";

interface SubscriptionRequiredModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
}

export function SubscriptionRequiredModal({
  open,
  onOpenChange,
  title = "Subscription Required",
  message = "This feature requires an active membership. Please subscribe to continue using Justice Shield protection services.",
}: SubscriptionRequiredModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-titanium-900 border-titanium-800 text-titanium-50 z-9990">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-display text-2xl">
            <ShieldAlert className="h-6 w-6 text-red-500" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-titanium-400 text-base mt-4">
            {message}
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-bold text-red-200 text-sm">Access Restricted</p>
              <p className="text-sm text-titanium-300">
                Your membership has expired or you don't have an active subscription. Subscribe now to unlock all features and continue your protection.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto rounded-sm border border-titanium-700 bg-titanium-900 px-6 py-3 text-sm font-bold uppercase tracking-widest text-titanium-50 hover:bg-titanium-800 transition-colors"
          >
            Close
          </button>
          <Link
            href="/pricing"
            className="w-full sm:w-auto text-center rounded-sm bg-action px-6 py-3 text-sm font-bold uppercase tracking-widest text-action-foreground hover:bg-action/90 transition-colors shadow-[0_0_20px_rgba(var(--action-rgb),0.3)]"
          >
            View Plans
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
