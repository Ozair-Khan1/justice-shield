"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Shield,
  FileText,
  Clock,
  MapPin,
  User as UserIcon,
  AlertCircle,
  ChevronRight,
  Loader2,
  Search,
  Mail,
  Phone,
  X
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

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

export default function AttorneyHistoryPage() {
  const { user } = useAuth();
  const [sosSessions, setSosSessions] = useState<SOSSession[]>([]);
  const [civilIntakes, setCivilIntakes] = useState<CivilIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIntake, setSelectedIntake] = useState<CivilIntake | null>(null);
  const [accepting, setAccepting] = useState(false);

  async function fetchAllHistory() {
    try {
      const res = await fetch("/api/attorney/cases");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSosSessions(data.sosSessions || []);
      setCivilIntakes(data.civilIntakes || []);
    } catch (err: any) {
      setError(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllHistory();
  }, []);

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
      fetchAllHistory()
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setAccepting(false);
    }
  };

  const filteredSOS = sosSessions.filter(s =>
    s.user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.user.email.toLowerCase().includes(search.toLowerCase()) ||
    s.encounter_type.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCivil = civilIntakes.filter(i =>
    i.user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    i.user.email.toLowerCase().includes(search.toLowerCase()) ||
    i.subject.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-action" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-10"
    >
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-action">Legal Archives</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">All Records</h1>
        <p className="mt-4 text-titanium-400">Master logs of all member interactions and intakes across the network.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
        <input
          type="text"
          placeholder="Search by member name, email, or case type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-sm border border-titanium-800 bg-titanium-900/50 py-4 pl-12 pr-4 font-mono text-xs text-titanium-50 outline-none focus:border-action"
        />
      </div>

      <div className="space-y-12">
        {/* SOS History */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="size-4 text-action" />
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-titanium-300">Police Encounters</h2>
          </div>
          <div className="divide-y divide-titanium-800 rounded-lg border border-titanium-800 bg-titanium-900/40">
            {filteredSOS.length === 0 ? (
              <div className="p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">No matching SOS records</div>
            ) : (
              filteredSOS.map((s) => (
                <div key={s.id} className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest border ${s.status === "active" ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/10" : "text-titanium-400 border-titanium-800"
                        }`}>
                        {s.status}
                      </span>
                      <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">{s.encounter_type.replace("_", " ")}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-display font-bold text-titanium-50">{s.user.full_name || s.user.email}</div>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-titanium-500 uppercase">
                        <span>{new Date(s.started_at).toLocaleString()}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin className="size-3" /> {s.location_address || "No address"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Civil History */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <FileText className="size-4 text-titanium-400" />
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-titanium-300">Civil Intakes</h2>
          </div>
          <div className="divide-y divide-titanium-800 rounded-lg border border-titanium-800 bg-titanium-900/40">
            {filteredCivil.length === 0 ? (
              <div className="p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">No matching intake records</div>
            ) : (
              filteredCivil.map((i) => (
                <div key={i.id} className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest border border-titanium-800 text-titanium-400">
                        {i.status}
                      </span>
                      <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">{i.matter_type.replace("_", " ")}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="font-display font-bold text-titanium-50">{i.subject}</div>
                      <div className="flex items-center gap-4 text-[10px] font-mono text-titanium-500 uppercase">
                        <span>Member: {i.user.full_name || i.user.email}</span>
                        <span>•</span>
                        <span>Opened {new Date(i.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedIntake(i)} className="flex items-center gap-2 rounded-sm border border-titanium-700 bg-titanium-800 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-300 transition-colors hover:border-action hover:text-action">
                    Case Details <ChevronRight className="size-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
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
