"use client";

import { createPortal } from "react-dom";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Scale, Phone, Mail, MapPin, User as UserIcon, FileText,
  ShieldCheck, X, CheckCircle2,
} from "lucide-react";

interface CaseUser {
  id?: string;
  full_name?: string | null;
  email?: string;
  phone?: string | null;
  city?: string | null;
  country?: string | null;
}

interface CaseDetail {
  id: string;
  type?: "civil" | "sos";
  matter_type?: string;
  encounter_type?: string;
  urgency?: string;
  subject?: string;
  description?: string;
  notes?: string;
  preferred_contact?: string;
  status: string;
  created_at?: string;
  started_at?: string;
  location_address?: string | null;
  opposing_party?: string | null;
  opposing_party_location?: string | null;
  user?: CaseUser;
  metadata?: Record<string, any> | null;
  rejection_message?: string | null;
}

interface Props {
  caseData: CaseDetail | null;
  onClose: () => void;
}

export default function CaseDetailModal({ caseData, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const isSos = caseData?.type === "sos";
  const subject = caseData?.subject || (isSos ? `SOS Emergency: ${caseData?.encounter_type?.replace(/_/g, " ")}` : "Unknown Matter");
  const matterType = caseData?.matter_type || caseData?.encounter_type || "N/A";
  const description = caseData?.description || caseData?.notes || "No details provided for this engagement.";
  const createdAt = caseData?.created_at || caseData?.started_at;
  const urgency = caseData?.urgency || (isSos ? "CRITICAL" : "STANDARD");

  const statusColor =
    caseData?.status === "resolved" ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10"
    : caseData?.status === "active"   ? "text-blue-400 border-blue-400/20 bg-blue-400/10"
    : caseData?.status === "rejected" ? "text-red-400 border-red-400/20 bg-red-400/10"
    : "text-amber-400 border-amber-400/20 bg-amber-400/10";

  return createPortal(
    <AnimatePresence>
      {caseData && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-titanium-950/90 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-titanium-800 bg-titanium-950 shadow-[0_0_60px_-12px_rgba(0,0,0,0.7)] scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div className={`relative h-20 sm:h-28 border-b border-titanium-800 ${isSos ? "bg-gradient-to-r from-red-500/20 via-titanium-900 to-titanium-950" : "bg-gradient-to-r from-action/20 via-titanium-900 to-titanium-950"}`}>
              <div className="absolute -bottom-8 sm:-bottom-10 left-4 sm:left-8 rounded-full border-4 border-titanium-950 bg-titanium-900 p-2.5 sm:p-4 shadow-2xl">
                {isSos
                  ? <ShieldCheck className="size-6 sm:size-10 text-red-400" />
                  : <FileText className="size-6 sm:size-10 text-action" />
                }
              </div>
              {/* Priority badge — hidden on very small screens to avoid overlap */}
              <div className="absolute top-3 right-12 hidden xs:flex gap-2">
                <div className={`rounded-full border px-2 sm:px-3 py-0.5 sm:py-1 font-mono text-[8px] sm:text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm ${isSos ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-action/20 bg-action/5 text-action"}`}>
                  {urgency} PRIORITY
                </div>
              </div>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 rounded-full p-2 text-titanium-400 hover:bg-titanium-800 hover:text-titanium-50 transition-colors"
              >
                <X className="size-4 sm:size-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 md:p-8 pt-10 sm:pt-14 space-y-5 sm:space-y-8">
              {/* Title + Status badge */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                <div className="space-y-1 min-w-0">
                  <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-titanium-50 tracking-tight break-words">
                    {subject}
                  </h2>
                  <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-action/80">
                    {matterType.replace(/_/g, " ")}
                  </p>
                </div>
                <Badge variant="secondary" className={`font-mono text-[9px] uppercase tracking-widest h-6 px-3 shrink-0 self-start ${statusColor}`}>
                  {caseData?.status}
                </Badge>
              </div>

              {/* Client + Metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-8 border-y border-titanium-800/50 py-5 sm:py-8">
                {/* Client credentials */}
                {caseData?.user && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="size-1 bg-action rounded-full shrink-0" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Client Credentials</h4>
                    </div>
                    <div className="space-y-2.5 sm:space-y-3">
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-titanium-300">
                        <div className="size-7 sm:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800 shrink-0">
                          <UserIcon className="size-3.5 sm:size-4 text-action/70" />
                        </div>
                        <span className="truncate font-medium">{caseData.user.full_name || "Anonymous Member"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs sm:text-sm text-action font-mono">
                        <div className="size-7 sm:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800 shrink-0">
                          <Phone className="size-3.5 sm:size-4" />
                        </div>
                        <span className="break-all">{caseData.user.phone || "Not provided"}</span>
                      </div>
                      {caseData.user.email && (
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-titanium-300">
                          <div className="size-7 sm:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800 shrink-0">
                            <Mail className="size-3.5 sm:size-4 text-action/70" />
                          </div>
                          <span className="break-all min-w-0">{caseData.user.email}</span>
                        </div>
                      )}
                      {(caseData.user.city || caseData.user.country) && (
                        <div className="flex items-center gap-3 text-xs sm:text-sm text-titanium-300">
                          <div className="size-7 sm:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800 shrink-0">
                            <MapPin className="size-3.5 sm:size-4 text-action/70" />
                          </div>
                          <span className="break-words">{[caseData.user.city, caseData.user.country].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Engagement metrics */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="size-1 bg-action rounded-full shrink-0" />
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Engagement Metrics</h4>
                  </div>
                  <div className="space-y-2.5 sm:space-y-3">
                    {caseData?.preferred_contact && (
                      <div className="flex flex-col gap-0.5 rounded-sm border border-titanium-800 bg-titanium-900/30 p-2.5 sm:p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Preferred Channel</span>
                        <span className="font-mono text-[10px] sm:text-xs font-bold text-action uppercase break-words">{caseData.preferred_contact}</span>
                      </div>
                    )}
                    {createdAt && (
                      <div className="flex flex-col gap-0.5 rounded-sm border border-titanium-800 bg-titanium-900/30 p-2.5 sm:p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Filing Date</span>
                        <span className="font-mono text-[10px] sm:text-xs font-bold text-titanium-300 uppercase">{new Date(createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {caseData?.location_address && (
                      <div className="flex flex-col gap-0.5 rounded-sm border border-titanium-800 bg-titanium-900/30 p-2.5 sm:p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Location</span>
                        <span className="font-mono text-[10px] sm:text-xs font-bold text-titanium-300 break-words">{caseData.location_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="size-1 bg-action rounded-full shrink-0" />
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Case Documentation</h4>
                </div>
                <div className="rounded-lg bg-titanium-900/50 border border-titanium-800 p-3.5 sm:p-5">
                  <p className="text-xs sm:text-sm leading-relaxed text-titanium-300 font-light whitespace-pre-wrap break-words">
                    {description}
                  </p>
                </div>
              </div>

              {/* Opposing party */}
              {caseData?.opposing_party && (
                <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3.5 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-red-500/80">
                    <Scale className="size-4 shrink-0" />
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Opposing Party Conflict Check</h4>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-titanium-50 break-words">{caseData.opposing_party}</div>
                    {caseData.opposing_party_location && (
                      <div className="font-mono text-[10px] uppercase text-titanium-500 break-words">{caseData.opposing_party_location}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {caseData?.metadata && Object.keys(caseData.metadata).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-action/60">
                    <ShieldCheck className="size-4 shrink-0" />
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Tactical Intake Data</h4>
                  </div>
                  <div className="grid gap-2 rounded-lg border border-titanium-800 bg-titanium-950/30 p-3.5 sm:p-4">
                    {Object.entries(caseData.metadata).map(([key, value]) => (
                      <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-0.5 py-2 border-b border-titanium-800 last:border-0">
                        <span className="text-titanium-500 capitalize text-[10px] font-mono shrink-0">{key.replace(/_/g, " ")}:</span>
                        <span className="font-medium text-titanium-200 text-xs break-words sm:text-right sm:max-w-[60%]">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection reason */}
              {caseData?.status === "rejected" && caseData?.rejection_message && (
                <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3.5 sm:p-5 space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <X className="size-4 shrink-0" />
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Rejection Reason</h4>
                  </div>
                  <p className="text-xs sm:text-sm text-titanium-300 leading-relaxed font-light break-words">{caseData.rejection_message}</p>
                </div>
              )}

              {/* Resolved badge */}
              {caseData?.status === "resolved" && (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3.5 sm:p-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">Matter Finalized</div>
                  </div>
                  <div className="font-mono text-xs font-bold text-emerald-500 uppercase">Case Resolved</div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 z-10 border-t border-titanium-800 bg-titanium-950 p-3.5 sm:p-5 flex justify-end backdrop-blur-md">
              <button
                onClick={onClose}
                className="w-full sm:w-auto rounded-sm border border-titanium-700 px-6 sm:px-8 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-300 hover:bg-titanium-800 transition-all text-center"
              >
                Close Archive
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
