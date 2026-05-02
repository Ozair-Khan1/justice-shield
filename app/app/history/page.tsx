"use client";

import { useEffect, useState } from "react";
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
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Session {
  id: string;
  encounter_type: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  attorney_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

interface Intake {
  id: string;
  matter_type: string;
  urgency: string;
  subject: string;
  status: string;
  created_at: string;
  assigned_attorney: {
    full_name: string | null;
  } | null;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<string>("sos");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-action" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-titanium-500 animate-pulse">Decrypting Vault Records...</span>
        </div>
      </div>
    );
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

      <Tabs value={tab} onValueChange={setTab} className="space-y-6 md:space-y-8">
        <div className="overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-full sm:w-auto bg-titanium-900/50 border border-titanium-800 p-1">
            <TabsTrigger value="sos" className="flex-1 sm:flex-none data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-4 sm:px-8 py-3 transition-all whitespace-nowrap">
              Police Encounters
            </TabsTrigger>
            <TabsTrigger value="civil" className="flex-1 sm:flex-none data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-4 sm:px-8 py-3 transition-all whitespace-nowrap">
              Civil Intakes
            </TabsTrigger>
          </TabsList>
        </div>

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
                    <p className="mt-3 text-sm text-titanium-500">Your interaction history with law enforcement is clear.</p>
                  </CardContent>
                </Card>
              ) : (
                sessions.map((s) => (
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
                            <span className="font-mono text-[9px] sm:text-[10px] text-titanium-600 truncate">ID: {s.id.slice(0, 8)}</span>
                          </div>
                          <div className="font-display text-lg sm:text-xl font-bold text-titanium-50 group-hover:text-red-400 transition-colors break-words">
                            {new Date(s.started_at).toLocaleString()}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] sm:text-xs text-titanium-500 font-mono uppercase tracking-tighter">
                            {s.attorney_name && (
                              <div className="flex items-center gap-1.5">
                                <UserIcon className="size-3 text-action" />
                                <span className="truncate">Attorney: {s.attorney_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <MapPin className="size-3" />
                              <span>GPS Sealed</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:flex-col sm:items-end mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-titanium-800/50 sm:border-0">
                        <Badge className={`font-mono text-[9px] uppercase tracking-[0.2em] py-1 px-4 w-full sm:w-auto text-center justify-center ${s.status === "active" ? "bg-red-500 text-white animate-pulse" : "bg-titanium-800 text-titanium-300"
                          }`}>
                          {s.status}
                        </Badge>
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
              ) : (
                intakes.map((i) => (
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
                            <span className="font-mono text-[9px] sm:text-[10px] text-titanium-600 truncate">ID: {i.id.slice(0, 8)}</span>
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
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:flex-col sm:items-end mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-titanium-800/50 sm:border-0">
                        <Badge className={`font-mono text-[9px] uppercase tracking-[0.2em] py-1 px-4 w-full sm:w-auto text-center justify-center ${i.status === "pending" ? "bg-amber-500 text-black" :
                          i.status === "assigned" ? "bg-action text-action-foreground" :
                            "bg-titanium-800 text-titanium-300"
                          }`}>
                          {i.status}
                        </Badge>
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
    </motion.div>
  );
}
