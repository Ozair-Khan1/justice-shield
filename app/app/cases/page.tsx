"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Scale, Phone, Mail, MapPin, Building2, User as UserIcon, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

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
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          Active <span className="text-titanium-500">Cases</span>
        </h1>
        <p className="mt-4 max-w-2xl text-titanium-400 leading-relaxed">
          These civil intakes have been accepted by an attorney in the Justice Shield network. Reach out directly to your assigned counsel using the provided contact information.
        </p>
      </header>

      {cases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
          No active cases found
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
                    </div>
                    <h3 className="font-display text-2xl font-bold text-titanium-50">{c.subject}</h3>
                    <p className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">
                      Filed on {new Date(c.created_at).toLocaleDateString()}
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
                </div>

                <div className="space-y-4">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-action">Assigned Attorney</h4>
                  {c.attorney ? (
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
                    <div className="rounded-sm border border-titanium-800 bg-titanium-950/30 p-5 text-center">
                      <span className="font-mono text-xs text-titanium-500">Attorney details hidden or unavailable</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
