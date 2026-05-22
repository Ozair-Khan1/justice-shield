"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface MembershipChangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: string;
  newTier: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function MembershipChangeModal({
  open,
  onOpenChange,
  currentTier,
  newTier,
  onConfirm,
  loading = false,
}: MembershipChangeModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-titanium-900 border-titanium-800 text-titanium-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-display text-2xl">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Change Membership Plan
          </DialogTitle>
          <DialogDescription className="text-titanium-400 text-base mt-4">
            You currently have an active <span className="font-bold text-titanium-200">{currentTier}</span> membership.
            <br />
            <br />
            Do you want to change it to <span className="font-bold text-titanium-200">{newTier}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-bold text-amber-200 text-sm">Important Notice</p>
              <p className="text-sm text-titanium-300">
                Your current <span className="font-semibold">{currentTier}</span> membership will be immediately canceled when you proceed with this change. You will be charged for the new plan right away.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto rounded-sm border border-titanium-700 bg-titanium-900 px-6 py-3 text-sm font-bold uppercase tracking-widest text-titanium-50 hover:bg-titanium-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto rounded-sm bg-action px-6 py-3 text-sm font-bold uppercase tracking-widest text-action-foreground hover:bg-action/90 transition-colors shadow-[0_0_20px_rgba(var(--action-rgb),0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Confirm Change"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
