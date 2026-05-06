"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Scale, Phone, Mail, MapPin, Building2, User as UserIcon, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Pagination } from "@/components/Pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface AttorneyInfo {
  full_name: string | null;
  email: string;
  phone: string | null;
  firm_name: string | null;
}

interface Case {
  id: string;
  matter_type: string;
  urgency: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  attorney: AttorneyInfo | null;
}

export default function CasesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [tab, setTab] = useState("active");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function fetchCases() {
      if (!user) return;
      try {
        const res = await fetch("/api/cases");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setCases(data.cases || []);
      } catch (err: any) {
        setError(err.message || "Failed to load cases");
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, statusFilter]);

  const activeCases = cases.filter(c => c.status !== "draft");
  const filteredActiveCases = activeCases.filter(c => {
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  });

  const draftCases = cases.filter(c => c.status === "draft");
  const currentCases = tab === "active" ? filteredActiveCases : draftCases;

  const totalPages = Math.ceil(currentCases.length / ITEMS_PER_PAGE);
  const paginatedCases = currentCases.slice(
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
        <h2 className="mt-6 font-display text-2xl font-bold text-titanium-50">Decryption Failed</h2>
        <p className="mt-2 text-titanium-400 max-w-md mx-auto">{error}</p>
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
      <header className="relative">
        <div className="absolute -left-4 top-0 h-full w-1 bg-action/50 blur-[2px]" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-action">Legal Briefcase</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          {tab === "active" ? "Active" : "Draft"} <span className="text-titanium-500">Cases</span>
        </h1>
        <p className="mt-4 max-w-2xl text-titanium-400 leading-relaxed">
          {tab === "active"
            ? "These civil intakes have been accepted by an attorney in the Justice Shield network. Reach out directly to your assigned counsel."
            : "These intakes were started but not yet assigned to an attorney. You can complete them at any time."
          }
        </p>
      </header>

      <Tabs value={tab} onValueChange={setTab} className="space-y-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="bg-titanium-900/50 border border-titanium-800 p-1">
            <TabsTrigger value="active" className="data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-8 py-2.5 transition-all">
              Active Case
            </TabsTrigger>
            <TabsTrigger value="draft" className="data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-8 py-2.5 transition-all">
              Drafts
            </TabsTrigger>
          </TabsList>

          {tab === "active" && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-600">Filter:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest h-9">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
                  <SelectItem value="all">All Cases</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={currentCases.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />

        <TabsContent value={tab} className="focus-visible:ring-0">
          {currentCases.length === 0 ? (
            <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
              No {tab} cases found
            </div>
          ) : (
            <div className="grid gap-6">
              {paginatedCases.map((c) => (
                <div key={c.id} className="overflow-hidden rounded-lg border border-titanium-800 bg-titanium-900/40">
                  <div className="border-b border-titanium-800 bg-titanium-950/50 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest border ${c.urgency === "urgent" || c.urgency === "CRITICAL" ? "text-red-400 border-red-400/20 bg-red-400/10" : "text-titanium-400 border-titanium-800"}`}>
                            {c.urgency} Priority
                          </span>
                          {tab === "active" && (
                            <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest border ${c.status === "assigned" ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10" : "text-amber-400 border-amber-400/20 bg-amber-400/10"}`}>
                              {c.status === "assigned" ? "Active" : "Pending"}
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">{c.matter_type.replace("_", " ")}</span>
                        </div>
                        <h3 className="font-display text-2xl font-bold text-titanium-50">{c.subject}</h3>
                        <p className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">
                          {tab === "active" ? "Filed" : "Created"} on {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-action/10 text-action">
                        <Scale className="size-6" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 p-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Case Summary</h4>
                      <div className="rounded-sm border border-titanium-800 bg-titanium-950/30 p-4">
                        <p className="text-sm leading-relaxed text-titanium-300">{c.description}</p>
                      </div>
                      {tab === "draft" && (
                        <div className="flex flex-col gap-2">
                          <Button
                            className="w-full border border-action/50 bg-action/10 text-action font-mono text-[10px] uppercase tracking-widest hover:bg-action/20 transition-all"
                            onClick={() => router.push(`/app/civil?draft=${c.id}&step=2`)}
                          >
                            Assign Attorney →
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full text-titanium-500 font-mono text-[9px] uppercase tracking-widest"
                            onClick={() => router.push(`/app/civil?draft=${c.id}`)}
                          >
                            Edit Intake
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-action">
                        {tab === "active" ? "Assigned Attorney" : "Status"}
                      </h4>
                      {tab === "active" ? (
                        c.attorney ? (
                          <div className="rounded-sm border border-action/20 bg-action/5 p-5">
                            <div className="mb-4">
                              <div className="font-display text-xl font-bold text-titanium-50">
                                {c.attorney.full_name || "Attorney"}
                              </div>
                              {c.attorney.firm_name && (
                                <div className="mt-1 flex items-center gap-2 text-sm text-titanium-400">
                                  <Building2 className="size-4" />
                                  <span>{c.attorney.firm_name}</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-3">
                              {c.attorney.phone && (
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-titanium-900 text-action">
                                    <Phone className="size-4" />
                                  </div>
                                  <span className="font-mono text-sm text-titanium-200">{c.attorney.phone}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-titanium-900 text-action">
                                  <Mail className="size-4" />
                                </div>
                                <span className="font-mono text-sm text-titanium-200">{c.attorney.email}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-sm border border-amber-500/20 bg-amber-500/5 p-6 flex flex-col items-center justify-center text-center gap-4 h-full min-h-[180px]">
                            <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                              <Loader2 className="size-6 animate-spin" />
                            </div>
                            <div className="space-y-1">
                              <div className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-titanium-50">Awaiting Counsel</div>
                              <p className="text-[10px] text-titanium-500 leading-relaxed max-w-[200px] mx-auto uppercase tracking-wider">
                                Your intake is currently being reviewed by our attorney network.
                              </p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="rounded-sm border border-titanium-800 bg-titanium-950/30 p-5 flex items-center justify-center gap-3">
                          <div className="size-2 rounded-full bg-amber-500 animate-pulse" />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-400">Awaiting Finalization</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
