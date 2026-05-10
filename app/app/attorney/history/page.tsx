"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {

  FileText,
  MapPin,
  User as UserIcon,
  AlertCircle,
  ChevronRight,
  Loader2,
  Search,
  Mail,
  Phone,
  X,
  Scale,
  RefreshCw,
  Clock,
  Shield,
  ShieldCheck
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useLoading } from "@/components/LoadingProvider";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

interface CaseUser {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
}

interface SOSSession {
  id: string;
  encounter_type: string;
  status: string;
  started_at: string;
  ended_at: string;
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
  opposing_party: string | null;
  opposing_party_location: string | null;
  metadata: any;
}

export default function AttorneyHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sosSessions, setSosSessions] = useState<SOSSession[]>([]);
  const [civilIntakes, setCivilIntakes] = useState<CivilIntake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIntake, setSelectedIntake] = useState<CivilIntake | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tab, setTab] = useState("sos");
  const [statusFilter, setStatusFilter] = useState("all");
  const ITEMS_PER_PAGE = 5;
  const { startLoading, stopLoading } = useLoading();

  async function fetchAllHistory() {
    try {
      const res = await fetch("/api/attorney/cases");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSosSessions(data.sosSessions || []);
      // Combine all intakes for the history view
      const allIntakes = [
        ...(data.pendingCases || []),
        ...(data.assignedCases || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setCivilIntakes(allIntakes);
    } catch (err: any) {
      setError(err.message || "Failed to load records");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllHistory();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, tab, statusFilter]);

  const handleAcceptCase = async () => {
    if (!selectedIntake) return;
    setAccepting(true);
    startLoading("Accepting Engagement...");
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
      stopLoading();
    }
  };

  const filteredSOS = sosSessions.filter(s => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesSearch = s.user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.user.email.toLowerCase().includes(search.toLowerCase()) ||
      s.encounter_type.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredCivil = civilIntakes.filter(i => {
    const matchesStatus = statusFilter === "all" || i.status === statusFilter;
    const matchesSearch = i.user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.user.email.toLowerCase().includes(search.toLowerCase()) ||
      i.subject.toLowerCase().includes(search.toLowerCase()) ||
      i.matter_type.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPagesCivil = Math.ceil(filteredCivil.length / ITEMS_PER_PAGE);
  const paginatedCivil = filteredCivil.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPagesSOS = Math.ceil(filteredSOS.length / ITEMS_PER_PAGE);
  const paginatedSOS = filteredSOS.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return <LoadingScreen message="Decrypting Archive Vault..." />;
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
            Counselor Archive
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Case <span className="text-titanium-500">History</span>
          </h1>
          <p className="mt-4 text-titanium-400 max-w-md leading-relaxed text-sm md:text-base">
            Master logs of all member interactions, SOS sessions, and civil intakes assigned to <span className="text-action font-medium">your jurisdiction</span>.
          </p>
        </div>
        <button
          onClick={() => fetchAllHistory()}
          className="group flex w-full sm:w-auto items-center justify-center gap-2 rounded-sm border border-titanium-800 bg-titanium-900/50 px-4 py-3 sm:py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500 transition-all hover:border-action/50 hover:text-action"
        >
          <RefreshCw className="size-3 transition-transform group-hover:rotate-180" />
          Refresh
        </button>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <div className="relative w-full sm:w-[300px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
            <Input
              placeholder="Search by member, email, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-titanium-800 bg-titanium-900/50 pl-10 focus:border-action h-9 text-xs"
            />
          </div>

          {(statusFilter !== "all" || search !== "") && (
            <Button
              variant="ghost"
              onClick={() => {
                setStatusFilter("all");
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
            <TabsTrigger value="sos" className="flex-1 sm:flex-none data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-4 sm:px-8 py-3 transition-all whitespace-nowrap">
              SOS History
            </TabsTrigger>
            <TabsTrigger value="civil" className="flex-1 sm:flex-none data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-4 sm:px-8 py-3 transition-all whitespace-nowrap">
              Civil Archive
            </TabsTrigger>
          </TabsList>
        </div>

        {
          tab === "sos" && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPagesSOS}
              onPageChange={(page) => setCurrentPage(page)}
              itemsPerPage={filteredSOS.length}
              totalItems={ITEMS_PER_PAGE}
            />
          )
        }

        <TabsContent value="sos" className="focus-visible:ring-0">
          <div className="space-y-4">
            {filteredSOS.length === 0 ? (
              <Card className="border-dashed border-titanium-800 bg-titanium-900/20">
                <CardContent className="p-16 text-center">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-600">No matching SOS records</div>
                </CardContent>
              </Card>
            ) : (
              paginatedSOS.map((s) => (
                <Card key={s.id} className="border-titanium-800 bg-titanium-900/30 hover:border-titanium-700 transition-all group">
                  <CardContent className="p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                      <div className="shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-sm bg-red-500/10 text-red-500 ring-1 ring-red-500/20">
                        <Shield className="size-5 sm:size-6" />
                      </div>
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest border-red-500/20 bg-red-500/5 text-red-400">
                            SOS · {s.encounter_type.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="font-display text-lg font-bold text-titanium-50 group-hover:text-red-400 transition-colors">
                          {s.user.full_name || s.user.email}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-titanium-500 font-mono uppercase">
                          {s.status === "resolved" ? <span className="flex items-center gap-1"><Clock className="size-3" /> {new Date(s.ended_at).toLocaleString()}</span> : <span className="flex items-center gap-1"><Clock className="size-3" /> {new Date(s.started_at).toLocaleString()}</span>}
                          <span className="flex items-center gap-1"><MapPin className="size-3" /> {s.location_address || "No address"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:items-end mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-titanium-800/50 sm:border-0">
                      <Badge className={`font-mono text-[9px] uppercase tracking-[0.2em] py-1 px-4 w-full sm:w-auto text-center justify-center h-9 ${s.status === "active" ? "bg-red-500 animate-pulse" : "bg-titanium-800 text-titanium-300"}`}>
                        {s.status}
                      </Badge>
                      <button
                        onClick={() => {
                          setSelectedIntake({
                            id: s.id,
                            matter_type: s.encounter_type,
                            urgency: "urgent",
                            subject: `Emergency SOS: ${s.encounter_type.replace("_", " ")}`,
                            description: (s as any).notes || "No tactical notes provided.",
                            preferred_contact: "phone",
                            status: s.status,
                            created_at: s.started_at,
                            user: s.user,
                            opposing_party: null,
                            opposing_party_location: null,
                            metadata: (s as any).metadata
                          });
                        }}
                        className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action hover:text-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-smn"
                      >
                        Details <ChevronRight className="size-3" />
                      </button>
                      {s.status === "active" && (
                        <Button
                          onClick={() => { router.push(`/app/messages?user=${s.user.id}&name=${encodeURIComponent(s.user.full_name || "")}&role=USER`) }}
                          className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-all"

                        >
                          Message Client
                        </Button>
                      )}
                      {s.status === "resolved" && (
                        <Button
                          onClick={() => { router.push(`/app/messages?user=${s.user.id}&name=${encodeURIComponent(s.user.full_name || "")}&role=USER`) }}
                          className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-alll"

                        >
                          Message Client
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="civil" className="focus-visible:ring-0">
          <div className="space-y-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPagesCivil}
              onPageChange={setCurrentPage}
              totalItems={filteredCivil.length}
              itemsPerPage={ITEMS_PER_PAGE}
            />
            <div className="space-y-4">
              {filteredCivil.length === 0 ? (
                <Card className="border-dashed border-titanium-800 bg-titanium-900/20">
                  <CardContent className="p-16 text-center">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-600">No matching intake records</div>
                  </CardContent>
                </Card>
              ) : (
                paginatedCivil.map((i) => (
                  <Card key={i.id} className="border-titanium-800 bg-titanium-900/30 hover:border-titanium-700 transition-all group">
                    <CardContent className="p-4 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                        <div className="shrink-0 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-sm bg-titanium-800 text-action ring-1 ring-titanium-700">
                          <FileText className="size-5 sm:size-6" />
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-[9px] uppercase tracking-widest border-titanium-700 text-titanium-400">
                              CIVIL · {i.matter_type.replace("_", " ")}
                            </Badge>
                            <span className={`text-[9px] font-mono uppercase tracking-widest ${i.urgency === "CRITICAL" ? "text-red-400" : "text-titanium-600"}`}>
                              {i.urgency}
                            </span>
                          </div>
                          <div className="font-display text-lg font-bold text-titanium-50 group-hover:text-action transition-colors">
                            {i.subject}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-titanium-500 font-mono uppercase">
                            <span>Member: {i.user.full_name || i.user.email}</span>
                            <span>Opened {new Date(i.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:items-end mt-4 sm:mt-0 pt-4 sm:pt-0 border-t border-titanium-800/50 sm:border-0">
                        <Badge className={`font-mono text-[9px] uppercase tracking-[0.2em] py-1 px-4 w-full sm:w-auto text-center justify-center h-9 ${i.status === "pending" ? "bg-amber-500 text-black" : i.status === "assigned" ? "bg-action text-white" : "bg-titanium-800 text-titanium-300"}`}>
                          {i.status}
                        </Badge>
                        <button onClick={() => setSelectedIntake(i)} className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action hover:text-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 rounded-sm">
                          Details <ChevronRight className="size-3" />
                        </button>
                        {i.status === "active" && (
                          <Button onClick={() => {
                            router.push(`/app/messages?user=${i.user.id}&name=${encodeURIComponent(i.user.full_name || "")}&role=USER&intakeId=${i.id}`);
                          }} className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-all">
                            Message Client
                          </Button>
                        )}
                        {i.status === "resolved" && (
                          <Button onClick={() => {
                            router.push(`/app/messages?user=${i.user.id}&name=${encodeURIComponent(i.user.full_name || "")}&role=USER&intakeId=${i.id}`);
                          }} className="w-full sm:w-auto border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action h-9 px-4 font-mono text-[9px] font-bold uppercase tracking-widest transition-all">
                            Message Client
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

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
                  <FileText className="size-8 md:size-12" />
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
                        <span className="truncate font-medium">{selectedIntake.user.full_name || "Anonymous Member"}</span>
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
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Archive Interface</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-sm border border-titanium-800 bg-titanium-900/30 p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Contact Channel</span>
                        <span className="font-mono text-[10px] font-bold text-action uppercase">{selectedIntake.preferred_contact}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-sm border border-titanium-800 bg-titanium-900/30 p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Filing Date</span>
                        <span className="font-mono text-[10px] font-bold text-titanium-300 uppercase">{new Date(selectedIntake.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Documentation Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="size-1 bg-action rounded-full" />
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Matter Documentation</h4>
                  </div>
                  <div className="rounded-lg bg-titanium-900/50 border border-titanium-800 p-4 md:p-6">
                    <p className="text-[13px] md:text-sm leading-relaxed text-titanium-300 font-light whitespace-pre-wrap">
                      {selectedIntake.description}
                    </p>
                  </div>
                </div>

                {selectedIntake.opposing_party && (
                  <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-4 md:p-6 space-y-3">
                    <div className="flex items-center gap-2 text-red-500/80">
                      <Scale className="size-4" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Opposing Party Conflict Check</h4>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-titanium-50">{selectedIntake.opposing_party}</div>
                      {selectedIntake.opposing_party_location && (
                        <div className="font-mono text-[10px] uppercase text-titanium-500">{selectedIntake.opposing_party_location}</div>
                      )}
                    </div>
                  </div>
                )}

                {selectedIntake.metadata && Object.keys(selectedIntake.metadata).length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-action/60">
                      <ShieldCheck className="size-4" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Historical Intake Data</h4>
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
                <button
                  onClick={() => setSelectedIntake(null)}
                  className="w-full sm:w-auto rounded-sm border border-titanium-700 px-8 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-300 hover:bg-titanium-800 transition-all"
                >
                  Close Archive
                </button>
                {selectedIntake.status === "pending" && (
                  <button
                    onClick={handleAcceptCase}
                    disabled={accepting}
                    className="w-full sm:w-auto rounded-sm bg-action px-8 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-action-foreground hover:bg-action/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(var(--action-rgb),0.3)]"
                  >
                    {accepting ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <ChevronRight className="size-3" />
                    )}
                    {accepting ? "Accepting..." : "Accept Case"}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
