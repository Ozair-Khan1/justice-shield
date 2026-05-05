"use client";

import { useEffect, useState } from "react";
import { Shield, Users, FileText, AlertTriangle, Briefcase, Clock, MapPin, User as UserIcon, RefreshCw, Loader2, ChevronRight, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { LoadingScreen } from "@/components/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, Phone } from "lucide-react";

interface Stats {
  userCount: number;
  sessionCount: number;
  intakeCount: number;
  alertCount: number;
  vendorCount: number;
  pendingVendors: number;
}

interface RecentUser {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  membership_tier: string;
  created_at: string;
}

interface RecentVendor {
  id: string;
  vendor_type: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
}

interface SOSSession {
  id: string;
  encounter_type: string;
  status: string;
  started_at: string;
  location_address: string | null;
  assigned_attorney_id: string | null;
  assigned_attorney: {
    full_name: string | null;
  } | null;
  user: {
    full_name: string | null;
    email: string;
  };
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
  assigned_attorney_id: string | null;
  assigned_attorney: {
    full_name: string | null;
  } | null;
  user: {
    full_name: string | null;
    email: string;
    phone: string | null;
  };
  metadata?: Record<string, any> | null;
}

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

interface EmergencyAlert {
  id: string;
  contact_name: string | null;
  contact_phone: string | null;
  message: string | null;
  sent_at: string;
  user: {
    full_name: string | null;
    email: string;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentVendors, setRecentVendors] = useState<RecentVendor[]>([]);
  const [sosSessions, setSosSessions] = useState<SOSSession[]>([]);
  const [civilIntakes, setCivilIntakes] = useState<CivilIntake[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [assigningType, setAssigningType] = useState<"civil" | "sos" | null>(null);
  const [selectedAttorney, setSelectedAttorney] = useState("");
  const [processing, setProcessing] = useState(false);
  const [selectedIntake, setSelectedIntake] = useState<CivilIntake | null>(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    const start = Date.now();
    try {
      const [res, attorneysRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/attorneys")
      ]);
      const data = await res.json();
      const attorneysData = await attorneysRes.json();

      setStats(data.stats);
      setRecentUsers(data.recentUsers ?? []);
      setRecentVendors(data.recentVendors ?? []);
      setSosSessions(data.sosSessions ?? []);
      setCivilIntakes(data.civilIntakes ?? []);
      setEmergencyAlerts(data.emergencyAlerts ?? []);
      setAttorneys(attorneysData.attorneys ?? []);

      const elapsed = Date.now() - start;
      const minDelay = 1000;
      if (!silent && elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
    } catch (error) {
      console.error("Fetch admin stats error:", error);
    } finally {
      if (!silent) setLoading(false);
      setRefreshing(null);
    }
  };

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

      fetchData(true);
      setAssigningId(null);
      setAssigningType(null);
      setSelectedAttorney("");
    } catch (err: any) {
      alert(err.message || "Assignment failed");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getSortedAttorneys = (matterType: string) => {
    return [...attorneys].sort((a, b) => {
      const aMatches = a.specialties?.toLowerCase().includes(matterType.toLowerCase()) ? 1 : 0;
      const bMatches = b.specialties?.toLowerCase().includes(matterType.toLowerCase()) ? 1 : 0;
      return bMatches - aMatches;
    });
  };

  const handleRefresh = (id: string) => {
    setRefreshing(id);
    fetchData(true);
  };

  if (loading) {
    return <LoadingScreen message="Accessing Central Command..." />;
  }

  const statCards = [
    { id: "users", label: "Total Users", value: stats?.userCount ?? 0, icon: Users, color: "text-blue-400", href: "/app/admin/users" },
    { id: "sos", label: "SOS Sessions", value: stats?.sessionCount ?? 0, icon: Shield, color: "text-red-400" },
    { id: "civil", label: "Civil Intakes", value: stats?.intakeCount ?? 0, icon: FileText, color: "text-amber-400" },
    { id: "alerts", label: "Emergency Alerts", value: stats?.alertCount ?? 0, icon: AlertTriangle, color: "text-orange-400" },
    { id: "vendors", label: "Vendor Apps", value: stats?.vendorCount ?? 0, icon: Briefcase, color: "text-emerald-400", href: "/app/admin/vendors" },
    { id: "pending", label: "Pending Vendors", value: stats?.pendingVendors ?? 0, icon: Clock, color: "text-purple-400", href: "/app/admin/vendors" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-10 pb-20"
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">
            Admin Panel
          </span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Platform Overview</h1>
          <p className="mt-2 text-sm text-titanium-400">
            Real-time statistics and recent activity across the platform.
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

      {/* Stat Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
      >
        {statCards.map((card) => {
          const isSelected = selectedView === card.id;
          const content = (
            <motion.div
              variants={itemVariants}
              onClick={() => !card.href && setSelectedView(isSelected ? null : card.id)}
              className={`rounded-sm border p-4 transition-all h-full cursor-pointer group ${isSelected
                ? "border-action bg-action/5 shadow-[0_0_20px_rgba(var(--action-rgb),0.1)]"
                : "border-titanium-800 bg-titanium-900/50 hover:border-titanium-700"}`}
            >
              <card.icon className={`size-5 transition-transform group-hover:scale-110 ${isSelected ? "text-action" : card.color}`} />
              <p className="mt-3 font-display text-2xl font-bold">{card.value}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                {card.label}
              </p>
            </motion.div>
          );

          if (card.href) {
            return (
              <Link key={card.label} href={card.href}>
                {content}
              </Link>
            );
          }

          return <div key={card.label}>{content}</div>;
        })}
      </motion.div>

      {/* Dynamic Detail View */}
      <AnimatePresence mode="wait">
        {selectedView === "sos" && (
          <motion.section
            key="sos-view"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-titanium-800 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-bold text-red-400">Recent SOS Sessions</h2>
                <button onClick={() => handleRefresh("sos")} className="p-1 text-titanium-600 hover:text-red-500 transition-colors">
                  <RefreshCw className={`size-3.5 ${refreshing === "sos" ? "animate-spin text-red-500" : ""}`} />
                </button>
              </div>
              <button onClick={() => setSelectedView(null)} className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-titanium-300">Close</button>
            </div>
            <div className="grid gap-4">
              {sosSessions.map((s) => (
                <div key={s.id} className="rounded-sm border border-titanium-800 bg-titanium-900/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-red-500">{s.encounter_type.replace("_", " ")}</span>
                      <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border ${s.status === "active" ? "border-red-500/30 text-red-400 bg-red-500/5" : "border-titanium-700 text-titanium-500"}`}>
                        {s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-titanium-200">
                      <UserIcon className="size-3.5 text-titanium-500" />
                      {s.user.full_name || s.user.email}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-titanium-400">
                      <MapPin className="size-3" />
                      {s.location_address || "No location info"}
                    </div>
                    <div className="font-mono text-[10px] text-titanium-600 uppercase tracking-widest">
                      {new Date(s.started_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[200px] items-end">
                    {s.assigned_attorney ? (
                      <div className="flex items-center gap-2 text-emerald-500 font-mono text-[10px] uppercase tracking-widest">
                        <Shield className="size-3" />
                        Assigned: {s.assigned_attorney.full_name}
                      </div>
                    ) : assigningId === s.id ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-titanium-800 p-2 rounded-sm bg-titanium-950/50">
                        <select
                          value={selectedAttorney}
                          onChange={(e) => setSelectedAttorney(e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-[10px] sm:text-[11px] p-2 outline-none text-titanium-200 font-mono uppercase border border-titanium-800 sm:border-none rounded-sm sm:rounded-none"
                        >
                          <option value="" className="bg-titanium-950">Select Counsel...</option>
                          {attorneys.map(a => (
                            <option key={a.id} value={a.id} className="bg-titanium-950">
                              {a.full_name} | {a.specialties}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAssign(s.id, "sos")}
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
                        onClick={() => { setAssigningId(s.id); setAssigningType("sos"); }}
                        className="w-full md:w-auto font-mono text-[10px] uppercase tracking-widest font-bold text-red-500 border border-red-500/30 px-4 py-2 flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all rounded-sm"
                      >
                        Assign Attorney <ChevronRight className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sosSessions.length === 0 && <p className="text-center py-8 text-titanium-600 font-mono text-[10px] uppercase tracking-widest">No SOS sessions recorded</p>}
            </div>
          </motion.section>
        )}

        {selectedView === "civil" && (
          <motion.section
            key="civil-view"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-titanium-800 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-bold text-amber-400">Recent Civil Intakes</h2>
                <button onClick={() => handleRefresh("civil")} className="p-1 text-titanium-600 hover:text-amber-500 transition-colors">
                  <RefreshCw className={`size-3.5 ${refreshing === "civil" ? "animate-spin text-amber-500" : ""}`} />
                </button>
              </div>
              <button onClick={() => setSelectedView(null)} className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-titanium-300">Close</button>
            </div>
            <div className="grid gap-4">
              {civilIntakes.map((i) => (
                <div key={i.id} className="rounded-sm border border-titanium-800 bg-titanium-900/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-titanium-700">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500">{i.matter_type.replace("_", " ")}</span>
                      <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-titanium-700 text-titanium-500`}>
                        {i.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-titanium-100">{i.subject}</h3>
                    <div className="flex items-center gap-2 text-xs text-titanium-400">
                      <UserIcon className="size-3.5 text-titanium-500" />
                      {i.user.full_name || i.user.email}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 items-start md:items-end">
                    <div className="font-mono text-[9px] text-titanium-600 uppercase tracking-[0.2em] bg-titanium-950/50 px-2 py-1 rounded-sm">
                      {new Date(i.created_at).toLocaleString()}
                    </div>
                    {i.assigned_attorney ? (
                      <div className="flex items-center gap-2 text-blue-400 font-mono text-[10px] uppercase tracking-widest">
                        <Briefcase className="size-3" />
                        Assigned: {i.assigned_attorney.full_name}
                      </div>
                    ) : assigningId === i.id ? (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border border-titanium-800 p-2 rounded-sm bg-titanium-950/50">
                        <select
                          value={selectedAttorney}
                          onChange={(e) => setSelectedAttorney(e.target.value)}
                          className="flex-1 min-w-0 bg-transparent text-[10px] sm:text-[11px] p-2 outline-none text-titanium-200 font-mono uppercase border border-titanium-800 sm:border-none rounded-sm sm:rounded-none"
                        >
                          <option value="" className="bg-titanium-950">Select Counsel...</option>
                          {attorneys.map(a => (
                            <option key={a.id} value={a.id} className="bg-titanium-950">
                              {a.full_name} | {a.specialties}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAssign(i.id, "civil")}
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
                        onClick={() => { setAssigningId(i.id); setAssigningType("civil"); }}
                        className="w-full md:w-auto font-mono text-[10px] uppercase tracking-widest font-bold text-action border border-action/30 px-4 py-2 flex items-center justify-center gap-2 hover:bg-action/10 transition-all rounded-sm"
                      >
                        Assign Attorney <ChevronRight className="size-3" />
                      </button>
                    )}
                    <div className="flex w-full md:w-auto items-center gap-2">
                      <button
                        onClick={() => setSelectedIntake(i)}
                        className="flex-1 md:flex-none font-mono text-[9px] uppercase tracking-widest text-titanium-500 hover:text-action border border-titanium-800/50 px-3 py-1.5 rounded-sm transition-colors text-center"
                      >
                        Review Details
                      </button>
                      <Link
                        href="/app/admin/cases"
                        className="flex-1 md:flex-none text-center font-mono text-[9px] uppercase tracking-widest text-titanium-500 hover:text-action border border-titanium-800/50 px-3 py-1.5 rounded-sm transition-colors"
                      >
                        Full Dispatch
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {civilIntakes.length === 0 && <p className="text-center py-8 text-titanium-600 font-mono text-[10px] uppercase tracking-widest">No civil intakes yet</p>}
            </div>
          </motion.section>
        )}

        {selectedView === "alerts" && (
          <motion.section
            key="alerts-view"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-titanium-800 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-xl font-bold text-orange-400">Emergency Alerts</h2>
                <button onClick={() => handleRefresh("alerts")} className="p-1 text-titanium-600 hover:text-orange-500 transition-colors">
                  <RefreshCw className={`size-3.5 ${refreshing === "alerts" ? "animate-spin text-orange-500" : ""}`} />
                </button>
              </div>
              <button onClick={() => setSelectedView(null)} className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 hover:text-titanium-300">Close</button>
            </div>
            <div className="grid gap-4">
              {emergencyAlerts.map((a) => (
                <div key={a.id} className="rounded-sm border border-orange-500/20 bg-orange-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-orange-500">Contact: {a.contact_name || "Primary"}</span>
                      <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-orange-500/20 text-orange-400 font-mono">
                        {a.contact_phone}
                      </span>
                    </div>
                    <p className="text-sm text-titanium-200 italic">"{a.message || "No message provided"}"</p>
                    <div className="flex items-center gap-2 text-sm text-titanium-400">
                      <UserIcon className="size-3.5 text-titanium-500" />
                      {a.user.full_name || a.user.email}
                    </div>
                  </div>
                  <div className="space-y-1 sm:text-right">
                    <div className="font-mono text-[10px] text-titanium-600 uppercase tracking-widest">
                      {new Date(a.sent_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
              {emergencyAlerts.length === 0 && <p className="text-center py-8 text-titanium-600 font-mono text-[10px] uppercase tracking-widest">No emergency alerts active</p>}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Recent Users Table */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-titanium-800 pb-2">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-titanium-400">
            Recent Users
          </h2>
          <button onClick={() => handleRefresh("recent-users")} className="p-1 text-titanium-600 hover:text-blue-400 transition-colors">
            <RefreshCw className={`size-3 ${refreshing === "recent-users" ? "animate-spin text-blue-400" : ""}`} />
          </button>
        </div>
        <div className="mt-4 overflow-x-auto rounded-sm border border-titanium-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-titanium-800 bg-titanium-900/60">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Name</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Email</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Role</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Tier</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-titanium-800/60">
              {recentUsers.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-titanium-900/40">
                  <td className="px-4 py-3 text-titanium-200">{u.full_name || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-titanium-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${u.role === "ADMIN"
                      ? "bg-red-500/15 text-red-400"
                      : u.role === "ATTORNEY"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-titanium-700/40 text-titanium-400"
                      }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs capitalize text-titanium-400">{u.membership_tier}</td>
                  <td className="px-4 py-3 font-mono text-xs text-titanium-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-titanium-500">No users yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Vendor Applications */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 border-b border-titanium-800 pb-2">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-widest text-titanium-400">
            Recent Vendor Applications
          </h2>
          <button onClick={() => handleRefresh("recent-vendors")} className="p-1 text-titanium-600 hover:text-emerald-500 transition-colors">
            <RefreshCw className={`size-3 ${refreshing === "recent-vendors" ? "animate-spin text-emerald-500" : ""}`} />
          </button>
        </div>
        <div className="mt-4 overflow-x-auto rounded-sm border border-titanium-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-titanium-800 bg-titanium-900/60">
              <tr>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Name</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Email</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Type</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Status</th>
                <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-titanium-800/60">
              {recentVendors.map((v) => (
                <tr key={v.id} className="transition-colors hover:bg-titanium-900/40">
                  <td className="px-4 py-3 text-titanium-200">{v.full_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-titanium-400">{v.email}</td>
                  <td className="px-4 py-3 font-mono text-[10px] uppercase text-titanium-400">
                    {v.vendor_type.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${v.status === "approved"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : v.status === "rejected"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-amber-500/15 text-amber-400"
                      }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-titanium-500">
                    {new Date(v.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {recentVendors.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-titanium-500">No applications yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <Dialog open={!!selectedIntake} onOpenChange={(open) => !open && setSelectedIntake(null)}>
        {selectedIntake && (
          <DialogContent className="max-w-2xl bg-titanium-900 border-titanium-700 p-0 overflow-hidden">
            <DialogHeader className="bg-titanium-950/50 p-6 border-b border-titanium-800">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={selectedIntake.urgency?.toLowerCase() === "critical" || selectedIntake.urgency?.toLowerCase() === "urgent" ? "destructive" : "outline"} className="font-mono text-[9px] uppercase tracking-widest">
                    {selectedIntake.urgency || "Standard"} Priority
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
        )}
      </Dialog>
    </motion.div >
  );
}
