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
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import { LoadingScreen } from "@/components/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface CaseUser {
  full_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  country: string | null;
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
  const [caseTab, setCaseTab] = useState("pending");
  const [cityFilter, setCityFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [refreshing, setRefreshing] = useState<string | null>(null);

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
  const uniqueCountries = Array.from(new Set(allRelevantUsers.map(u => u.country).filter(Boolean))).sort() as string[];

  const filterByLocation = (u: CaseUser) => {
    const matchesCity = cityFilter === "all" || u.city === cityFilter;
    const matchesCountry = countryFilter === "all" || u.country === countryFilter;
    return matchesCity && matchesCountry;
  };

  const handleRefresh = (id: string) => {
    setRefreshing(id);
    fetchDashboard(true);
  };

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
    }
  };

  const handleResolveCase = async () => {
    if (!selectedIntake) return;
    setAccepting(true);
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
    }
  };

  const handleResolveSos = async (id: string) => {
    setAccepting(true);
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
            Manage your active legal responses and pending intakes. Priority filters are applied based on incident severity.
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
      <section className="grid gap-6 sm:grid-cols-3">
        <Card className="border-titanium-800 bg-titanium-900/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Shield className="size-5 text-action" />
              <span className="font-mono text-[10px] font-bold text-titanium-500 uppercase tracking-widest">Active SOS</span>
            </div>
            <div className="mt-4 font-display text-4xl font-bold">{stats?.totalSosCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-titanium-800 bg-titanium-900/40">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <FileText className="size-5 text-titanium-400" />
              <span className="font-mono text-[10px] font-bold text-titanium-500 uppercase tracking-widest">Available Civil</span>
            </div>
            <div className="mt-4 font-display text-4xl font-bold">{stats?.totalPendingCount || 0}</div>
          </CardContent>
        </Card>
        <Card className="border-titanium-800 bg-titanium-900/40 text-action shadow-[0_0_20px_rgba(var(--action-rgb),0.1)]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Scale className="size-5 text-action" />
              <span className="font-mono text-[10px] font-bold text-action/50 uppercase tracking-widest">My Active Cases</span>
            </div>
            <div className="mt-4 font-display text-4xl font-bold">{stats?.totalAssignedCount || 0}</div>
          </CardContent>
        </Card>
      </section>

      {/* Active Engagement Section */}
      {assignedSessions.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-titanium-800 pb-2">
            <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-emerald-500">Active Engagement ({assignedSessions.length})</h2>
          </div>
          <div className="grid gap-4">
            {assignedSessions.map((s) => (
              <Card key={s.id} className="border-emerald-500/30 bg-emerald-500/5">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-500 text-white font-mono text-[9px] uppercase tracking-widest">
                          In Progress
                        </Badge>
                        <span className="font-mono text-[10px] text-titanium-400 uppercase tracking-widest">{s.encounter_type.replace("_", " ")}</span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-display text-2xl font-bold text-titanium-50">{s.user.full_name}</h3>
                        <p className="text-sm text-titanium-400">
                          {s.location_address || "Location Tracking Active"} · <span className="font-mono text-[10px] text-action">{s.user.city || "N/A"}, {s.user.country || "N/A"}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" asChild className="border-titanium-700 bg-titanium-900 h-12 px-6 font-mono text-[10px] uppercase tracking-widest">
                        <a href={`tel:${s.user.phone}`}>Call Member</a>
                      </Button>
                      <Button
                        onClick={() => handleResolveSos(s.id)}
                        disabled={accepting}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white h-12 px-8 font-bold uppercase tracking-widest text-[10px]"
                      >
                        {accepting ? <Loader2 className="size-3 animate-spin" /> : "Resolve Session"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Emergency Queue */}
      {sosSessions.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-titanium-800 pb-2">
            <div className="flex items-center gap-3">
              <div className="size-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-red-500">Live SOS Queue</h2>
            </div>
            <button onClick={() => handleRefresh("sos")} className="p-1 text-titanium-600 hover:text-red-500 transition-colors">
              <RefreshCw className={`size-3.5 ${refreshing === "sos" ? "animate-spin text-red-500" : ""}`} />
            </button>
          </div>
          <div className="grid gap-4">
            {sosSessions.filter(s => filterByLocation(s.user)).map((s) => (
              <Card key={s.id} className="group relative overflow-hidden border-red-500/30 bg-red-500/5 transition-all hover:border-red-500/50">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 font-mono text-[9px] uppercase tracking-widest">
                          SOS · {s.encounter_type.replace("_", " ")}
                        </Badge>
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
                          <span className="text-titanium-800">•</span>
                          <span className="font-mono text-[10px] text-action/70">{s.user.city || "No City"}, {s.user.country || "No Country"}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleConnect(s.user.phone, s.id)}
                      className={`font-mono text-[10px] uppercase tracking-widest font-bold h-12 px-8 ${copiedId === s.id
                        ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/20"
                        : "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"
                        }`}
                    >
                      {copiedId === s.id ? (
                        <>Copied! <CheckCircle2 className="size-3.5 ml-2" /></>
                      ) : (
                        <>Contact Now <ChevronRight className="size-3.5 ml-2" /></>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
            <TabsTrigger value="pending" className="data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-widest px-6">
              Available ({pendingCases.length})
            </TabsTrigger>
            <TabsTrigger value="my-active" className="data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-widest px-6">
              My Cases ({assignedCases.length + assignedSessions.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex flex-wrap items-center gap-3">
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

        <TabsContent value="pending" className="grid gap-4 focus-visible:ring-0">
          {pendingCases.filter(i => filterByLocation(i.user)).length === 0 ? (
            <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
              No pending civil intakes matching location filters
            </div>
          ) : (
            pendingCases.filter(i => filterByLocation(i.user)).map((i) => (
              <CaseCard key={i.id} i={i} onReview={() => setSelectedIntake(i)} />
            ))
          )}
          <div className="mt-4 text-center">
            <Button asChild variant="link" className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-action">
              <Link href="/app/attorney/history">View All <ChevronRight className="size-3 ml-1" /></Link>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="my-active" className="grid gap-4 focus-visible:ring-0">
          {assignedCases.filter(i => filterByLocation(i.user)).length === 0 && assignedSessions.filter(s => filterByLocation(s.user)).length === 0 ? (
            <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
              You have no active cases or SOS sessions matching location filters
            </div>
          ) : (
            <>
              {assignedSessions.filter(s => filterByLocation(s.user)).map((s) => (
                <Card key={s.id} className="group border-red-500/30 bg-red-500/5 hover:border-red-500 transition-all overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-red-500 text-white font-mono text-[9px] uppercase tracking-widest h-5">
                            SOS ENGAGEMENT
                          </Badge>
                          <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">{s.encounter_type.replace("_", " ")}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-titanium-50 group-hover:text-red-400 transition-colors">Emergency: {s.user.full_name || s.user.email}</h3>
                        <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                          <div className="flex items-center gap-1.5">
                            <Phone className="size-3 text-red-500" />
                            <span>{s.user.phone}</span>
                          </div>
                          <span className="text-titanium-800">•</span>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3" />
                            <span className="max-w-[150px] truncate">{s.location_address || "GPS Active"}</span>
                          </div>
                          <span className="text-titanium-800">•</span>
                          <span className="text-action/70">{s.user.city || "N/A"}, {s.user.country || "N/A"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button asChild variant="outline" className="border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-red-400 h-10 px-4 font-mono text-[10px] uppercase">
                          <a href={`tel:${s.user.phone}`}>Call</a>
                        </Button>
                        <Button
                          onClick={() => handleResolveSos(s.id)}
                          disabled={accepting}
                          className="bg-red-500 hover:bg-red-600 text-white h-10 px-4 font-bold uppercase text-[9px]"
                        >
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

      <Dialog open={!!selectedIntake} onOpenChange={(open) => !open && setSelectedIntake(null)}>
        {selectedIntake && (
          <DialogContent className="max-w-2xl bg-titanium-900 border-titanium-700 p-0 overflow-hidden">
            <DialogHeader className="bg-titanium-950/50 p-6 border-b border-titanium-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={selectedIntake.urgency === "CRITICAL" ? "destructive" : "outline"} className="font-mono text-[9px] uppercase tracking-widest">
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
                    <span className="block text-xs text-titanium-500 font-mono uppercase tracking-tighter">Registered Location</span>
                    <div className="mt-1 flex items-center gap-2 text-sm text-titanium-200">
                      <span className="truncate font-medium">{selectedIntake.user.city || "N/A"}, {selectedIntake.user.country || "N/A"}</span>
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

            <DialogFooter className="bg-titanium-950/50 p-6 border-t border-titanium-800 gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedIntake(null)}
                className="border-titanium-700 bg-transparent text-titanium-300 hover:bg-titanium-800 h-11 px-6"
              >
                Close
              </Button>
              {selectedIntake.status === "assigned" && (
                <Button
                  onClick={handleResolveCase}
                  disabled={accepting}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-6 font-bold"
                >
                  {accepting && <Loader2 className="size-3 animate-spin mr-2" />}
                  Resolve Case
                </Button>
              )}
              {selectedIntake.status === "pending" && (
                <Button
                  onClick={handleAcceptCase}
                  disabled={accepting}
                  className="bg-action hover:bg-action/90 text-action-foreground h-11 px-8 font-bold"
                >
                  {accepting && <Loader2 className="size-3 animate-spin mr-2" />}
                  Accept Case
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
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