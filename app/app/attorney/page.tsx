"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Shield,
  FileText,
  MapPin,
  User as UserIcon,
  Phone,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Scale,
  Mail,
  RefreshCw,
  ShieldCheck,
  X,
  MapPinIcon
} from "lucide-react";
import Link from "next/link";
import { LoadingScreen } from "@/components/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLoading } from "@/components/LoadingProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/Pagination";

interface CaseUser {
  full_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  emergency_contact_phone: string | null;
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
  metadata?: Record<string, any> | null;
}

interface DashboardStats {
  totalSosCount: number;
  totalPendingCount: number;
  totalAssignedCount: number;
}

const SOS_ITEMS_PER_PAGE = 5;

export default function AttorneyDashboard() {
  const { user } = useAuth();
  const [sosSessions, setSosSessions] = useState<SOSSession[]>([]);
  const [assignedSessions, setAssignedSessions] = useState<SOSSession[]>([]);
  const [pendingCases, setPendingCases] = useState<CivilIntake[]>([]);
  const [assignedCases, setAssignedCases] = useState<CivilIntake[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIntake, setSelectedIntake] = useState<CivilIntake | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [caseTab, setCaseTab] = useState("my-active");
  const [cityFilter, setCityFilter] = useState("all");
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [sosPage, setSosPage] = useState(1);
  const { startLoading, stopLoading } = useLoading();

  const fetchDashboard = async (silent = false) => {
    if (!silent) setLoading(true);
    const start = Date.now();
    try {
      const res = await fetch("/api/attorney/dashboard");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSosSessions(data.sosSessions || []);
      setAssignedSessions(data.assignedSessions || []);
      setPendingCases(data.pendingCases || []);
      setAssignedCases(data.assignedCases || []);
      setStats(data.stats);

      const elapsed = Date.now() - start;
      const minDelay = 1000;
      if (!silent && elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard");
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(null);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const allRelevantUsers = [
    ...sosSessions.map(s => s.user),
    ...assignedSessions.map(s => s.user),
    ...pendingCases.map(i => i.user),
    ...assignedCases.map(i => i.user)
  ];

  const uniqueCities = Array.from(new Set(allRelevantUsers.map(u => u.city).filter(Boolean))).sort() as string[];

  const filterByLocation = (u: CaseUser) => {
    return cityFilter === "all" || u.city === cityFilter;
  };

  const handleRefresh = (id: string) => {
    setRefreshing(id);
    fetchDashboard(true);
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const handleCallMember = (u: CaseUser, id: string) => {
    const numberToCopy = u.emergency_contact_phone || u.phone;
    if (!numberToCopy) return;

    navigator.clipboard.writeText(numberToCopy);
    if (numberToCopy === u.emergency_contact_phone) {
      setCopiedPhone("Copied Emergency Number")
    } else {
      setCopiedPhone("Copied Phone Number")
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);

    // Optional: Also trigger dialer if on mobile
    if (/Android|iPhone/i.test(navigator.userAgent)) {
      window.location.href = `tel:${numberToCopy}`;
    }
  };

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

      setPendingCases(prev => prev.filter(i => i.id !== selectedIntake.id));
      setAssignedCases(prev => [data.intake, ...prev]);

      setStats(prev => prev ? {
        ...prev,
        totalPendingCount: Math.max(0, prev.totalPendingCount - 1),
        totalAssignedCount: prev.totalAssignedCount + 1
      } : null);

      setSelectedIntake(null);
      setCaseTab("my-active");
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setAccepting(false);
      stopLoading();
    }
  };

  const handleResolveCase = async () => {
    if (!selectedIntake) return;
    setAccepting(true);
    startLoading("Resolving Matter...");
    try {
      const res = await fetch(`/api/cases/${selectedIntake.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve case");

      // Remove from active list on dashboard
      setAssignedCases(prev => prev.filter(i => i.id !== selectedIntake.id));
      setStats(prev => prev ? {
        ...prev,
        totalAssignedCount: Math.max(0, prev.totalAssignedCount - 1)
      } : null);

      setSelectedIntake(null);
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setAccepting(false);
      stopLoading();
    }
  };

  const handleResolveSos = async (id: string) => {
    setAccepting(true);
    startLoading("Finalizing SOS Session...");
    try {
      const res = await fetch(`/api/sos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to resolve SOS");

      setAssignedSessions(prev => prev.filter(s => s.id !== id));
      setStats(prev => prev ? {
        ...prev,
        totalAssignedCount: Math.max(0, prev.totalAssignedCount - 1)
      } : null);
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setAccepting(false);
      stopLoading();
    }
  };

  if (loading) {
    return <LoadingScreen message="Establishing Secure Uplink..." />;
  }

  if (error) {
    return (
      <Card className="border-destructive/20 bg-destructive/5 p-12 text-center max-w-2xl mx-auto">
        <AlertCircle className="mx-auto size-12 text-destructive opacity-50" />
        <h2 className="mt-6 font-display text-2xl font-bold text-titanium-50">Access Restricted</h2>
        <p className="mt-2 text-titanium-400 max-w-md mx-auto">{error}</p>
        <Button asChild variant="link" className="mt-8 font-mono text-[10px] uppercase tracking-widest text-action">
          <Link href="/app">Return to Base</Link>
        </Button>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12 pb-20"
    >
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between relative">
        <div className="relative">
          <div className="absolute -left-4 top-0 h-full w-1 bg-action/50 blur-[2px]" />
          <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.4em] text-action border-action/20 bg-action/5 mb-2">
            Counselor Console
          </Badge>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            Attorney <span className="text-titanium-500">Dashboard</span>
          </h1>
          <p className="mt-4 max-w-2xl text-titanium-400 leading-relaxed">
            Manage your assigned legal responses and active engagements. All records are privileged and confidential.
          </p>
        </div>
        <button
          onClick={() => handleRefresh("all")}
          className="group flex items-center gap-2 rounded-sm border border-titanium-800 bg-titanium-900/50 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500 transition-all hover:border-action/50 hover:text-action"
        >
          {refreshing === "all" ? (
            <Loader2 className="size-3 animate-spin text-action" />
          ) : (
            <RefreshCw className="size-3 transition-transform group-hover:rotate-180" />
          )}
          Refresh
        </button>
      </header>

      {/* Stats Grid */}
      <section className="grid gap-6 sm:grid-cols-2">
        <Card className="border-titanium-800 bg-titanium-900/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Shield className="size-5 text-action" />
              <span className="font-mono text-[10px] font-bold text-titanium-500 uppercase tracking-widest">Active SOS Assignments</span>
            </div>
            <div className="mt-4 font-display text-4xl font-bold">{assignedSessions.length}</div>
          </CardContent>
        </Card>
        <Card className="border-titanium-800 bg-titanium-900/40 text-action shadow-[0_0_20px_rgba(var(--action-rgb),0.1)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Scale className="size-5 text-action" />
              <span className="font-mono text-[10px] font-bold text-action/50 uppercase tracking-widest">Active Civil Matters</span>
            </div>
            <div className="mt-4 font-display text-4xl font-bold">{assignedCases.length}</div>
          </CardContent>
        </Card>
      </section>

      {/* Active Engagement Section */}
      {assignedSessions.length > 0 && (
        <section className="space-y-6 w-full">
          <div className="flex items-center gap-3 border-b border-titanium-800 pb-2">
            <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-500">Active SOS ({assignedSessions.length})</h2>
          </div>
          <div className="grid gap-4">
            {assignedSessions
              .slice((sosPage - 1) * SOS_ITEMS_PER_PAGE, sosPage * SOS_ITEMS_PER_PAGE)
              .map((s) => (
                <Card key={s.id} className="w-full border-emerald-500/30 bg-emerald-500/5 transition-all hover:border-emerald-500/50 overflow-hidden">
                  <CardContent className="p-3 sm:p-5 md:p-6">
                    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between min-w-0">
                      <div className="space-y-4 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                          <Badge className="bg-emerald-500 text-white font-mono text-[8px] md:text-[9px] uppercase tracking-widest px-2 py-0.5 shrink-0">
                            In Progress
                          </Badge>
                          <span className="font-mono text-[9px] md:text-[10px] text-titanium-400 uppercase tracking-widest truncate">{s.encounter_type.replace("_", " ")}</span>
                        </div>
                        <div className="space-y-1.5 min-w-0">
                          <h3 className="font-display text-xl md:text-2xl font-bold text-titanium-50 truncate leading-tight">{s.user.full_name}</h3>
                          <div className="text-[11px] md:text-sm text-titanium-400 flex flex-wrap items-center gap-x-2 gap-y-1.5 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0 max-w-full">
                              <MapPinIcon className="size-3.5 md:size-4 text-action shrink-0" />
                              <span className="truncate">{s.location_address || "Location Tracking Active"}</span>
                            </div>
                            <span className="hidden md:inline text-titanium-700 shrink-0">·</span>
                            <span className="font-mono text-[8px] md:text-[10px] text-action uppercase tracking-widest bg-action/5 px-2 py-0.5 rounded-sm border border-action/10 shrink-0">
                              {s.user.city || "N/A"}, {s.user.country || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 shrink-0">
                        <Button
                          variant="outline"
                          onClick={() => handleCallMember(s.user, s.id)}
                          className="w-full md:w-auto border-titanium-700 bg-titanium-900 h-11 md:h-12 px-5 font-mono text-[10px] uppercase tracking-widest transition-colors hover:bg-titanium-800"
                        >
                          {copiedId === s.id ? (
                            <span className="flex items-center gap-2 text-emerald-500">
                              <CheckCircle2 className="size-3.5" />
                              {copiedPhone}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Phone className="size-3.5" />
                              Call Member
                            </span>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleResolveSos(s.id)}
                          disabled={accepting}
                          className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white h-11 md:h-12 px-6 font-bold uppercase tracking-widest text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                        >
                          {accepting ? <Loader2 className="size-3 animate-spin mr-2" /> : <CheckCircle2 className="size-3.5 mr-2" />}
                          <span className="whitespace-nowrap">Resolve Session</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>

          {assignedSessions.length > SOS_ITEMS_PER_PAGE && (
            <div className="pt-4">
              <Pagination
                currentPage={sosPage}
                totalPages={Math.ceil(assignedSessions.length / SOS_ITEMS_PER_PAGE)}
                onPageChange={setSosPage}
                totalItems={assignedSessions.length}
                itemsPerPage={SOS_ITEMS_PER_PAGE}
              />
            </div>
          )}
        </section>
      )}


      {/* Case Management */}
      <Tabs value={caseTab} onValueChange={setCaseTab} className="space-y-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-titanium-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-2xl font-bold">Civil Matters</h2>
              <button onClick={() => handleRefresh("civil")} className="p-1 text-titanium-600 hover:text-action transition-colors">
                <RefreshCw className={`size-3.5 ${refreshing === "civil" ? "animate-spin text-action" : ""}`} />
              </button>
            </div>
            <p className="mt-1 text-sm text-titanium-500">Showing 10 most recent intakes.</p>
          </div>
          <TabsList className="bg-titanium-900/50 border border-titanium-800">
            <TabsTrigger value="my-active" className="data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-widest px-6">
              My Cases ({assignedCases.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-auto sm:min-w-[240px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest h-10">
              <SelectValue placeholder="City Filter" />
            </SelectTrigger>
            <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
              <SelectItem value="all">All Available Cities</SelectItem>
              {uniqueCities.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

        </div>


        <TabsContent value="my-active" className="grid gap-4 focus-visible:ring-0">
          {assignedCases.filter(i => filterByLocation(i.user)).length === 0 ? (
            <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
              You have no active cases matching location filters
            </div>
          ) : (
            <>
              {assignedCases.filter(i => filterByLocation(i.user)).map((i) => (
                <CaseCard key={i.id} i={i} onReview={() => setSelectedIntake(i)} />
              ))}
            </>
          )}
          <div className="mt-4 text-center">
            <Button asChild variant="link" className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-action">
              <Link href="/app/attorney/cases">View All<ChevronRight className="size-3 ml-1" /></Link>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer Branding */}
      <div className="rounded-lg border border-titanium-800 bg-titanium-950/50 p-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-titanium-500">
          Justice Shield Attorney Network · <span className="text-action">Privileged & Confidential</span>
        </p>
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
                  className="w-full sm:w-auto border-titanium-700 bg-transparent text-titanium-300 hover:bg-titanium-800 h-11 px-8 font-mono text-[10px] uppercase tracking-widest"
                >
                  Close File
                </Button>
                {selectedIntake.status === "assigned" && (
                  <Button
                    onClick={handleResolveCase}
                    disabled={accepting}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-8 font-bold uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  >
                    {accepting ? <Loader2 className="size-3 animate-spin mr-2" /> : <CheckCircle2 className="size-3 mr-2" />}
                    Resolve Matter
                  </Button>
                )}
                {selectedIntake.status === "pending" && (
                  <Button
                    onClick={handleAcceptCase}
                    disabled={accepting}
                    className="w-full sm:w-auto bg-action hover:bg-action/90 text-action-foreground h-11 px-8 font-bold uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(var(--action-rgb),0.3)]"
                  >
                    {accepting ? <Loader2 className="size-3 animate-spin mr-2" /> : <Scale className="size-3 mr-2" />}
                    Accept Engagement
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

function CaseCard({ i, onReview }: { i: CivilIntake; onReview: () => void }) {
  return (
    <Card className="group border-titanium-800 bg-titanium-900/30 hover:border-titanium-700 transition-all overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Badge variant={i.urgency === "CRITICAL" ? "destructive" : "outline"} className="font-mono text-[9px] uppercase tracking-widest h-5">
                {i.urgency} Priority
              </Badge>
              <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">{i.matter_type.replace("_", " ")}</span>
              <Badge variant="secondary" className={`font-mono text-[8px] uppercase tracking-tighter h-5 ${i.status === "pending" ? "text-amber-500 border-amber-500/20 bg-amber-500/5" : "text-blue-500 border-blue-500/20 bg-blue-500/5"
                }`}>
                {i.status}
              </Badge>
            </div>
            <h3 className="font-display text-lg font-bold text-titanium-50 group-hover:text-action transition-colors">{i.subject}</h3>
            <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-titanium-500">
              <div className="flex items-center gap-1.5">
                <UserIcon className="size-3 text-action" />
                <span>{i.user.full_name || i.user.email}</span>
              </div>
              <span className="text-titanium-800">•</span>
              <div className="flex items-center gap-1.5">
                <Scale className="size-3" />
                <span>{new Date(i.created_at).toLocaleDateString()}</span>
              </div>
              <span className="text-titanium-800">•</span>
              <span className="text-action/70">{i.user.city || "N/A"}, {i.user.country || "N/A"}</span>
            </div>
          </div>
          <Button
            onClick={onReview}
            variant="outline"
            className="border-titanium-700 bg-titanium-800 text-titanium-300 hover:border-action hover:text-action h-10 px-6 font-mono text-[10px] font-bold uppercase tracking-widest"
          >
            Review Case <ChevronRight className="size-3 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}