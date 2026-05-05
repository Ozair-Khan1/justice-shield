"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Loader2,
  Filter,
  Search,
  Scale,
  Mail,
  Phone,
  X
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Attorney {
  id: string;
  full_name: string | null;
  email: string;
  firm_name: string | null;
  specialties: string | null;
  years_experience: number | null;
  city: string | null;
  country: string | null;
}

interface Intake {
  id: string;
  matter_type: string;
  urgency: string;
  subject: string;
  description: string;
  preferred_contact: string;
  status: string;
  created_at: string;
  user: {
    full_name: string | null;
    email: string;
    phone: string | null;
    city: string | null;
    country: string | null;
  };
  assigned_attorney: {
    full_name: string | null;
  } | null;
  metadata?: Record<string, any> | null;
}

export default function AdminCasesPage() {
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assigningType, setAssigningType] = useState<"civil" | "sos" | null>(null);
  const [selectedAttorney, setSelectedAttorney] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState<Intake | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [intakesRes, attorneysRes] = await Promise.all([
        fetch("/api/admin/cases"),
        fetch("/api/admin/attorneys")
      ]);

      const intakesData = await intakesRes.json();
      const attorneysData = await attorneysRes.json();

      if (intakesData.error) throw new Error(intakesData.error);
      if (attorneysData.error) throw new Error(attorneysData.error);

      setIntakes(intakesData.intakes || []);
      setSessions(intakesData.sessions || []);
      setAttorneys(attorneysData.attorneys || []);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (caseId: string, type: "civil" | "sos") => {
    if (!selectedAttorney) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/cases/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [type === "civil" ? "intakeId" : "sessionId"]: caseId,
          attorneyId: selectedAttorney
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      fetchData();
      setAssigningId(null);
      setAssigningType(null);
      setSelectedAttorney("");
    } catch (err: any) {
      alert(err.message || "Assignment failed");
    } finally {
      setProcessing(false);
    }
  };

  const combinedCases = [
    ...intakes.map(i => ({ ...i, type: 'civil' as const })),
    ...sessions.map(s => ({
      ...s,
      type: 'sos' as const,
      matter_type: s.encounter_type,
      subject: `Emergency SOS: ${s.encounter_type.replace('_', ' ')}`,
      urgency: 'urgent',
      created_at: s.started_at
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const uniqueCities = Array.from(new Set(combinedCases.map(c => c.user.city).filter(Boolean))).sort() as string[];
  const uniqueCountries = Array.from(new Set(combinedCases.map(c => c.user.country).filter(Boolean))).sort() as string[];

  const filteredCases = combinedCases.filter(c => {
    const matchesFilter = filter === "all" || c.status === filter;
    const matchesPriority = priorityFilter === "all" || c.urgency === priorityFilter;
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    const matchesCity = cityFilter === "all" || c.user.city === cityFilter;
    const matchesCountry = countryFilter === "all" || c.user.country === countryFilter;
    const matchesSearch =
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      (c.user.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.user.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.user.country || "").toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesPriority && matchesType && matchesCity && matchesCountry && matchesSearch;
  });

  const getSortedAttorneys = (matterType: string) => {
    return [...attorneys].sort((a, b) => {
      const aMatches = a.specialties?.toLowerCase().includes(matterType.toLowerCase()) ? 1 : 0;
      const bMatches = b.specialties?.toLowerCase().includes(matterType.toLowerCase()) ? 1 : 0;
      return bMatches - aMatches;
    });
  };

  if (loading && combinedCases.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-action" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-10"
    >
      <header>
        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.4em] text-action border-action/20 bg-action/5 mb-4">
          Operations Center
        </Badge>
        <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Case <span className="text-titanium-500">Dispatch</span>
        </h1>
        <p className="mt-4 max-w-2xl text-titanium-400">
          Manage and assign legal matters to the attorney network. Monitor status from intake to resolution.
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(val) => {
            setTypeFilter(val);
            if (val === "sos") {
              setFilter("all");
              setPriorityFilter("all");
            }
          }}>
            <SelectTrigger className="w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
              <SelectValue placeholder="Matter Type" />
            </SelectTrigger>
            <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sos">Emergency SOS</SelectItem>
              <SelectItem value="civil">Civil Intake</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
              <SelectItem value="all">All Matters</SelectItem>
              {typeFilter !== "civil" && <SelectItem value="active">Active</SelectItem>}
              {typeFilter !== "sos" && <SelectItem value="pending">Pending</SelectItem>}
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          {typeFilter !== "sos" && (
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
                <SelectValue placeholder="Priority Filter" />
              </SelectTrigger>
              <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
              <SelectValue placeholder="Country Filter" />
            </SelectTrigger>
            <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
              <SelectItem value="all">All Countries</SelectItem>
              {uniqueCountries.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
              <SelectValue placeholder="City Filter" />
            </SelectTrigger>
            <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
              <SelectItem value="all">All Cities</SelectItem>
              {uniqueCities.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
          <Input
            placeholder="Search by subject or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-titanium-800 bg-titanium-900/50 pl-10 focus:border-action h-10"
          />
        </div>
      </div>

      <div className="grid gap-6">
        {filteredCases.length === 0 ? (
          <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
            No matters found matching criteria
          </div>
        ) : (
          filteredCases.map((c) => (
            <Card key={c.id} className={`border-titanium-800 bg-titanium-900/30 hover:border-titanium-700 transition-all overflow-hidden group ${c.type === 'sos' ? 'ring-1 ring-red-500/20' : ''}`}>
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-3">
                      <Badge variant={c.status === "pending" || c.status === "active" ? "default" : "secondary"} className={`font-mono text-[9px] uppercase tracking-widest ${(c.status === "pending" || c.status === "active") ? "bg-amber-400/10 text-amber-400 border-amber-400/20" :
                        c.status === "assigned" ? "bg-blue-400/10 text-blue-400 border-blue-400/20" :
                          "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                        }`}>
                        {c.status}
                      </Badge>
                      <span className={`font-mono text-[10px] uppercase tracking-widest ${c.type === 'sos' ? 'text-red-400' : 'text-titanium-500'}`}>
                        {c.type === 'sos' ? 'SOS · ' : ''}{c.matter_type.replace("_", " ")}
                      </span>
                      <span className="text-titanium-700">•</span>
                      <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">
                        {c.type === 'sos' ? 'Triggered ' : 'Submitted '}{new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display text-xl font-bold text-titanium-50 group-hover:text-action transition-colors">{c.subject}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-titanium-400">
                        <div className="flex items-center gap-2">
                          <UserIcon className="size-3.5 text-action" />
                          <span>{c.user.full_name || c.user.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Scale className="size-3.5 text-titanium-500" />
                          <span className="capitalize">{c.urgency} Priority</span>
                        </div>
                        <span className="text-titanium-700">|</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                            {c.user.city || "No City"}, {c.user.country || "No Country"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {c.metadata && Object.keys(c.metadata).length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-sm border border-titanium-800/50 bg-titanium-950/30 px-3 py-2">
                        {Object.entries(c.metadata).map(([key, value]) => (
                          <div key={key} className="flex gap-2 font-mono text-[9px] uppercase tracking-wider">
                            <span className="text-titanium-600">{key.replace(/_/g, " ")}:</span>
                            <span className="text-titanium-300">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    {c.assigned_attorney ? (
                      <div className="flex items-center gap-3 rounded-sm border border-titanium-800 bg-titanium-950/50 px-4 py-2">
                        <div className="text-right">
                          <div className="font-mono text-[9px] uppercase tracking-widest text-titanium-500">Assigned Attorney</div>
                          <div className="text-sm font-bold text-titanium-200">{c.assigned_attorney.full_name}</div>
                        </div>
                        <CheckCircle2 className="size-5 text-emerald-500" />
                      </div>
                    ) : assigningId === c.id ? (
                      <div className="flex items-center gap-2 border border-titanium-800 p-1 rounded-sm">
                        <select
                          value={selectedAttorney}
                          onChange={(e) => setSelectedAttorney(e.target.value)}
                          className="bg-transparent text-[11px] p-1 outline-none text-titanium-200 font-mono uppercase"
                        >
                          <option value="" className="bg-titanium-950">Select Counsel...</option>
                          {(() => {
                            const currentCase = combinedCases.find(cc => cc.id === c.id);
                            const clientCity = currentCase?.user?.city;
                            const clientCountry = currentCase?.user?.country;

                            return [...attorneys].sort((a, b) => {
                              const aCityMatch = clientCity && a.city?.toLowerCase() === clientCity.toLowerCase() ? 2 : 0;
                              const aCountryMatch = clientCountry && a.country?.toLowerCase() === clientCountry.toLowerCase() ? 1 : 0;
                              const bCityMatch = clientCity && b.city?.toLowerCase() === clientCity.toLowerCase() ? 2 : 0;
                              const bCountryMatch = clientCountry && b.country?.toLowerCase() === clientCountry.toLowerCase() ? 1 : 0;
                              return (bCityMatch + bCountryMatch) - (aCityMatch + aCountryMatch);
                            }).map(a => {
                              const isLocal = (clientCity && a.city?.toLowerCase() === clientCity.toLowerCase()) ||
                                (clientCountry && a.country?.toLowerCase() === clientCountry.toLowerCase());
                              return (
                                <option key={a.id} value={a.id} className="bg-titanium-950">
                                  {isLocal ? "📍 " : ""}{a.full_name} - {a.specialties || a.email} {a.city ? `(${a.city})` : ""}
                                </option>
                              );
                            });
                          })()}
                        </select>
                        <button
                          onClick={() => handleAssign(c.id, c.type)}
                          disabled={!selectedAttorney || processing}
                          className="bg-red-500 text-white text-[11px] px-3 py-1 rounded-sm font-bold uppercase"
                        >
                          {processing ? <Loader2 className="size-3 animate-spin" /> : "Set"}
                        </button>
                        <button onClick={() => setAssigningId(null)} className="text-titanium-500 hover:text-titanium-300 px-1">
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAssigningId(c.id); setAssigningType(c.type); }}
                        className={`${c.type === 'sos' ? 'text-red-500 border-red-500/30 hover:bg-red-500/10' : 'text-action border-action/30 hover:bg-action/10'} font-mono text-[10px] uppercase tracking-widest font-bold border px-4 py-2 flex items-center gap-2 transition-all`}
                      >
                        Assign Attorney <ChevronRight className="size-3" />
                      </button>
                    )}
                    {c.type === 'civil' && (
                      <button
                        onClick={() => setSelectedIntake(c as Intake)}
                        className="font-mono text-[10px] uppercase tracking-widest font-bold text-titanium-400 border border-titanium-800 px-4 py-2 flex items-center gap-2 hover:bg-titanium-800/50 transition-all"
                      >
                        Review Case <ChevronRight className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      <Dialog open={!!selectedIntake} onOpenChange={(open) => !open && setSelectedIntake(null)}>
        {selectedIntake && (
          <DialogContent className="max-w-2xl bg-titanium-900 border-titanium-700 p-0 overflow-hidden">
            <DialogHeader className="bg-titanium-950/50 p-6 border-b border-titanium-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={selectedIntake.urgency.toLowerCase() === "critical" || selectedIntake.urgency.toLowerCase() === "urgent" ? "destructive" : "outline"} className="font-mono text-[9px] uppercase tracking-widest">
                    {selectedIntake.urgency} Priority
                  </Badge>
                  <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">{selectedIntake.matter_type.replace("_", " ")}</span>
                </div>
                <DialogTitle className="font-display text-2xl font-bold text-titanium-50 mt-2">{selectedIntake.subject}</DialogTitle>
              </div>
            </DialogHeader>

            <div className="max-h-[60vh] overflow-y-auto p-6 space-y-8">
              <div className="space-y-3">
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Client Information</h3>
                <div className="rounded-lg border border-titanium-800 bg-titanium-950/30 p-4 grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0">
                    <span className="block text-xs text-titanium-500 font-mono uppercase tracking-tighter">Name</span>
                    <div className="mt-1 flex items-center gap-2 text-sm text-titanium-200">
                      <UserIcon className="size-4 shrink-0 text-action" />
                      <span className="truncate font-medium">{selectedIntake.user.full_name || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs text-titanium-500 font-mono uppercase tracking-tighter">Phone</span>
                    <div className="mt-1 flex items-center gap-2 text-sm text-titanium-200">
                      <Phone className="size-4 shrink-0 text-action" />
                      <span className="truncate font-medium">{selectedIntake.user.phone || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2 min-w-0">
                    <span className="block text-xs text-titanium-500 font-mono uppercase tracking-tighter">Email</span>
                    <div className="mt-1 flex items-center gap-2 text-sm text-titanium-200">
                      <Mail className="size-4 shrink-0 text-action" />
                      <span className="truncate font-medium">{selectedIntake.user.email}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-2 min-w-0">
                    <span className="block text-xs text-titanium-500 font-mono uppercase tracking-tighter">Location</span>
                    <div className="mt-1 flex items-center gap-2 text-sm text-titanium-200">
                      <span className="truncate font-medium">
                        {selectedIntake.user.city || "N/A"}, {selectedIntake.user.country || "N/A"}
                      </span>
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

              {selectedIntake.metadata && Object.keys(selectedIntake.metadata).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Structured Data</h3>
                  <div className="grid gap-2 rounded-lg border border-titanium-800 bg-titanium-950/30 p-4">
                    {Object.entries(selectedIntake.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm items-center py-1 border-b border-titanium-800 last:border-0">
                        <span className="text-titanium-500 capitalize text-xs">{key.replace(/_/g, " ")}:</span>
                        <span className="font-medium text-titanium-200">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-titanium-800">
                <div className="text-xs text-titanium-500 font-mono">
                  Preferred: <span className="text-titanium-300 uppercase">{selectedIntake.preferred_contact}</span>
                </div>
                <div className="text-xs text-titanium-500 font-mono">
                  Submitted: <span className="text-titanium-300">{new Date(selectedIntake.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <DialogFooter className="bg-titanium-950/50 p-6 border-t border-titanium-800">
              <Button
                variant="outline"
                onClick={() => setSelectedIntake(null)}
                className="border-titanium-700 bg-transparent text-titanium-300 hover:bg-titanium-800 h-11 px-6"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )
        }
      </Dialog >
    </motion.div >
  );
}
