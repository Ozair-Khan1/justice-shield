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
  X,
  ShieldCheck,
  MapPin
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Pagination } from "@/components/Pagination";
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
import { LoadingScreen } from "@/components/LoadingScreen";

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
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
  };
  assigned_attorney: {
    full_name: string | null;
  } | null;
  opposing_party?: string | null;
  opposing_party_location?: string | null;
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, priorityFilter, typeFilter, cityFilter, countryFilter, search]);

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

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE);
  const paginatedCases = filteredCases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getSortedAttorneys = (matterType: string) => {
    return [...attorneys].sort((a, b) => {
      const aMatches = a.specialties?.toLowerCase().includes(matterType.toLowerCase()) ? 1 : 0;
      const bMatches = b.specialties?.toLowerCase().includes(matterType.toLowerCase()) ? 1 : 0;
      return bMatches - aMatches;
    });
  };

  if (loading) {
    return (
      <LoadingScreen message="Scanning incoming legal matters..." />
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
        <div className="flex flex-wrap items-center gap-2">
          <Select value={typeFilter} onValueChange={(val) => {
            setTypeFilter(val);
            if (val === "sos") {
              setFilter("all");
              setPriorityFilter("all");
            }
          }}>
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
              <SelectValue placeholder="Matter Type" />
            </SelectTrigger>
            <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sos">Emergency SOS</SelectItem>
              <SelectItem value="civil">Civil Intake</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
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
              <SelectTrigger className="w-full sm:w-auto sm:min-w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
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
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
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
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
              <SelectValue placeholder="City Filter" />
            </SelectTrigger>
            <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
              <SelectItem value="all">All Cities</SelectItem>
              {uniqueCities.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-full sm:flex-1 sm:max-w-[250px] sm:min-w-[150px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
            <Input
              placeholder="Search by subject or user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-titanium-800 bg-titanium-900/50 pl-10 focus:border-action h-9"
            />
          </div>
        </div>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredCases.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      <div className="grid gap-6">
        {paginatedCases.length === 0 ? (
          <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
            No matters found matching criteria
          </div>
        ) : (
          paginatedCases.map((c) => (
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
                          {c.user.phone && <span className="text-titanium-600 ml-1">({c.user.phone})</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Scale className="size-3.5 text-titanium-500" />
                          <span className="capitalize">{c.urgency} Priority</span>
                        </div>
                        <span className="text-titanium-700">|</span>
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-titanium-500" />
                          <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                            {c.type === 'sos' && (c as any).location_address ? (c as any).location_address : `${c.user.city || "No City"}, ${c.user.country || "No Country"}`}
                          </span>
                        </div>
                      </div>

                      {c.type === 'sos' && (c.user.emergency_contact_name || (c as any).emergency_contact_phone || c.user.emergency_contact_phone) && (
                        <div className="mt-3 flex flex-wrap items-center gap-3 p-2 rounded-sm bg-red-500/5 border border-red-500/10">
                          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-red-500/70">Emergency Contact:</span>
                          <div className="flex items-center gap-2 text-[10px] text-titanium-300">
                            <span className="font-bold">{c.user.emergency_contact_name || "N/A"}</span>
                            <span className="text-titanium-600">•</span>
                            <span className="font-mono text-red-400">{(c as any).emergency_contact_phone || c.user.emergency_contact_phone || "No Phone"}</span>
                          </div>
                        </div>
                      )}
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
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-titanium-800 p-2 rounded-sm bg-titanium-950/50">
                        <Select value={selectedAttorney} onValueChange={setSelectedAttorney}>
                          <SelectTrigger className="flex-1 min-w-0 bg-transparent text-[10px] sm:text-[11px] h-10 border-titanium-800 sm:border-none rounded-sm sm:rounded-none font-mono uppercase text-titanium-200">
                            <SelectValue placeholder="Select Counsel..." />
                          </SelectTrigger>
                          <SelectContent className="bg-titanium-950 border-titanium-800">
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
                                  <SelectItem key={a.id} value={a.id} className="font-mono text-[10px] uppercase">
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center gap-2">
                                        {isLocal && <span className="text-action text-[8px]">📍</span>}
                                        <span className="font-bold text-titanium-50">{a.full_name}</span>
                                      </div>
                                      <div className="text-[8px] text-titanium-500 truncate max-w-[200px]">
                                        {a.specialties || a.email} {a.city ? `(${a.city})` : ""}
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              });
                            })()}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAssign(c.id, c.type)}
                            disabled={!selectedAttorney || processing}
                            className="flex-1 sm:flex-none bg-red-500 hover:bg-red-600 text-white text-[11px] px-4 py-2 rounded-sm font-bold uppercase transition-colors"
                          >
                            {processing ? <Loader2 className="size-3 animate-spin" /> : "Set"}
                          </button>
                          <button
                            onClick={() => setAssigningId(null)}
                            className="p-2 text-titanium-500 hover:text-titanium-300 border border-titanium-800 sm:border-none rounded-sm"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
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
      <AnimatePresence>
        {selectedIntake && (
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
                  <Scale className="size-8 md:size-12" />
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className={`rounded-full border border-action/20 bg-action/5 px-2 md:px-3 py-0.5 md:py-1 font-mono text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-action backdrop-blur-sm`}>
                    {selectedIntake.urgency} PRIORITY
                  </div>
                </div>
                <button
                  onClick={() => setSelectedIntake(null)}
                  className="absolute top-4 left-4 rounded-full p-2 text-titanium-400 hover:bg-titanium-800 hover:text-titanium-50 transition-colors md:hidden"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="p-4 md:p-8 pt-12 md:pt-14 space-y-6 md:space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-titanium-50 tracking-tight">
                      {selectedIntake.subject}
                    </h2>
                    <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-action/80">
                      {selectedIntake.matter_type.replace("_", " ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`font-mono text-[9px] uppercase tracking-widest h-6 px-3 ${selectedIntake.status === "pending" ? "text-amber-500 border-amber-500/20 bg-amber-500/5" : "text-blue-500 border-blue-500/20 bg-blue-500/5"
                      }`}>
                      {selectedIntake.status}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 border-y border-titanium-800/50 py-6 md:py-8">
                  {/* Client Section */}
                  <div className="space-y-4 md:space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="size-1 bg-action rounded-full" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Member Credentials</h4>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300">
                        <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800">
                          <UserIcon className="size-3.5 md:size-4 text-action/70" />
                        </div>
                        <span className="truncate font-medium">{selectedIntake.user.full_name || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs md:text-sm text-action font-mono">
                        <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800">
                          <Phone className="size-3.5 md:size-4" />
                        </div>
                        <span>{selectedIntake.user.phone || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300">
                        <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800">
                          <Mail className="size-3.5 md:size-4 text-action/70" />
                        </div>
                        <span className="truncate">{selectedIntake.user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Logistics Section */}
                  <div className="space-y-4 md:space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="size-1 bg-action rounded-full" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Engagement Interface</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-sm border border-titanium-800 bg-titanium-900/30 p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Contact Method</span>
                        <span className="font-mono text-[10px] font-bold text-action uppercase">{selectedIntake.preferred_contact}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-sm border border-titanium-800 bg-titanium-900/30 p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Registered City</span>
                        <span className="font-mono text-[10px] font-bold text-titanium-300 uppercase">{selectedIntake.user.city || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opposing Party Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="size-1 bg-red-500 rounded-full" />
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Opposing Party</h4>
                  </div>
                  <div className="rounded-lg border border-red-500/10 bg-red-500/5 p-4 grid gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <span className="block text-xs text-red-500/60 font-mono uppercase tracking-tighter">Name / Entity</span>
                      <div className="mt-1 flex items-center gap-2 text-sm text-titanium-100">
                        <Scale className="size-4 shrink-0 text-red-400" />
                        <span className="truncate font-bold">{selectedIntake.opposing_party || "Not provided"}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs text-red-500/60 font-mono uppercase tracking-tighter">Location</span>
                      <div className="mt-1 flex items-center gap-2 text-sm text-titanium-100">
                        <MapPin className="size-4 shrink-0 text-red-400" />
                        <span className="truncate font-medium">{selectedIntake.opposing_party_location || "Not provided"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documentation Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="size-1 bg-action rounded-full" />
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Matter Briefing</h4>
                  </div>
                  <div className="rounded-lg bg-titanium-900/50 border border-titanium-800 p-4 md:p-6">
                    <p className="text-[13px] md:text-sm leading-relaxed text-titanium-300 font-light whitespace-pre-wrap">
                      {selectedIntake.description}
                    </p>
                  </div>
                </div>

                {selectedIntake.metadata && Object.keys(selectedIntake.metadata).length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-action/60">
                      <ShieldCheck className="size-4" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Tactical Intake Data</h4>
                    </div>
                    <div className="grid gap-2 rounded-lg border border-titanium-800 bg-titanium-950/30 p-4">
                      {Object.entries(selectedIntake.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm items-center py-2 border-b border-titanium-800 last:border-0">
                          <span className="text-titanium-500 capitalize text-[10px] font-mono">{key.replace(/_/g, " ")}:</span>
                          <span className="font-medium text-titanium-200 text-xs">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 z-10 border-t border-titanium-800 bg-titanium-950 p-4 md:p-6 flex flex-col sm:flex-row justify-end gap-3 backdrop-blur-md">
                <Button
                  variant="outline"
                  onClick={() => setSelectedIntake(null)}
                  className="border-titanium-700 bg-transparent text-titanium-300 hover:bg-titanium-800 h-11 px-8 font-mono text-[10px] uppercase tracking-widest"
                >
                  Close Briefing
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div >
  );
}
