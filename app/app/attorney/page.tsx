"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Shield,
  FileText,
  Clock,
  MapPin,
  User as UserIcon,
  Phone,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Scale,
  X,
  Mail
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface CaseUser {
  full_name: string | null;
  email: string;
  phone: string | null;
}

interface SOSSession {
  id: string;
  encounter_type: string;
  status: string;
  started_at: string;
  location_address: string | null;
  user: CaseUser;
}

interface CivilIntake {
  id: string;
  matter_type: string;
  urgency: string;
  subject: string;
  description: string;
  preferred_contact: string;
  status: string;
  created_at: string;
  user: CaseUser;
}

export default function AttorneyDashboard() {
  const { user } = useAuth();
  const [sosSessions, setSosSessions] = useState<SOSSession[]>([]);
  const [civilIntakes, setCivilIntakes] = useState<CivilIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<CivilIntake | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function fetchCases() {
      try {
        const res = await fetch("/api/attorney/cases");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setSosSessions(data.sosSessions || []);
        setCivilIntakes(data.civilIntakes || []);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchCases();
  }, []);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleConnect = (phone: string | null, id: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAcceptCase = async () => {
    if (!selectedIntake) return;
    setAccepting(true);
    try {
      const res = await fetch("/api/attorney/cases/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intakeId: selectedIntake.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept case");

      // Remove the accepted case from the local pending list
      setCivilIntakes(prev => prev.filter(i => i.id !== selectedIntake.id));
      setSelectedIntake(null);
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-action" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-titanium-500 animate-pulse">Establishing Secure Uplink...</span>
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
        <Link href="/app" className="mt-8 inline-block font-mono text-[10px] font-bold uppercase tracking-widest text-action hover:underline">
          Return to Base
        </Link>
      </div>
    );
  }

  const activeSOS = sosSessions.filter(s => s.status === "active");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12"
    >
      <header className="relative">
        <div className="absolute -left-4 top-0 h-full w-1 bg-action/50 blur-[2px]" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-action">Counselor Console</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Attorney <span className="text-titanium-500">Dashboard</span>
        </h1>
        <p className="mt-4 max-w-2xl text-titanium-400 leading-relaxed">
          Manage your active legal responses and pending intakes. Priority filters are applied based on incident severity.
        </p>
      </header>

      {/* Stats Grid */}
      <section className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-titanium-800 bg-titanium-900/40 p-6">
          <div className="flex items-center justify-between">
            <Shield className="size-5 text-action" />
            <span className="font-mono text-[10px] font-bold text-titanium-500 uppercase tracking-widest">Active SOS</span>
          </div>
          <div className="mt-4 font-display text-4xl font-bold">{activeSOS.length}</div>
        </div>
        <div className="rounded-lg border border-titanium-800 bg-titanium-900/40 p-6">
          <div className="flex items-center justify-between">
            <FileText className="size-5 text-titanium-400" />
            <span className="font-mono text-[10px] font-bold text-titanium-500 uppercase tracking-widest">Pending Civil</span>
          </div>
          <div className="mt-4 font-display text-4xl font-bold">{civilIntakes.filter(i => i.status === "pending").length}</div>
        </div>
        <div className="rounded-lg border border-titanium-800 bg-titanium-900/40 p-6 text-action shadow-[0_0_20px_rgba(var(--action-rgb),0.1)]">
          <div className="flex items-center justify-between">
            <Scale className="size-5 text-action" />
            <span className="font-mono text-[10px] font-bold text-action/50 uppercase tracking-widest">Total Managed</span>
          </div>
          <div className="mt-4 font-display text-4xl font-bold">{sosSessions.length + civilIntakes.length}</div>
        </div>
      </section>

      {/* Emergency Queue */}
      {activeSOS.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="size-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-red-500">Live SOS Queue</h2>
          </div>
          <div className="grid gap-4">
            {activeSOS.map((s) => (
              <div key={s.id} className="group relative overflow-hidden rounded-lg border border-red-500/30 bg-red-500/5 p-6 transition-all hover:border-red-500/50">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-red-400">SOS · {s.encounter_type.replace("_", " ")}</span>
                      <span className="text-titanium-600">•</span>
                      <span className="font-mono text-[10px] text-titanium-400 uppercase tracking-widest">Started {new Date(s.started_at).toLocaleTimeString()}</span>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-display text-xl font-bold text-titanium-50">{s.user.full_name || "Anonymous Member"}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-titanium-400">
                        <div className="flex items-center gap-2">
                          <Phone className="size-3.5 text-action" />
                          <span>{s.user.phone || "No phone listed"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-action" />
                          <span className="max-w-md truncate">{s.location_address || "Detecting GPS..."}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleConnect(s.user.phone, s.id)}
                    className={`flex items-center gap-2 rounded-sm px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest transition-all ${copiedId === s.id
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "bg-red-500 text-white hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20"
                      }`}
                  >
                    {copiedId === s.id ? (
                      <>Copied! <CheckCircle2 className="size-3.5" /></>
                    ) : (
                      <>Contact Now <ChevronRight className="size-3.5" /></>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Case Management */}
      <section className="space-y-8">
        <div className="flex items-end justify-between border-b border-titanium-800 pb-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Civil Matters</h2>
            <p className="mt-1 text-sm text-titanium-500">Scheduled intakes and document reviews.</p>
          </div>
        </div>

        <div className="grid gap-4">
          {civilIntakes.length === 0 ? (
            <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
              No pending civil intakes
            </div>
          ) : (
            civilIntakes.map((i) => (
              <div key={i.id} className="group rounded-lg border border-titanium-800 bg-titanium-900/30 p-6 transition-all hover:border-titanium-700 hover:bg-titanium-900/50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest border ${i.urgency === "CRITICAL" ? "text-red-400 border-red-400/20 bg-red-400/10" : "text-titanium-400 border-titanium-800"
                        }`}>
                        {i.urgency} Priority
                      </span>
                      <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">{i.matter_type.replace("_", " ")}</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-titanium-50">{i.subject}</h3>
                    <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="size-3" />
                        <span>{i.user.full_name || i.user.email}</span>
                      </div>
                      <span>•</span>
                      <span>{new Date(i.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedIntake(i)}
                    className="flex items-center gap-2 rounded-sm border border-titanium-700 bg-titanium-800 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-300 transition-colors hover:border-action hover:text-action">
                    Review Case <ChevronRight className="size-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Footer Branding */}
      <div className="rounded-lg border border-titanium-800 bg-titanium-950/50 p-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-titanium-500">
          Justice Shield Attorney Network · <span className="text-action">Privileged & Confidential</span>
        </p>
      </div>

      <AnimatePresence>
        {selectedIntake && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-titanium-950/80 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-lg border border-titanium-700 bg-titanium-900 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-titanium-800 bg-titanium-950/50 p-6">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest border ${selectedIntake.urgency === "CRITICAL" ? "text-red-400 border-red-400/20 bg-red-400/10" : "text-titanium-400 border-titanium-800"}`}>
                      {selectedIntake.urgency} Priority
                    </span>
                    <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">{selectedIntake.matter_type.replace("_", " ")}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-titanium-50 break-words">{selectedIntake.subject}</h2>
                </div>
                <button
                  onClick={() => setSelectedIntake(null)}
                  className="rounded-full p-2 text-titanium-400 hover:bg-titanium-800 hover:text-titanium-50"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-6 space-y-8">
                <div className="space-y-3">
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Client Information</h3>
                  <div className="rounded-lg border border-titanium-800 bg-titanium-950/30 p-4 grid gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <span className="block text-xs text-titanium-500">Name</span>
                      <div className="mt-1 flex items-center gap-2 text-sm text-titanium-200 min-w-0">
                        <UserIcon className="size-4 shrink-0 text-action" />
                        <span className="truncate">{selectedIntake.user.full_name || "Not provided"}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs text-titanium-500">Phone</span>
                      <div className="mt-1 flex items-center gap-2 text-sm text-titanium-200 min-w-0">
                        <Phone className="size-4 shrink-0 text-action" />
                        <span className="truncate">{selectedIntake.user.phone || "Not provided"}</span>
                      </div>
                    </div>
                    <div className="sm:col-span-2 min-w-0">
                      <span className="block text-xs text-titanium-500">Email</span>
                      <div className="mt-1 flex items-center gap-2 text-sm text-titanium-200 min-w-0">
                        <Mail className="size-4 shrink-0 text-action" />
                        <span className="truncate">{selectedIntake.user.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Case Description</h3>
                  <div className="w-full overflow-hidden rounded-lg border border-titanium-800 bg-titanium-950/30 p-4">
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-titanium-300">
                      {selectedIntake.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-titanium-500">
                  <span>Preferred Contact: <strong className="uppercase">{selectedIntake.preferred_contact}</strong></span>
                  <span>Submitted: {new Date(selectedIntake.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="border-t border-titanium-800 bg-titanium-950/50 p-6 flex justify-end gap-4">
                <button
                  onClick={() => setSelectedIntake(null)}
                  className="rounded-sm border border-titanium-700 px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-300 hover:bg-titanium-800 hover:text-titanium-50"
                >
                  Close
                </button>
                <button
                  onClick={handleAcceptCase}
                  disabled={accepting}
                  className="rounded-sm bg-action px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-action-foreground hover:bg-action/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {accepting && <Loader2 className="size-3 animate-spin" />}
                  {accepting ? "Accepting..." : "Accept Case"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
