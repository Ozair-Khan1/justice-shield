"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Scale, Phone, Mail, MapPin, User as UserIcon, AlertCircle, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

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
  user: CaseUser;
}

export default function AttorneyCasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const fetchCases = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/attorney/my-cases");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const combined = [
        ...(data.cases || []).map((c: any) => ({ ...c, type: 'civil' })),
        ...(data.sessions || []).map((s: any) => ({
          ...s,
          type: 'sos',
          matter_type: s.encounter_type,
          subject: `Emergency SOS: ${s.encounter_type.replace('_', ' ')}`,
          urgency: 'CRITICAL',
          description: `Active SOS engagement`,
          preferred_contact: 'PHONE',
          created_at: s.started_at
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCases(combined);
    } catch (err: any) {
      setError(err.message || "Failed to load your cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchCases();
  }, [user]);

  const handleResolveCase = async (id: string, type: "civil" | "sos" = "civil") => {
    setResolvingId(id);
    try {
      const endpoint = type === "sos" ? `/api/sos/${id}` : `/api/cases/${id}/status`;
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to resolve ${type}`);

      // Update local state
      setCases(prev => prev.map(c => c.id === id ? { ...c, status: "resolved" } : c));
      fetchCases()
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-action" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-titanium-500 animate-pulse">Decrypting Case Files...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-12 text-center">
        <AlertCircle className="mx-auto size-12 text-red-500 opacity-50" />
        <h2 className="mt-6 font-display text-2xl font-bold text-titanium-50">Access Restricted</h2>
        <p className="mt-2 text-titanium-400 max-w-md mx-auto">{error}</p>
        <Button onClick={() => fetchCases()} variant="link" className="mt-4 font-mono text-[10px] uppercase tracking-widest text-action">
          Retry Authentication
        </Button>
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

      {cases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
          No cases found
        </div>
      ) : (
        <div className="grid gap-6">
          {cases.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-lg border border-titanium-800 bg-titanium-900/40">
              <div className="border-b border-titanium-800 bg-titanium-950/50 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest border ${c.urgency === "CRITICAL" ? "text-red-400 border-red-400/20 bg-red-400/10" : "text-titanium-400 border-titanium-800"}`}>
                        {c.urgency} Priority
                      </span>
                      <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">{c.matter_type.replace("_", " ")}</span>
                      {c.status === "resolved" && (
                        <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                          Resolved
                        </span>
                      )}
                    </div>
                    <h3 className="font-display text-2xl font-bold text-titanium-50 break-words">{c.subject}</h3>
                    <p className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">
                      Filed on {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {c.status !== "resolved" && (
                      <Button
                        onClick={() => handleResolveCase(c.id, c.type)}
                        disabled={resolvingId === c.id}
                        className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white h-12 px-6 font-mono text-[10px] font-bold uppercase tracking-widest"
                      >
                        {resolvingId === c.id ? <Loader2 className="size-3 animate-spin mr-2" /> : <CheckCircle2 className="size-3.5 mr-2" />}
                        Resolve Case
                      </Button>
                    )}
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-action/10 text-action shrink-0">
                      <Scale className="size-6" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-6 lg:grid-cols-2">
                <div className="space-y-4 min-w-0">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Case Summary</h4>
                  <div className="w-full overflow-hidden rounded-sm border border-titanium-800 bg-titanium-950/30 p-4">
                    <p className="text-sm leading-relaxed text-titanium-300 whitespace-pre-wrap break-words">{c.description}</p>
                  </div>
                </div>

                <div className="space-y-4 min-w-0">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-action">Client Information</h4>
                  <div className="w-full overflow-hidden rounded-sm border border-action/20 bg-action/5 p-5">
                    <div className="mb-4">
                      <div className="font-display text-xl font-bold text-titanium-50 break-words">
                        {c.user.full_name || "Unnamed Client"}
                      </div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-titanium-500 truncate">
                        Preferred Contact: <span className="text-titanium-300">{c.preferred_contact}</span>
                      </div>
                    </div>

                    <div className="space-y-3 min-w-0">
                      {c.type === 'sos' && (
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-sm bg-titanium-900 text-red-500">
                            <MapPin className="size-4" />
                          </div>
                          <span className="font-mono text-sm text-titanium-200 truncate">{c.location_address || "GPS Active"}</span>
                        </div>
                      )}
                      {c.user.phone && (
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-sm bg-titanium-900 text-action">
                            <Phone className="size-4" />
                          </div>
                          <span className="font-mono text-sm text-titanium-200 truncate">{c.user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex shrink-0 h-8 w-8 items-center justify-center rounded-sm bg-titanium-900 text-action">
                          <Mail className="size-4" />
                        </div>
                        <span className="font-mono text-sm text-titanium-200 truncate">{c.user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
