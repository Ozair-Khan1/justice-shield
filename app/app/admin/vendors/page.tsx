"use client";

import { useEffect, useState, useMemo } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Phone,
  Globe,
  Shield,
  Award,
  MapPin,
  ChevronRight,
  Loader2,
  AlertCircle,
  History,
  FileSearch,
  X,
  Scale,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useLoading } from "@/components/LoadingProvider";
import { useAuth } from "@/lib/auth";
import { CallMethodModal } from "@/components/CallMethodModal";
import { Pagination } from "@/components/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Application {
  id: string;
  vendor_type: string;
  full_name: string;
  firm_name: string | null;
  email: string;
  phone: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  specialties: string | null;
  bar_number: string | null;
  years_experience: number;
  message: string | null;
  status: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export default function AdminVendorsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [rejectingApp, setRejectingApp] = useState<Application | null>(null);
  const [rejectionMessage, setRejectionMessage] = useState("");
  const ITEMS_PER_PAGE = 10;
  const { user: currentUser } = useAuth();
  const [callModal, setCallModal] = useState<{ isOpen: boolean; app: Application | null }>({ isOpen: false, app: null });
  const { startLoading, stopLoading } = useLoading();

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/admin/vendors");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setApplications(data.applications || []);
    } catch (err: any) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected", rejection_message?: string) => {
    setActioningId(id);
    startLoading(status === "approved" ? "Activating Vendor Credentials..." : "Rejecting Application...");
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejection_message }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setApplications(apps => apps.map(app =>
        app.id === id ? { ...app, status, metadata: status === 'rejected' && rejection_message ? { ...(app.metadata || {}), rejection_message } : app.metadata } : app
      ));

      if (status === "rejected") {
        setRejectingApp(null);
        setRejectionMessage("");
      }
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setActioningId(null);
      stopLoading();
    }
  };

  const filteredApplications = useMemo(() => {
    if (activeTab === "pending") {
      return applications.filter(a => a.status === "pending");
    }
    return applications.filter(a => a.status !== "pending");
  }, [applications, activeTab]);

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApps = filteredApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = {
    pending: applications.filter(a => a.status === "pending").length,
    processed: applications.filter(a => a.status !== "pending").length,
  };

  if (loading) return <LoadingScreen message="Accessing Vendor Vault..." />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-10 pb-20"
    >
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-action">Administration</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Vendor <span className="text-titanium-500">Network</span>
        </h1>
        <p className="mt-4 max-w-2xl text-titanium-400">
          Review and manage applications from attorneys and marketing specialists. Approved vendors gain elevated network access.
        </p>
      </header>

      {/* Tabs */}
      <div className="space-y-8">
        <div className="flex items-center gap-2 border-b border-titanium-800 pb-px">
          {[
            { id: "pending", label: "Pending Apps", icon: Clock, count: stats.pending, color: "text-amber-400" },
            { id: "history", label: "Processed History", icon: History, count: stats.processed, color: "text-emerald-400" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group relative flex items-center gap-2 px-8 py-4 transition-all ${activeTab === tab.id
                ? "text-titanium-50"
                : "text-titanium-500 hover:text-titanium-300"
                }`}
            >
              <tab.icon className={`size-4 ${activeTab === tab.id ? tab.color : "text-titanium-600"}`} />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                {tab.label}
              </span>
              {tab.count > 0 && (
                <span className={`flex size-5 items-center justify-center rounded-full text-[9px] font-bold ring-1 ${activeTab === tab.id
                  ? "bg-titanium-50 text-titanium-950 ring-titanium-50"
                  : "bg-titanium-800 text-titanium-400 ring-titanium-700"
                  }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeVendorTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-action"
                />
              )}
            </button>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredApplications.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />

        <div className="grid gap-6">
          <AnimatePresence mode="wait">
            {paginatedApps.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center rounded-lg border border-dashed border-titanium-800 p-20 text-center"
              >
                <div className="rounded-full bg-titanium-900/50 p-4 ring-1 ring-titanium-800">
                  <FileSearch className="size-8 text-titanium-700" />
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-titanium-600">
                  No {activeTab} applications found
                </p>
              </motion.div>
            ) : activeTab === "pending" ? (
              <motion.div
                key="pending-list"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid gap-6"
              >
                {paginatedApps.map((app) => (
                  <ApplicationCard
                    key={app.id}
                    app={app}
                    onAction={(status) => {
                      if (status === "rejected") {
                        setRejectingApp(app);
                      } else {
                        handleStatusUpdate(app.id, status);
                      }
                    }}
                    isActioning={actioningId === app.id}
                    onReview={() => setSelectedApp(app)}
                    onCall={() => setCallModal({ isOpen: true, app })}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="history-list"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden rounded-sm border border-titanium-800 bg-titanium-900/20"
              >
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-titanium-800 bg-titanium-900/60 font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                    <tr>
                      <th className="px-6 py-4 font-bold">Type</th>
                      <th className="px-6 py-4 font-bold">Vendor Name</th>
                      <th className="px-6 py-4 font-bold">Email Address</th>
                      <th className="px-6 py-4 font-bold">Date Submitted</th>
                      <th className="px-6 py-4 font-bold text-right">Final Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-titanium-800/50">
                    {paginatedApps.map((app) => (
                      <tr key={app.id} className="group hover:bg-titanium-900/40 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${app.vendor_type === "ATTORNEY" ? "text-action" : "text-purple-400"
                            }`}>
                            {app.vendor_type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-titanium-100">{app.full_name}</td>
                        <td className="px-6 py-4 text-titanium-400 font-mono text-xs">{app.email}</td>
                        <td className="px-6 py-4 text-titanium-500 font-mono text-xs">{new Date(app.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="font-mono text-[9px] uppercase tracking-widest text-titanium-500 hover:text-action transition-colors"
                            >
                              Review
                            </button>
                            <span className={`font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border ${app.status === "approved"
                              ? "text-emerald-400 border-emerald-400/20 bg-emerald-400/5"
                              : "text-red-400 border-red-400/20 bg-red-500/5"
                              }`}>
                              {app.status}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-titanium-950/90 p-4 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-titanium-800 bg-titanium-950 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] scrollbar-hide"
            >
              <div className="relative h-24 md:h-32 bg-gradient-to-r from-action/20 via-titanium-900 to-titanium-950 border-b border-titanium-800">
                <div className="absolute -bottom-10 left-4 md:left-8 rounded-full border-4 border-titanium-950 bg-titanium-900 p-3 md:p-4 text-action shadow-2xl">
                  <FileSearch className="size-8 md:size-12" />
                </div>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className={`font-mono text-[9px] uppercase tracking-widest px-3 ${selectedApp.status === "pending" ? "text-amber-500 border-amber-500/20 bg-amber-500/5" : selectedApp.status === "approved" ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-red-500 border-red-500/20 bg-red-500/5"}`}>
                    {selectedApp.status}
                  </Badge>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="absolute top-4 left-4 rounded-full p-2 text-titanium-400 hover:bg-titanium-800 hover:text-titanium-50 transition-colors md:hidden"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="p-4 md:p-8 pt-12 md:pt-14 space-y-8">
                <div className="space-y-1">
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-titanium-50 tracking-tight">
                    {selectedApp.full_name}
                  </h2>
                  <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-action/80">
                    {selectedApp.vendor_type.replace("_", " ")} APPLICATION
                  </p>
                </div>
                <div className="flex justify-end px-4 md:px-0">
                  <Button
                    onClick={() => {
                      setSelectedApp(null);
                      setTimeout(() => setCallModal({ isOpen: true, app: selectedApp }), 150);
                    }}
                    variant="outline"
                    className="border-action/30 text-action hover:bg-action hover:text-white font-mono text-[10px] uppercase tracking-widest h-10 px-6"
                  >
                    <Phone className="size-4 mr-2" />
                    Call Applicant
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-y border-titanium-800/50 py-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="size-1 bg-action rounded-full" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Contact Channels</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-titanium-300">
                        <Mail className="size-4 text-action/70 flex-shrink-0" />
                        <span className="truncate">{selectedApp.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-action font-mono">
                        <Phone className="size-4 flex-shrink-0" />
                        <span>{selectedApp.phone || "Not provided"}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-titanium-300">
                        <MapPin className="size-4 text-action/70 flex-shrink-0" />
                        <span>{selectedApp.city || "Not provided"} , {selectedApp.country || "Not provided"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="size-1 bg-action rounded-full" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Credentials</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-sm border border-titanium-800 bg-titanium-900/30 p-3">
                        <span className="font-mono text-[9px] uppercase text-titanium-500">Submitted</span>
                        <span className="font-mono text-[10px] font-bold text-titanium-300 uppercase">{new Date(selectedApp.created_at).toLocaleDateString()}</span>
                      </div>
                      {selectedApp.vendor_type === "ATTORNEY" && (
                        <div className="flex items-center justify-between rounded-sm border border-titanium-800 bg-titanium-900/30 p-3">
                          <span className="font-mono text-[9px] uppercase text-titanium-500">Exp. Years</span>
                          <span className="font-mono text-[10px] font-bold text-action uppercase">{selectedApp.years_experience}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 w-full min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="size-1 bg-action rounded-full" />
                    <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Statement of Expertise</h4>
                  </div>
                  <div className="rounded-lg bg-titanium-900/50 border border-titanium-800 p-6">
                    <p className="text-sm leading-relaxed text-titanium-300 font-light whitespace-pre-wrap break-words">
                      {selectedApp.specialties || "No specialties listed"}
                    </p>
                  </div>
                </div>

                {selectedApp.message && (
                  <div className="space-y-4 w-full min-w-0">
                    <div className="flex items-center gap-2 text-action/60">
                      <AlertCircle className="size-4" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Additional Message</h4>
                    </div>
                    <div className="rounded-lg border border-titanium-800 bg-titanium-950/30 p-4 italic text-sm text-titanium-500 leading-relaxed break-words whitespace-pre-wrap">
                      "{selectedApp.message}"
                    </div>
                  </div>
                )}

                {(selectedApp as any).metadata && Object.keys((selectedApp as any).metadata).length > 0 && (
                  <div className="space-y-4 w-full min-w-0">
                    <div className="flex items-center gap-2 text-action/60">
                      <ShieldCheck className="size-4" />
                      <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Tactical Intake Data</h4>
                    </div>
                    <div className="grid gap-2 rounded-lg border border-titanium-800 bg-titanium-950/30 p-4">
                      {Object.entries((selectedApp as any).metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start sm:items-center gap-4 py-2 border-b border-titanium-800 last:border-0">
                          <span className="text-titanium-500 capitalize text-[10px] font-mono flex-shrink-0 mt-0.5 sm:mt-0">{key.replace(/_/g, " ")}:</span>
                          <span className="font-medium text-titanium-200 text-xs text-right break-words">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 z-10 border-t border-titanium-800 bg-titanium-950 p-4 md:p-6 flex flex-col md:flex-row justify-end gap-3 backdrop-blur-md">
                <Button
                  variant="outline"
                  onClick={() => setSelectedApp(null)}
                  className="border-titanium-700 bg-transparent text-titanium-300 hover:bg-titanium-800 h-11 px-8 font-mono text-[10px] uppercase tracking-widest w-full md:w-auto"
                >
                  Dismiss
                </Button>
                {selectedApp.status === "pending" && (
                  <Button
                    onClick={() => {
                      handleStatusUpdate(selectedApp.id, "approved");
                      setSelectedApp(null);
                    }}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white h-11 px-8 font-mono text-[10px] font-bold uppercase tracking-widest w-full md:w-auto"
                  >
                    Approve Network Access
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Dialog open={!!rejectingApp} onOpenChange={(open) => {
        if (!open && !actioningId) {
          setRejectingApp(null);
          setRejectionMessage("");
        }
      }}>
        <DialogContent className="border-titanium-800 bg-titanium-950 text-titanium-50 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-titanium-50">Reject Application</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-titanium-400">
              Please provide a reason for rejecting this application. This information will be included in the rejection email sent to the applicant.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-titanium-500">Rejection Reason</label>
              <textarea
                value={rejectionMessage}
                onChange={(e) => setRejectionMessage(e.target.value)}
                placeholder="e.g. Unverifiable credentials, incomplete profile, outside service area..."
                className="w-full min-h-[100px] rounded-md border border-titanium-800 bg-titanium-900/50 p-3 text-sm text-titanium-200 placeholder:text-titanium-600 focus:border-action focus:outline-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setRejectingApp(null);
                setRejectionMessage("");
              }}
              disabled={!!actioningId}
              className="border-titanium-700 bg-titanium-900 font-mono text-[10px] uppercase tracking-widest text-titanium-300 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => rejectingApp && handleStatusUpdate(rejectingApp.id, "rejected", rejectionMessage)}
              disabled={!!actioningId || !rejectionMessage.trim()}
              className="bg-red-500 hover:bg-red-600 text-white font-mono text-[10px] uppercase tracking-widest w-full sm:w-auto"
            >
              {actioningId ? <Loader2 className="mr-2 size-3 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Call Method Modal */}
      <CallMethodModal
        isOpen={callModal.isOpen}
        onClose={() => setCallModal({ isOpen: false, app: null })}
        userName={callModal.app?.full_name || "Applicant"}
        phoneNumber={callModal.app?.phone || undefined}
        onBrowserCall={() => {
          // Note: Browser call requires a User ID. If the applicant doesn't have one, we can't do a browser call.
          // For now, we only enable browser call if they exist as a user.
          // Since Application doesn't have user_id, we might need to fetch it or only allow phone calls here.
          alert("Browser calls are currently reserved for registered members. Please use the Phone Call option for applicants.");
        }}
      />
    </motion.div>
  );
}

function ApplicationCard({
  app,
  onAction,
  isActioning,
  onReview,
  onCall
}: {
  app: Application;
  onAction: (s: "approved" | "rejected") => void;
  isActioning: boolean;
  onReview: () => void;
  onCall: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-sm border border-titanium-800 bg-titanium-900/30 p-6 transition-all hover:border-titanium-700 hover:bg-titanium-900/50 shadow-sm hover:shadow-action/5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-sm px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest border ${app.vendor_type === "ATTORNEY" ? "text-action border-action/30 bg-action/5" : "text-purple-400 border-purple-400/30 bg-purple-400/5"
              }`}>
              {app.vendor_type.replace("_", " ")}
            </span>
            <span className="font-mono text-[10px] text-titanium-600 uppercase tracking-widest">
              {new Date(app.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-titanium-50 tracking-tight">{app.full_name}</h3>
            <p className="text-titanium-400 text-xs font-medium uppercase tracking-wider">{app.firm_name || "Independent Professional"}</p>
          </div>

          <div className="flex flex-wrap gap-6 text-[11px] text-titanium-400">
            <div className="flex items-center gap-2">
              <Mail className="size-3 text-action/70" />
              <span>{app.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-3 text-action/70" />
              <span>{app.city || "Unknown"} , {app.country || "Unknown"}</span>
            </div>
            {app.phone && (
              <div className="flex items-center gap-2 font-mono text-action/80">
                <Phone className="size-3" />
                <span>{app.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <button
            onClick={onReview}
            className="flex items-center justify-center gap-2 rounded-sm border border-titanium-800 bg-titanium-950/50 px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-400 transition-all hover:bg-titanium-800 hover:text-titanium-100"
          >
            <FileSearch className="size-3" />
            Review Details
          </button>
          <button
            onClick={onCall}
            className="flex items-center justify-center gap-2 rounded-sm border border-action/30 bg-action/5 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-action transition-all hover:bg-action hover:text-white"
          >
            <Phone className="size-3" />
          </button>
          <div className="flex gap-2">
            <button
              disabled={isActioning}
              onClick={() => onAction("approved")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-sm bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-500 transition-all hover:bg-emerald-500 hover:text-white disabled:opacity-50"
            >
              {isActioning ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
            </button>
            <button
              disabled={isActioning}
              onClick={() => onAction("rejected")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-sm bg-red-500/10 border border-red-500/20 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-red-500 transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
            >
              <XCircle className="size-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
