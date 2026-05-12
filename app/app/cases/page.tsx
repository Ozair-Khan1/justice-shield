"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Scale, Phone, Mail, MapPin, Building2, User as UserIcon, AlertCircle, Loader2, X, FileText, ChevronRight, ShieldCheck } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Pagination } from "@/components/Pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CaseDetailModal from "@/components/CaseDetailModal";

interface AttorneyInfo {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  firm_name: string | null;
  role?: string;
  specialties?: string | null;
}

interface Case {
  id: string;
  matter_type: string;
  urgency: string;
  subject: string;
  description: string;
  location_address: string;
  status: string;
  created_at: string;
  attorney: AttorneyInfo | null;
  opposing_party?: string | null;
  opposing_party_location?: string | null;
  rejection_message?: string | null;
  metadata?: Record<string, any> | null;
  case_type?: string;
}


export default function CasesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const socketRef = useRef<Socket | null>(null);
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3001";

  const [tab, setTab] = useState("active");
  const [statusFilter, setStatusFilter] = useState("all");

  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editOpposingParty, setEditOpposingParty] = useState("");
  const [editOpposingPartyLocation, setEditOpposingPartyLocation] = useState("");
  const [editMetadata, setEditMetadata] = useState<Record<string, any>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [viewingRejection, setViewingRejection] = useState<Case | null>(null);
  const [viewingCase, setViewingCase] = useState<Case | null>(null);

  const openEditModal = (c: Case) => {
    setEditingCase(c);
    setEditSubject(c.subject || "");
    setEditDescription(c.description || "");
    setEditOpposingParty(c.opposing_party || "");
    setEditOpposingPartyLocation(c.opposing_party_location || "");
    setEditMetadata(c.metadata || {});
  };

  const handleEditMetadataChange = (key: string, value: string) => {
    setEditMetadata(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveEdit = async () => {
    if (!editingCase) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/civil/intake/${editingCase.id}/edit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editSubject,
          description: editDescription,
          opposingParty: editOpposingParty,
          opposingPartyLocation: editOpposingPartyLocation,
          metadata: editMetadata,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Update local state
      setCases(cases.map(c => c.id === editingCase.id ? {
        ...c,
        subject: editSubject,
        description: editDescription,
        opposing_party: editOpposingParty,
        opposing_party_location: editOpposingPartyLocation,
        metadata: editMetadata,
      } : c));

      setEditingCase(null);
    } catch (err: any) {
      console.error("Failed to edit case:", err);
      // You could add toast notification here
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchCases = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/cases");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCases(data.cases || []);
    } catch (err: any) {
      setError(err.message || "Failed to load cases");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [user]);

  // Real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[UserCases] Socket connected:", socket.id);
      socket.emit("join-personal-room", user.id);
    });

    const handleRefresh = (data: any) => {
      console.log("[UserCases] Refreshing data due to socket event:", data.type);
      // Refresh if it's our case or we are part of it
      if (data.owner_id === user.id) {
        fetchCases(true);
      }
    };

    socket.on("new-civil-intake", handleRefresh);
    socket.on("sos-alert", handleRefresh);

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, statusFilter]);

  const activeCases = cases.filter(c => c.case_type === "civil" && ["pending", "assigned", "active"].includes(c.status));
  const filteredActiveCases = activeCases.filter(c => {
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  });

  const draftCases = cases.filter(c => c.case_type === "civil" && c.status === "draft");
  const rejectedCases = cases.filter(c => c.status === "rejected");
  const sosCases = cases.filter(c => c.case_type === "sos" && c.status !== "rejected");

  const filteredRejectedCases = rejectedCases.filter(c => {
    if (statusFilter === "all") return true;
    return c.case_type === statusFilter;
  });

  const currentCases = tab === "active" ? filteredActiveCases : tab === "draft" ? draftCases : tab === "sos" ? sosCases : filteredRejectedCases;


  const totalPages = Math.ceil(currentCases.length / ITEMS_PER_PAGE);
  const paginatedCases = currentCases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return <LoadingScreen message="Decrypting Case Files..." />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-12 text-center">
        <AlertCircle className="mx-auto size-12 text-red-500 opacity-50" />
        <h2 className="mt-6 font-display text-2xl font-bold text-titanium-50">Decryption Failed</h2>
        <p className="mt-2 text-titanium-400 max-w-md mx-auto">{error}</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-10"
      >
        <header className="relative">
          <div className="absolute -left-4 top-0 h-full w-1 bg-action/50 blur-[2px]" />
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-action">Legal Briefcase</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            {tab === "active" ? "Active" : tab === "draft" ? "Draft" : tab === "sos" ? "Emergency" : "Rejected"} <span className="text-titanium-500">{tab === "sos" ? "SOS" : "Cases"}</span>
          </h1>
          <p className="mt-4 max-w-2xl text-titanium-400 leading-relaxed">
            {tab === "active" && "These civil intakes have been accepted by an attorney in the Justice Shield network. Reach out directly to your assigned counsel."}
            {tab === "draft" && "These intakes were started but not yet assigned to an attorney. You can complete them at any time."}
            {tab === "sos" && "Real-time records of emergency encounters and tactical legal responses initiated via the SOS protocol."}
            {tab === "rejected" && "These cases were reviewed by an attorney but could not be accepted at this time. You can review the reason below."}
          </p>
        </header>

        <Tabs value={tab} onValueChange={setTab} className="space-y-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="bg-titanium-900/50 border border-titanium-800 p-1 w-full overflow-x-auto scrollbar-hide overflow-y-hidden justify-start sm:justify-center">
              <TabsTrigger value="active" onClick={() => setStatusFilter("all")} className="data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-6 sm:px-8 py-2.5 transition-all shrink-0">
                Active
              </TabsTrigger>
              <TabsTrigger value="sos" onClick={() => setStatusFilter("all")} className="data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-6 sm:px-8 py-2.5 transition-all shrink-0">
                SOS
              </TabsTrigger>
              <TabsTrigger value="draft" onClick={() => setStatusFilter("all")} className="data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-6 sm:px-8 py-2.5 transition-all shrink-0">
                Drafts
              </TabsTrigger>
              <TabsTrigger value="rejected" onClick={() => setStatusFilter("all")} className="data-[state=active]:bg-titanium-800 data-[state=active]:text-action font-mono text-[10px] uppercase tracking-[0.2em] px-6 sm:px-8 py-2.5 transition-all shrink-0">
                Rejected
              </TabsTrigger>
            </TabsList>

            {tab === "active" || tab === "sos" && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-600">Filter:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
                    <SelectItem value="all">All Cases</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {tab === "rejected" && (
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-600">Filter:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] border-titanium-800 bg-titanium-900/50 text-titanium-300 font-mono text-[10px] uppercase tracking-widest h-9">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
                    <SelectItem value="all">All Cases</SelectItem>
                    <SelectItem value="civil">Civil</SelectItem>
                    <SelectItem value="sos">SOS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={currentCases.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />

          <TabsContent value={tab} className="focus-visible:ring-0">
            {currentCases.length === 0 ? (
              <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
                No {tab} cases found
              </div>
            ) : (
              <div className="grid gap-6">
                {paginatedCases.map((c) => (
                  <Card key={c.id} className="border-titanium-800 bg-titanium-900/30 hover:border-titanium-700 transition-all overflow-hidden group">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant={c.status === "pending" || c.status === "draft" ? "default" : c.status === "rejected" ? "destructive" : "secondary"} className={`font-mono text-[9px] uppercase tracking-widest ${c.status === "pending" || c.status === "draft" ? "bg-amber-400/10 text-amber-400 border-amber-400/20" :
                              c.status === "assigned" ? "bg-blue-400/10 text-blue-400 border-blue-400/20" :
                                c.status === "rejected" ? "bg-red-400/10 text-red-400 border-red-400/20" :
                                  "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                              }`}>
                              {c.status}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                              {c.case_type === "sos" ? (
                                <div className="flex items-center gap-1.5 text-red-400">
                                  <Phone className="size-3" />
                                  <span className="font-mono text-[10px] uppercase tracking-widest">SOS</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 text-action">
                                  <Scale className="size-3" />
                                  <span className="font-mono text-[10px] uppercase tracking-widest">Civil</span>
                                </div>
                              )}
                            </div>
                            <span className="text-titanium-700">•</span>
                            <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">
                              {tab === "active" || tab === "sos" ? "triggered " : tab === "draft" ? "Created " : "Rejected "} {new Date(c.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h3 className="font-display text-xl font-bold text-titanium-50 group-hover:text-action transition-colors">{c.subject}</h3>
                              <Badge variant="outline" className={`font-mono text-[8px] uppercase tracking-widest ${c.urgency === "urgent" || c.urgency === "CRITICAL" ? "text-red-400 border-red-400/20" : "text-titanium-500 border-titanium-800"}`}>
                                {c.urgency}
                              </Badge>
                            </div>
                            <p className="text-sm text-titanium-400 leading-relaxed max-w-3xl line-clamp-2">{c.description || c.location_address}</p>
                          </div>

                          {tab === "rejected" && (
                            <Button
                              variant="outline"
                              className="w-full sm:w-auto border-red-500/20 bg-red-500/5 text-red-400 font-mono text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                              onClick={() => setViewingRejection(c)}
                            >
                              View Rejection Reason
                            </Button>
                          )}

                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                          {tab === "active" && c.attorney && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                              <div className="flex items-center justify-between gap-3 rounded-sm border border-titanium-800 bg-titanium-950/50 px-4 py-2">
                                <div className="text-left sm:text-right">
                                  <div className="font-mono text-[9px] uppercase tracking-widest text-titanium-500">Counsel</div>
                                  <div className="text-sm font-bold text-titanium-200">{c.attorney.full_name}</div>
                                </div>
                                <ShieldCheck className="size-5 text-emerald-500" />
                              </div>
                              {c.status === "active" || c.status === "resolved" && c.attorney.id && user?.role !== "ADMIN" && (
                                <Button
                                  onClick={() => router.push(`/app/messages?user=${c.attorney?.id}&name=${encodeURIComponent(c.attorney?.full_name || "Attorney")}&role=ATTORNEY`)}
                                  className="bg-action hover:bg-action/90 text-white h-10 sm:h-[50px] px-6 font-mono text-[10px] font-bold uppercase tracking-widest"
                                >
                                  Message
                                </Button>
                              )}
                            </div>
                          )}

                          {tab === "pending" && !c.attorney && (
                            <div className="flex items-center gap-3 rounded-sm border border-amber-500/20 bg-amber-500/5 px-4 py-2">
                              <div className="font-mono text-[9px] uppercase tracking-widest text-amber-500">Awaiting Assignment</div>
                              <Loader2 className="size-4 text-amber-500 animate-spin" />
                            </div>
                          )}

                          {tab === "draft" && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                variant="outline"
                                className="border-titanium-700 text-titanium-300 hover:text-white font-mono text-[10px] uppercase tracking-widest px-5 h-10"
                                onClick={() => setViewingCase(c)}
                              >
                                View Details
                              </Button>
                              <Button
                                variant="outline"
                                className="border-titanium-800 text-titanium-400 hover:text-white h-10 px-5 font-mono text-[10px] uppercase tracking-widest"
                                onClick={() => router.push(`/app/civil?draft=${c.id}`)}
                              >
                                Edit Intake
                              </Button>
                              <Button
                                className="bg-action hover:bg-action/90 text-action-foreground font-mono text-[10px] uppercase tracking-widest px-6 h-10"
                                onClick={() => router.push(`/app/civil?draft=${c.id}&step=2`)}
                              >
                                Finalize Intake →
                              </Button>
                            </div>
                          )}

                          {tab === "rejected" && c.case_type === "civil" && (
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                variant="outline"
                                className="border-titanium-800 text-titanium-400 hover:text-white h-10 px-5 font-mono text-[10px] uppercase tracking-widest"
                                onClick={() => router.push(`/app/civil?draft=${c.id}`)}
                              >
                                Edit Intake
                              </Button>
                              <Button
                                className="bg-titanium-800 hover:bg-titanium-700 text-titanium-100 font-mono text-[10px] uppercase tracking-widest px-6 h-10 border border-titanium-700"
                                onClick={() => router.push(`/app/civil?draft=${c.id}&step=2`)}
                              >
                                Resubmit Case →
                              </Button>
                            </div>
                          )}

                          {(tab === "active" || tab === "sos") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-titanium-700 text-titanium-300 hover:text-white h-10 px-5 font-mono text-[10px] uppercase tracking-widest"
                              onClick={() => setViewingCase(c)}
                            >
                              View Details
                            </Button>
                          )}

                          {tab === "active" && c.case_type === "civil" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-titanium-700 text-titanium-400 hover:text-white h-10 px-4 font-mono text-[10px] uppercase tracking-widest"
                              onClick={() => openEditModal(c)}
                            >
                              Modify
                            </Button>
                          )}

                        </div>

                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>

      <AnimatePresence>
        {editingCase && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-titanium-950/90 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg border border-titanium-800 bg-titanium-950 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] scrollbar-hide"
            >
              {/* Header Banner */}
              <div className="relative h-24 md:h-32 bg-gradient-to-r from-action/20 via-titanium-900 to-titanium-950 border-b border-titanium-800">
                <div className="absolute -bottom-10 left-4 md:left-8 rounded-full border-4 border-titanium-950 bg-titanium-900 p-3 md:p-4 text-action shadow-2xl">
                  <FileText className="size-8 md:size-12" />
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className={`rounded-full border border-action/20 bg-action/5 px-2 md:px-3 py-0.5 md:py-1 font-mono text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-action backdrop-blur-sm`}>
                    EDITING CASE
                  </div>
                </div>
                <button
                  onClick={() => setEditingCase(null)}
                  className="absolute top-4 left-4 rounded-full p-2 text-titanium-400 hover:bg-titanium-800 hover:text-titanium-50 transition-colors md:hidden"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="p-4 md:p-8 pt-12 md:pt-14 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-titanium-50 tracking-tight">
                      Edit Case
                    </h2>
                    <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-action/80">
                      {editingCase.matter_type.replace("_", " ")}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditingCase(null)}
                    className="hidden md:flex items-center gap-2 text-titanium-400 hover:text-white transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="grid gap-6">
                  {/* General Case Info */}
                  <div className="space-y-6 rounded-lg border border-titanium-800 bg-titanium-900/40 p-6">
                    <div className="grid gap-2">
                      <Label className="text-titanium-400 font-mono text-[10px] uppercase tracking-widest">Subject</Label>
                      <Input
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="border-titanium-700 bg-titanium-900/50 text-titanium-100 focus-visible:ring-action/50"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-titanium-400 font-mono text-[10px] uppercase tracking-widest">Description</Label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="min-h-[160px] border-titanium-700 bg-titanium-900/50 text-titanium-100 focus-visible:ring-action/50"
                      />
                    </div>
                  </div>

                  {/* Opposing Party */}
                  <div className="space-y-6 rounded-lg border border-titanium-800 bg-titanium-900/40 p-6">
                    <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500 mb-4">Opposing Party</h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="grid gap-2">
                        <Label className="text-titanium-400 font-mono text-[10px] uppercase tracking-widest">Name (Optional)</Label>
                        <Input
                          value={editOpposingParty}
                          onChange={(e) => setEditOpposingParty(e.target.value)}
                          className="border-titanium-700 bg-titanium-900/50 text-titanium-100 focus-visible:ring-action/50"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-titanium-400 font-mono text-[10px] uppercase tracking-widest">Address (Optional)</Label>
                        <Input
                          value={editOpposingPartyLocation}
                          onChange={(e) => setEditOpposingPartyLocation(e.target.value)}
                          className="border-titanium-700 bg-titanium-900/50 text-titanium-100 focus-visible:ring-action/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Metadata based on matter_type */}
                  {(editingCase.matter_type === "landlord_tenant" || editingCase.matter_type === "employment") && (
                    <div className="space-y-6 rounded-lg border border-titanium-800 bg-titanium-900/40 p-6">
                      <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500 mb-4">Tactical Intake Data</h3>

                      {editingCase.matter_type === "landlord_tenant" && (
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="sm:col-span-2 grid gap-2">
                            <Label className="text-titanium-400 font-mono text-[10px] uppercase tracking-widest">Property Address</Label>
                            <Input
                              value={editMetadata?.property_address || ""}
                              onChange={(e) => handleEditMetadataChange("property_address", e.target.value)}
                              className="border-titanium-700 bg-titanium-900/50 text-titanium-100 focus-visible:ring-action/50"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-titanium-400 font-mono text-[10px] uppercase tracking-widest">Landlord Name</Label>
                            <Input
                              value={editMetadata?.landlord_name || ""}
                              onChange={(e) => handleEditMetadataChange("landlord_name", e.target.value)}
                              className="border-titanium-700 bg-titanium-900/50 text-titanium-100 focus-visible:ring-action/50"
                            />
                          </div>
                        </div>
                      )}

                      {editingCase.matter_type === "employment" && (
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div className="grid gap-2">
                            <Label className="text-titanium-400 font-mono text-[10px] uppercase tracking-widest">Employer Name</Label>
                            <Input
                              value={editMetadata?.employer_name || ""}
                              onChange={(e) => handleEditMetadataChange("employer_name", e.target.value)}
                              className="border-titanium-700 bg-titanium-900/50 text-titanium-100 focus-visible:ring-action/50"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-titanium-400 font-mono text-[10px] uppercase tracking-widest">Start Date</Label>
                            <Input
                              type="date"
                              value={editMetadata?.employment_start_date || ""}
                              onChange={(e) => handleEditMetadataChange("employment_start_date", e.target.value)}
                              className="border-titanium-700 bg-titanium-900/50 text-titanium-100 focus-visible:ring-action/50 [color-scheme:dark]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-4 pt-4 border-t border-titanium-800">
                    <Button
                      variant="ghost"
                      onClick={() => setEditingCase(null)}
                      className="text-titanium-400 hover:text-white"
                      disabled={savingEdit}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveEdit}
                      disabled={savingEdit || !editSubject || !editDescription}
                      className="bg-action text-action-foreground hover:bg-action/90 font-mono text-[10px] uppercase tracking-widest px-8"
                    >
                      {savingEdit ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                      Save Case Details
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingRejection && (
          <div className="fixed inset-0 z-[60] mt-20 flex items-center justify-center bg-titanium-950/90 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md rounded-lg border border-titanium-800 bg-titanium-950 shadow-2xl overflow-hidden"
            >
              <div className="bg-red-500/10 border-b border-titanium-800 p-6 flex items-center gap-4">
                <div className="size-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/20">
                  <AlertCircle className="size-6" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-titanium-50">Rejection Details</h3>                </div>
                <button onClick={() => setViewingRejection(null)} className="ml-auto text-titanium-500 hover:text-white">
                  <X className="size-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-2 w-full min-w-0">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Attorney Feedback</span>
                  <div className="rounded-sm border border-titanium-800 bg-titanium-900/50 p-4 italic text-titanium-300 text-sm leading-relaxed break-words whitespace-pre-wrap">
                    "{viewingRejection.rejection_message || "No specific feedback provided by counsel."}"
                  </div>
                </div>

                {viewingRejection.attorney && (
                  <div className="space-y-4">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Rejected By</span>
                    <div className="rounded-sm border border-titanium-800 bg-titanium-950 p-4 space-y-3">
                      <div>
                        <div className="font-display font-bold text-titanium-50 text-base">{viewingRejection.attorney.full_name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="font-mono text-[8px] uppercase tracking-widest text-action border-action/20">
                            {viewingRejection.attorney.role || "Attorney"}
                          </Badge>
                          <span className="text-titanium-600 text-xs">•</span>
                          <span className="text-xs text-titanium-400">{viewingRejection.attorney.specialties || "Legal Professional"}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-titanium-800/50 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs text-titanium-300">
                          <Mail className="size-3 text-titanium-500" />
                          <span>{viewingRejection.attorney.email}</span>
                        </div>
                        {viewingRejection.attorney.phone && (
                          <div className="flex items-center gap-3">
                            <Phone className="size-3 text-titanium-500" />
                            <span className="font-mono text-xs text-titanium-300">{viewingRejection.attorney.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 flex flex-col gap-3">
                  {viewingRejection.case_type === "civil" && (
                    <Button
                      className="w-full bg-action hover:bg-action/90 text-action-foreground font-mono text-[10px] uppercase tracking-widest py-6"
                      onClick={() => {
                        setViewingRejection(null);
                        router.push(`/app/civil?draft=${viewingRejection.id}&step=2`);
                      }}
                    >
                      Resubmit for New Assignment →
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full text-titanium-500 font-mono text-[10px] uppercase tracking-widest"
                    onClick={() => setViewingRejection(null)}
                  >
                    Close Briefing
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <CaseDetailModal
        caseData={viewingCase ? {
          ...viewingCase,
          type: viewingCase.case_type === "sos" ? "sos" : "civil",
          user: viewingCase.attorney ? {
            full_name: viewingCase.attorney.full_name,
            email: viewingCase.attorney.email,
            phone: viewingCase.attorney.phone,
          } : undefined,
        } : null}
        onClose={() => setViewingCase(null)}
      />
    </>
  );
}
