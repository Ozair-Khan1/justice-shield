"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Scale, Phone, Mail, MapPin, User as UserIcon, AlertCircle, Loader2, CheckCircle2, RefreshCw, ChevronRight, X, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useLoading } from "@/components/LoadingProvider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pagination } from "@/components/Pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface CaseUser {
  full_name: string | null;
  email: string;
  phone: string | null;
}

interface Case {
  id: string;
  type?: "civil" | "sos";
  matter_type: string;
  urgency: string;
  subject: string;
  description: string;
  preferred_contact: string;
  status: string;
  created_at: string;
  location_address?: string | null;
  opposing_party?: string | null;
  opposing_party_location?: string | null;
  user: CaseUser;
}

export default function AttorneyCasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const ITEMS_PER_PAGE = 15;
  const { startLoading, stopLoading } = useLoading();

  const fetchCases = async (silent = false) => {
    if (!silent) { setLoading(true); startLoading("Loading your cases..."); }
    try {
      const res = await fetch("/api/attorney/my-cases");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const combined = (data.cases || []).map((c: any) => ({ ...c, type: 'civil' }))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCases(combined);
    } catch (err: any) {
      setError(err.message || "Failed to load your cases");
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  useEffect(() => {
    if (user) fetchCases();
  }, [user]);

  const handleResolveCase = async (id: string) => {
    setResolvingId(id);
    startLoading("Finalizing Legal Record...");
    try {
      const res = await fetch(`/api/cases/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve case");

      // Update local state
      setCases(prev => prev.map(c => c.id === id ? { ...c, status: "resolved" } : c));
      setSelectedCase(null);
      fetchCases(true);
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setResolvingId(null);
      stopLoading();
    }
  };

  const totalPages = Math.ceil(cases.length / ITEMS_PER_PAGE);
  const paginatedCases = cases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return <LoadingScreen message="Decrypting Case Files..." />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-12 text-center">
        <AlertCircle className="mx-auto size-12 text-red-500 opacity-50" />
        <h2 className="mt-6 font-display text-2xl font-bold text-titanium-50">Access Restricted</h2>
        <p className="mt-2 text-titanium-400 max-w-md mx-auto">{error}</p>
        <Link href="/auth" className="mt-4 font-mono text-[10px] uppercase tracking-widest text-action">
          Retry Authentication
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12"
    >
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between relative">
        <div className="relative">
          <div className="absolute -left-4 top-0 h-full w-1 bg-action/50 blur-[2px]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-action">Counselor Console</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            My <span className="text-titanium-500">Cases</span>
          </h1>
          <p className="mt-4 max-w-2xl text-titanium-400 leading-relaxed">
            Manage the civil matters you have accepted. Review case details and reach out to clients using their preferred contact method.
          </p>
        </div>
        <button
          onClick={() => fetchCases(true)}
          className="group flex items-center gap-2 rounded-sm border border-titanium-800 bg-titanium-900/50 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500 transition-all hover:border-action/50 hover:text-action"
        >
          <RefreshCw className="size-3 transition-transform group-hover:rotate-180" />
          Refresh
        </button>
      </header>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={cases.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      {cases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
          No cases found
        </div>
      ) : (
        <div className="grid gap-4">
          {paginatedCases.map((c) => (
            <Card key={c.id} className="group border-titanium-800 bg-titanium-900/30 hover:border-titanium-700 transition-all overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Badge variant={c.urgency === "CRITICAL" ? "destructive" : "outline"} className="font-mono text-[9px] uppercase tracking-widest h-5">
                        {c.urgency} Priority
                      </Badge>
                      <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">{c.matter_type.replace("_", " ")}</span>
                      <Badge variant="secondary" className={`font-mono text-[8px] uppercase tracking-tighter h-5 ${c.status === "pending" ? "text-amber-500 border-amber-500/20 bg-amber-500/5" : "text-blue-500 border-blue-500/20 bg-blue-500/5"
                        }`}>
                        {c.status}
                      </Badge>
                    </div>
                    <h3 className="font-display text-lg font-bold text-titanium-50 group-hover:text-action transition-colors">{c.subject}</h3>
                    <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="size-3 text-action" />
                        <span>{c.user.full_name || c.user.email}</span>
                      </div>
                      <span className="text-titanium-800">•</span>
                      <div className="flex items-center gap-1.5">
                        <Scale className="size-3" />
                        <span>{new Date(c.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => setSelectedCase(c)}
                    variant="outline"
                    className="border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action hover:text-action h-10 px-6 font-mono text-[10px] font-bold uppercase tracking-widest"
                  >
                    Review Case <ChevronRight className="size-3 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}      <AnimatePresence>
        {selectedCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-titanium-950/90 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-titanium-800 bg-titanium-950 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] scrollbar-hide"
            >
              {/* Header Banner */}
              <div className="relative h-24 md:h-32 bg-gradient-to-r from-action/20 via-titanium-900 to-titanium-950 border-b border-titanium-800">
                <div className="absolute -bottom-10 left-4 md:left-8 rounded-full border-4 border-titanium-950 bg-titanium-900 p-3 md:p-4 text-action shadow-2xl">
                  <FileText className="size-8 md:size-12" />
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className={`rounded-full border border-action/20 bg-action/5 px-2 md:px-3 py-0.5 md:py-1 font-mono text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-action backdrop-blur-sm`}>
                    {selectedCase.urgency} PRIORITY
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="absolute top-4 left-4 rounded-full p-2 text-titanium-400 hover:bg-titanium-800 hover:text-titanium-50 transition-colors md:hidden"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="p-4 md:p-8 pt-12 md:pt-14 space-y-6 md:space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-titanium-50 tracking-tight">
                      {selectedCase.subject}
                    </h2>
                    <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-action/80">
                      {selectedCase.matter_type.replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-[9px] uppercase tracking-widest h-6 text-blue-500 border-blue-500/20 bg-blue-500/5 px-3">
                      {selectedCase.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 border-y border-titanium-800/50 py-6 md:py-8">
                  {/* Client Section */}
                  <div className="space-y-4 md:space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="size-1 bg-action rounded-full" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Client Credentials</h4>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300">
                        <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800">
                          <UserIcon className="size-3.5 md:size-4 text-action/70" />
                        </div>
                        <span className="truncate font-medium">{selectedCase.user.full_name || "Anonymous Member"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs md:text-sm text-action font-mono">
                        <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800">
                          <Phone className="size-3.5 md:size-4" />
                        </div>
                        <span>{selectedCase.user.phone || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300">
                        <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800">
                          <Mail className="size-3.5 md:size-4 text-action/70" />
                        </div>
                        <span className="truncate">{selectedCase.user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Logistics Section */}
                  <div className="space-y-4 md:space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="size-1 bg-action rounded-full" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Engagement Metrics</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-sm border border-titanium-800 bg-titanium-900/30 p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Preferred Channel</span>
                        <span className="font-mono text-[10px] font-bold text-action uppercase">{selectedCase.preferred_contact}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-sm border border-titanium-800 bg-titanium-900/30 p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Filing Date</span>
                        <span className="font-mono text-[10px] font-bold text-titanium-300 uppercase">{new Date(selectedCase.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documentation Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="size-1 bg-action rounded-full" />
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Case Documentation</h4>
                  </div>
                  <div className="rounded-lg bg-titanium-900/50 border border-titanium-800 p-4 md:p-6">
                    <p className="text-[13px] md:text-sm leading-relaxed text-titanium-300 font-light whitespace-pre-wrap">
                      {selectedCase.description}
                    </p>
                  </div>
                </div>

                {selectedCase.opposing_party && (
                  <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-4 md:p-6 space-y-3">
                    <div className="flex items-center gap-2 text-red-500/80">
                      <Scale className="size-4" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Opposing Party Conflict Check</h4>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-titanium-50">{selectedCase.opposing_party}</div>
                      {selectedCase.opposing_party_location && (
                        <div className="font-mono text-[10px] uppercase text-titanium-500">{selectedCase.opposing_party_location}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resolution Metric Box (if resolved) */}
                {selectedCase.status === "resolved" && (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="size-4" />
                      </div>
                      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">Matter Finalized</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-emerald-500 uppercase">Case Resolved</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 z-10 border-t border-titanium-800 bg-titanium-950 p-4 md:p-6 flex flex-col sm:flex-row justify-end gap-3 backdrop-blur-md">
                <button
                  onClick={() => setSelectedCase(null)}
                  className="w-full sm:w-auto rounded-sm border border-titanium-700 px-8 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-300 hover:bg-titanium-800 transition-all"
                >
                  Close Archive
                </button>
                {selectedCase.status === "assigned" && (
                  <Button
                    onClick={() => handleResolveCase(selectedCase.id)}
                    disabled={!!resolvingId}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-8 font-bold uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    {resolvingId === selectedCase.id ? <Loader2 className="size-3 animate-spin mr-2" /> : <CheckCircle2 className="size-3 mr-2" />}
                    Resolve Matter
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
