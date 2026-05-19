"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  Shield,
  FileText,
  Clock,
  MapPin,
  User as UserIcon,
  RefreshCw,
  Loader2,
  Search,
  Scale,
  History,
  Lock,
  ChevronRight,
  AlertTriangle,
  Video
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Pagination } from "@/components/Pagination";
import ChatInterface from "@/components/ChatInterface";
import ChatDashboard from "@/components/ChatDashboard";
import { MessageSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Session {
  id: string;
  encounter_type: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  attorney_name: string | null;
  assigned_attorney_id: string | null;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string | null;
  assigned_attorney?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  rejection_message?: string | null;
  recording_url?: string | null;
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
  assigned_attorney: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone?: string | null;
  } | null;
  opposing_party: string | null;
  opposing_party_location: string | null;
  metadata?: Record<string, any> | null;
  rejection_message?: string | null;
  recording_url?: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<string>("all");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [selectedIntake, setSelectedIntake] = useState<Intake | null>(null);
  const ITEMS_PER_PAGE = 10;

  const fetchHistory = async (silent = false) => {
    if (!silent) setLoading(true);
    if (silent) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSessions(data.sessions || []);
      setIntakes(data.intakes || []);
    } catch (err: any) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };


  const handleClose = () => {
    setSelectedIntake(null);
    const newUrl = new URLSearchParams(window.location.search);
    newUrl.delete("caseId");
    newUrl.delete("type");
    router.push(`/app/history?${newUrl.toString()}`);
  }

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  // Auto-open logic and fresh data fetch on deep-link
  useEffect(() => {
    const caseId = searchParams.get("caseId");
    const type = searchParams.get("type");

    if (caseId && type) {
      console.log(`[History] Deep-link detected for ${type}:${caseId}. Refreshing data...`);
      fetchHistory(true); // Silent refresh to get latest status/rejection
    }
  }, [searchParams.get("caseId"), searchParams.get("type")]);

  useEffect(() => {
    if (!loading && (sessions.length > 0 || intakes.length > 0)) {
      const caseId = searchParams.get("caseId");
      const type = searchParams.get("type");

      if (caseId && type) {
        if (type === "sos") {
          const session = sessions.find(s => s.id === caseId);
          if (session) {
            setTab("sos");
            setSelectedIntake({
              id: session.id,
              matter_type: session.encounter_type,
              urgency: "CRITICAL",
              subject: `SOS Engagement: ${session.encounter_type.replace("_", " ")}`,
              description: "Emergency tactical record.",
              preferred_contact: "Direct Link",
              status: session.status,
              created_at: session.started_at,
              assigned_attorney: session.assigned_attorney ? {
                id: session.assigned_attorney.id,
                full_name: session.assigned_attorney.full_name || session.attorney_name,
                email: session.assigned_attorney.email,
                phone: session.assigned_attorney.phone
              } : null,
              rejection_message: session.rejection_message,
              opposing_party: null,
              opposing_party_location: null,
              is_sos: true,
              recording_url: session.recording_url
            } as any);
          }
        } else if (type === "civil") {
          const intake = intakes.find(i => i.id === caseId);
          if (intake) {
            setTab("civil");
            setSelectedIntake(intake);
          }
        }
      }
    }
  }, [loading, sessions, intakes, searchParams]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, search, statusFilter, urgencyFilter]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIntake(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const filteredSessions = sessions.filter(s => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesSearch = s.encounter_type.toLowerCase().includes(search.toLowerCase()) ||
      s.encounter_type.toLowerCase().replace(/_/g, " ").includes(search.toLowerCase()) ||
      (s.attorney_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.location_address || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredIntakes = intakes.filter(i => {
    const matchesStatus = statusFilter === "all" || i.status === statusFilter;
    const matchesUrgency = urgencyFilter === "all" || i.urgency.toLowerCase() === urgencyFilter.toLowerCase();
    const matchesSearch = i.subject.toLowerCase().includes(search.toLowerCase()) ||
      i.matter_type.toLowerCase().includes(search.toLowerCase()) ||
      i.matter_type.toLowerCase().replace(/_/g, " ").includes(search.toLowerCase()) ||
      (i.opposing_party || "").toLowerCase().includes(search.toLowerCase()) ||
      (i.assigned_attorney?.full_name || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesUrgency && matchesSearch;
  });

  const filteredAll = [
    ...filteredSessions.map(s => ({ ...s, historyType: 'sos' as const, date: s.started_at })),
    ...filteredIntakes.map(i => ({ ...i, historyType: 'civil' as const, date: i.created_at }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalItems = tab === "all" ? filteredAll.length : (tab === "sos" ? filteredSessions.length : filteredIntakes.length);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

  const paginatedAll = filteredAll.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const paginatedIntakes = filteredIntakes.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return <LoadingScreen message="Decrypting Vault Records..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-8 md:space-y-12 pb-20"
    >
      <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative">
          <div className="absolute -left-4 top-0 h-full w-1 bg-action/50 blur-[2px]" />
          <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.4em] text-action border-action/20 bg-action/5 mb-2">
            Encrypted Vault
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Operational <span className="text-titanium-500">History</span>
          </h1>
          <p className="mt-4 text-titanium-400 max-w-md leading-relaxed text-sm md:text-base">
            All records are strictly confidential and sealed under <span className="text-action font-medium">attorney–client privilege</span>.
          </p>
        </div>
        <button
          onClick={() => fetchHistory(true)}
          className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-sm border border-titanium-800 bg-titanium-900/50 px-4 py-3 sm:py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500 transition-all hover:border-action/50 hover:text-action"
        >
          {refreshing ? (
            <Loader2 className="size-3 animate-spin text-action" />
          ) : (
            <RefreshCw className="size-3 transition-transform group-hover:rotate-180" />
          )}
          Refresh
        </button>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
              <SelectItem value="all">All Statuses</SelectItem>
              {tab === "sos" ? (
                <>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </>
              ) : (
                <>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>

          {tab === "civil" && (
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-full sm:w-[160px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="routine">Routine</SelectItem>
              </SelectContent>
            </Select>
          )}

          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
            <Input
              placeholder="Search history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-titanium-800 bg-titanium-900/50 pl-10 focus:border-action h-9 text-xs"
            />
          </div>

          {(statusFilter !== "all" || urgencyFilter !== "all" || search !== "") && (
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter("all");
                setUrgencyFilter("all");
                setSearch("");
              }}
              className="h-9 px-4 font-mono text-[9px] uppercase tracking-widest text-titanium-600 hover:text-titanium-400"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6 md:space-y-8">
        <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-full sm:w-auto bg-titanium-900/50 border border-titanium-800 p-1">
            <TabsTrigger value="all" className="flex-1 sm:flex-none data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-4 sm:px-8 py-3 transition-all whitespace-nowrap">
              All Records
            </TabsTrigger>
            <TabsTrigger value="sos" className="flex-1 sm:flex-none data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-4 sm:px-8 py-3 transition-all whitespace-nowrap">
              SOS
            </TabsTrigger>
            <TabsTrigger value="civil" className="flex-1 sm:flex-none data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-4 sm:px-8 py-3 transition-all whitespace-nowrap">
              Civil Intakes
            </TabsTrigger>
          </TabsList>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
        />

        <TabsContent value="all" className="focus-visible:ring-0">
          <AnimatePresence mode="wait">
            <motion.div
              key="all-content"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {filteredAll.length === 0 ? (
                <Card className="border-dashed border-titanium-800 bg-titanium-900/20">
                  <CardContent className="p-12 sm:p-16 text-center">
                    <div className="flex justify-center mb-6 opacity-20">
                      <History className="size-10 sm:size-12" />
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-600">No operational records found</div>
                    <p className="mt-3 text-sm text-titanium-500">Your engagement history is currently clear.</p>
                  </CardContent>
                </Card>
              ) : (
                paginatedAll.map((item: any) => {
                  if (item.historyType === 'sos') {
                    const s = item as Session;
                    return (
                      <Card key={s.id} className="border-titanium-800 bg-titanium-900/30 hover:border-titanium-700 transition-all group">
                        <CardContent className="p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                            <div className="shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-sm bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
                              <Shield className="size-5 sm:size-6" />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest border-red-500/20 bg-red-500/5 text-red-400 whitespace-nowrap">
                                  SOS · {s.encounter_type.replace("_", " ")}
                                </Badge>
                              </div>
                              <div className="font-display text-lg sm:text-xl font-bold text-titanium-50 group-hover:text-red-400 transition-colors break-words">
                                {new Date(s.started_at).toLocaleString()}
                              </div>
                              <div className="flex flex-col flex-wrap items-start gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-titanium-500 font-mono uppercase tracking-tighter">
                                {s.attorney_name && (
                                  <div className="flex items-center gap-1.5">
                                    <UserIcon className="size-3 text-action" />
                                    <span className="truncate">Attorney: {s.attorney_name}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="size-3" />
                                  <span>{s.location_address ? s.location_address : `${s.location_lat?.toFixed(4)}, ${s.location_lng?.toFixed(4)}`}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center gap-4 sm:items-end mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-titanium-800/50 sm:border-0">
                            <Badge className={`font-mono text-[9px] uppercase tracking-[0.2em] py-1 px-4 w-full sm:w-auto text-center justify-center h-9 items-center ${s.status === "pending" ? "bg-amber-500 text-black" :
                              s.status === "active" ? "bg-action text-action-foreground" :
                                "bg-titanium-800 text-titanium-300"
                              }`}>
                              {s.status}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedIntake({
                                  id: s.id,
                                  matter_type: s.encounter_type,
                                  urgency: "CRITICAL",
                                  subject: `SOS Engagement: ${s.encounter_type.replace("_", " ")}`,
                                  description: "Emergency tactical record.",
                                  preferred_contact: "Direct Link",
                                  status: s.status,
                                  created_at: s.started_at,
                                  assigned_attorney: s.assigned_attorney ? {
                                    id: s.assigned_attorney.id,
                                    full_name: s.assigned_attorney.full_name || s.attorney_name,
                                    email: s.assigned_attorney.email,
                                    phone: s.assigned_attorney.phone
                                  } : null,
                                  rejection_message: s.rejection_message,
                                  opposing_party: null,
                                  opposing_party_location: null,
                                  is_sos: true
                                } as any);
                              }}
                              className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action hover:text-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-all"
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  } else {
                    const i = item as Intake;
                    return (
                      <Card key={i.id} className="border-titanium-800 bg-titanium-900/30 hover:border-titanium-700 transition-all group">
                        <CardContent className="p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                            <div className="shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-sm bg-titanium-800 text-action ring-1 ring-titanium-700">
                              <FileText className="size-5 sm:size-6" />
                            </div>
                            <div className="space-y-1.5 sm:space-y-2 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest border-titanium-700 text-titanium-400 whitespace-nowrap">
                                  CIVIL · {i.matter_type.replace("_", " ")}
                                </Badge>
                              </div>
                              <div className="font-display text-lg sm:text-xl font-bold text-titanium-50 group-hover:text-action transition-colors break-words">
                                {i.subject}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-titanium-500 font-mono uppercase tracking-tighter">
                                <div className="flex items-center gap-1.5">
                                  <History className="size-3" />
                                  <span>{new Date(i.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle className={`size-3 ${i.urgency === "CRITICAL" ? "text-red-500" : "text-amber-500"}`} />
                                  <span>{i.urgency} PRIORITY</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-center gap-4 sm:items-end mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-titanium-800/50 sm:border-0">
                            <Badge className={`font-mono text-[9px] uppercase tracking-[0.2em] py-1 px-4 w-full sm:w-auto text-center justify-center h-9 items-center ${i.status === "pending" ? "bg-red-500 text-white" :
                              i.status === "active" ? "bg-action text-white"
                                : "bg-titanium-800 text-titanium-300"
                              }`}>
                              {i.status}
                            </Badge>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedIntake(i)}
                              className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action hover:text-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-all"
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                })
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="sos" className="focus-visible:ring-0">
          <AnimatePresence mode="wait">
            <motion.div
              key="sos-content"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {sessions.length === 0 ? (
                <Card className="border-dashed border-titanium-800 bg-titanium-900/20">
                  <CardContent className="p-12 sm:p-16 text-center">
                    <div className="flex justify-center mb-6 opacity-20">
                      <Lock className="size-10 sm:size-12" />
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-600">No emergency sessions on record</div>
                    <p className="mt-3 text-sm text-titanium-500">Your history with law enforcement is clear.</p>
                  </CardContent>
                </Card>
              ) : filteredSessions.length === 0 ? (
                <div className="p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest border border-dashed border-titanium-800 rounded-lg">
                  No matching SOS records found
                </div>
              ) : (
                paginatedSessions.map((s) => (
                  <Card key={s.id} className="border-titanium-800 bg-titanium-900/30 hover:border-titanium-700 transition-all group">
                    <CardContent className="p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                        <div className="shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-sm bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
                          <Shield className="size-5 sm:size-6" />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest border-red-500/20 bg-red-500/5 text-red-400 whitespace-nowrap">
                              SOS · {s.encounter_type.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="font-display text-lg sm:text-xl font-bold text-titanium-50 group-hover:text-red-400 transition-colors break-words">
                            {new Date(s.started_at).toLocaleString()}
                          </div>
                          <div className="flex flex-col flex-wrap items-start gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-titanium-500 font-mono uppercase tracking-tighter">
                            {s.attorney_name && (
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="size-3 text-action" />
                                <span className="truncate">Attorney: {s.attorney_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3" />
                              <span>{s.location_address ? s.location_address : `${s.location_lat?.toFixed(4)}, ${s.location_lng?.toFixed(4)}`}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:items-end mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-titanium-800/50 sm:border-0">
                        <Badge className={`font-mono text-[9px] uppercase tracking-[0.2em] py-1 px-4 w-full sm:w-auto text-center justify-center h-9 items-center ${s.status === "pending" ? "bg-amber-500 text-black" :
                          s.status === "active" ? "bg-action text-action-foreground" :
                            "bg-titanium-800 text-titanium-300"
                          }`}>
                          {s.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Convert session to intake-like object for details view
                            setSelectedIntake({
                              id: s.id,
                              matter_type: s.encounter_type,
                              urgency: "CRITICAL",
                              subject: `SOS Engagement: ${s.encounter_type.replace("_", " ")}`,
                              description: "Emergency tactical record.",
                              preferred_contact: "Direct Link",
                              status: s.status,
                              created_at: s.started_at,
                              assigned_attorney: s.assigned_attorney ? {
                                id: s.assigned_attorney.id,
                                full_name: s.assigned_attorney.full_name || s.attorney_name,
                                email: s.assigned_attorney.email,
                                phone: s.assigned_attorney.phone
                              } : null,
                              rejection_message: s.rejection_message,
                              opposing_party: null,
                              opposing_party_location: null,
                              is_sos: true
                            } as any);
                          }}
                          className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action hover:text-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-all"
                        >
                          View Details
                        </Button>
                        {(s.status === "active" || s.status === "resolved") && s.assigned_attorney_id && user?.role !== "ADMIN" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              router.push(`/app/messages?user=${s.assigned_attorney_id}&name=${encodeURIComponent(s.attorney_name || "Attorney")}?fromChat=true`);
                            }}
                            className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action hover:text-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-all"
                          >
                            Message Attorney
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="civil" className="focus-visible:ring-0">
          <AnimatePresence mode="wait">
            <motion.div
              key="civil-content"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {intakes.length === 0 ? (
                <Card className="border-dashed border-titanium-800 bg-titanium-900/20">
                  <CardContent className="p-12 sm:p-16 text-center">
                    <div className="flex justify-center mb-6 opacity-20">
                      <Lock className="size-10 sm:size-12" />
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-600">No civil intakes filed</div>
                    <p className="mt-3 text-sm text-titanium-500">You have no active or historical civil intakes.</p>
                  </CardContent>
                </Card>
              ) : filteredIntakes.length === 0 ? (
                <div className="p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest border border-dashed border-titanium-800 rounded-lg">
                  No matching intake records found
                </div>
              ) : (
                paginatedIntakes.map((i) => (
                  <Card key={i.id} className="border-titanium-800 bg-titanium-900/30 hover:border-titanium-700 transition-all group">
                    <CardContent className="p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                        <div className="shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-sm bg-titanium-800 text-action ring-1 ring-titanium-700">
                          <FileText className="size-5 sm:size-6" />
                        </div>
                        <div className="space-y-1.5 sm:space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest border-titanium-700 text-titanium-400 whitespace-nowrap">
                              CIVIL · {i.matter_type.replace("_", " ")}
                            </Badge>
                          </div>
                          <div className="font-display text-lg sm:text-xl font-bold text-titanium-50 group-hover:text-action transition-colors break-words">
                            {i.subject}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-titanium-500 font-mono uppercase tracking-tighter">
                            <div className="flex items-center gap-1.5">
                              <History className="size-3" />
                              <span>{new Date(i.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <AlertTriangle className={`size-3 ${i.urgency === "CRITICAL" ? "text-red-500" : "text-amber-500"}`} />
                              <span>{i.urgency} PRIORITY</span>
                            </div>
                            {i.assigned_attorney && (
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="size-3 text-action" />
                                <span className="text-action truncate">Counselor {i.assigned_attorney.full_name}</span>
                              </div>
                            )}
                            {i.opposing_party && (
                              <div className="flex items-start gap-1.5 w-full sm:w-auto mt-1 sm:mt-0">
                                <Scale className="size-3 text-red-400 shrink-0 mt-0.5" />
                                <span className="text-titanium-400 break-words whitespace-normal leading-tight">Opposing: {i.opposing_party} {i.opposing_party_location ? `(${i.opposing_party_location})` : ""}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:items-end mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-titanium-800/50 sm:border-0">
                        <Badge className={`font-mono text-[9px] uppercase tracking-[0.2em] py-1 px-4 w-full sm:w-auto text-center justify-center h-9 items-center ${i.status === "pending" ? "bg-red-500 text-white" :
                          i.status === "active" ? "bg-action text-white"
                            : "bg-titanium-800 text-titanium-300"
                          }`}>
                          {i.status}
                        </Badge>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedIntake(i)}
                          className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action hover:text-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-all"
                        >
                          View Details
                        </Button>
                        {(i.status === "active" || i.status === "resolved") && (
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/app/messages?user=${i.assigned_attorney?.id}&name=${encodeURIComponent(i.assigned_attorney?.full_name || "Attorney")}&role=ATTORNEY`)}
                            className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action hover:text-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-all"
                          >
                            Message Attorney
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      <footer className="pt-8 md:pt-12 text-center">
        <p className="font-mono text-[9px] sm:text-[10px] uppercase tracking-[0.4em] text-titanium-600 px-4">
          Justice Shield · Distributed Legal Protection System
        </p>
      </footer>

      <AnimatePresence>
        {selectedIntake && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-titanium-950/90 p-4 backdrop-blur-md"
            onClick={() => setSelectedIntake(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-titanium-800 bg-titanium-950 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] scrollbar-hide"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-24 md:h-32 bg-gradient-to-r from-action/20 via-titanium-900 to-titanium-950 border-b border-titanium-800">
                <div className="absolute -bottom-10 left-4 md:left-8 rounded-full border-4 border-titanium-950 bg-titanium-900 p-3 md:p-4 text-action shadow-2xl">
                  <Scale className="size-8 md:size-12" />
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className={`rounded-full border border-action/20 bg-action/5 px-2 md:px-3 py-0.5 md:py-1 font-mono text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-action backdrop-blur-sm`}>
                    {selectedIntake.urgency} PRIORITY
                  </div>
                </div>
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
                    <Badge variant="secondary" className={`font-mono text-[9px] uppercase tracking-widest h-6 px-3 ${selectedIntake.status === "pending" ? "text-amber-500 border-amber-500/20 bg-amber-500/5" :
                      selectedIntake.status === "rejected" ? "text-red-500 border-red-500/20 bg-red-500/5" :
                        "text-blue-500 border-blue-500/20 bg-blue-500/5"
                      }`}>
                      {selectedIntake.status}
                    </Badge>
                  </div>
                </div>

                {selectedIntake.status === "rejected" && selectedIntake.rejection_message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="rounded-lg border border-red-500/30 bg-red-500/5 p-4 md:p-6 space-y-3"
                  >
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="size-4" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Rejection Reason</h4>
                    </div>
                    <p className="text-[12px] md:text-sm text-red-200/90 italic leading-relaxed md:leading-loose font-medium break-words">
                      "{selectedIntake.rejection_message}"
                    </p>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 border-y border-titanium-800/50 py-6 md:py-8">
                  <div className="space-y-4 md:space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="size-1 bg-action rounded-full" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Legal Counsel</h4>
                    </div>
                    {selectedIntake.assigned_attorney ? (
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300">
                          <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800">
                            <UserIcon className="size-3.5 md:size-4 text-action/70" />
                          </div>
                          <span className="truncate font-medium">{selectedIntake.assigned_attorney.full_name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300">
                          <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800">
                            <FileText className="size-3.5 md:size-4 text-action/70" />
                          </div>
                          <span className="truncate">{selectedIntake.assigned_attorney.email || selectedIntake.assigned_attorney.phone || "No contact info available"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-titanium-500 italic">No attorney assigned yet</div>
                    )}
                  </div>

                  <div className="space-y-4 md:space-y-5">
                    <div className="flex items-center gap-2">
                      <div className="size-1 bg-action rounded-full" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Intake Details</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-sm border border-titanium-800 bg-titanium-900/30 p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Contact Method</span>
                        <span className="font-mono text-[10px] font-bold text-action uppercase">{selectedIntake.preferred_contact}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-sm border border-titanium-800 bg-titanium-900/30 p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Filed On</span>
                        <span className="font-mono text-[10px] font-bold text-titanium-300 uppercase">{new Date(selectedIntake.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="size-1 bg-action rounded-full" />
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Matter Description</h4>
                  </div>
                  <div className="rounded-lg bg-titanium-900/50 border border-titanium-800 p-4 md:p-6">
                    <p className="text-[13px] md:text-sm leading-relaxed text-titanium-300 font-light whitespace-pre-wrap">
                      {selectedIntake.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 z-10 border-t border-titanium-800 bg-titanium-950 p-4 md:p-6 flex flex-col sm:flex-row sm:flex-wrap justify-end gap-3 backdrop-blur-md">
                <Button
                  variant="outline"
                  onClick={() => handleClose()}
                  className="w-full sm:w-auto border-titanium-700 bg-transparent text-titanium-300 hover:bg-titanium-800 h-11 px-8 font-mono text-[10px] uppercase tracking-widest"
                >
                  Close Details
                </Button>

                {(selectedIntake?.status === "active" || selectedIntake?.status === "resolved") && selectedIntake.assigned_attorney?.id && user?.role !== "ADMIN" && (
                  <Button
                    onClick={() => router.push(`/app/messages?user=${selectedIntake.assigned_attorney?.id}&name=${encodeURIComponent(selectedIntake.assigned_attorney?.full_name || "Attorney")}&role=ATTORNEY`)}
                    className="w-full sm:w-auto bg-action hover:bg-action/90 text-white h-11 px-8 font-mono text-[10px] font-bold uppercase tracking-widest"
                  >
                    Message Attorney
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div >
  );
}
