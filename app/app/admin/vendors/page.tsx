"use client";

import { useEffect, useState } from "react";
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
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface Application {
  id: string;
  vendor_type: string;
  full_name: string;
  firm_name: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  website: string | null;
  specialties: string | null;
  bar_number: string | null;
  years_experience: number;
  message: string | null;
  status: string;
  created_at: string;
}

export default function AdminVendorsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

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

  const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
    setActioningId(id);
    try {
      const res = await fetch(`/api/admin/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Update local state
      setApplications(apps => apps.map(app =>
        app.id === id ? { ...app, status } : app
      ));
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-action" />
      </div>
    );
  }

  const pending = applications.filter(a => a.status === "pending");
  const processed = applications.filter(a => a.status !== "pending");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12"
    >
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-action">Administration</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Vendor <span className="text-titanium-500">Approvals</span>
        </h1>
        <p className="mt-4 max-w-2xl text-titanium-400">
          Review and manage applications from attorneys and marketing specialists. Approved vendors will gain elevated network access.
        </p>
      </header>

      {/* Pending Applications */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Clock className="size-4 text-action" />
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-titanium-300">Pending Review ({pending.length})</h2>
        </div>

        <div className="grid gap-6">
          {pending.length === 0 ? (
            <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
              No pending applications
            </div>
          ) : (
            pending.map((app) => (
              <ApplicationCard
                key={app.id}
                app={app}
                onAction={(status) => handleStatusUpdate(app.id, status)}
                isActioning={actioningId === app.id}
              />
            ))
          )}
        </div>
      </section>

      {/* History */}
      {processed.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-titanium-800">
          <div className="flex items-center gap-3">
            <Shield className="size-4 text-titanium-500" />
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-titanium-500">Processed History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-titanium-800 font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                <tr>
                  <th className="pb-4 pr-4 font-bold">Type</th>
                  <th className="pb-4 pr-4 font-bold">Name</th>
                  <th className="pb-4 pr-4 font-bold">Email</th>
                  <th className="pb-4 pr-4 font-bold">Date</th>
                  <th className="pb-4 font-bold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-titanium-800/50">
                {processed.map((app) => (
                  <tr key={app.id} className="group">
                    <td className="py-4 pr-4">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-titanium-400">
                        {app.vendor_type === "ATTORNEY" ? "Attorney" : "Marketer"}
                      </span>
                    </td>
                    <td className="py-4 pr-4 font-bold text-titanium-100">{app.full_name}</td>
                    <td className="py-4 pr-4 text-titanium-400">{app.email}</td>
                    <td className="py-4 pr-4 text-titanium-500">{new Date(app.created_at).toLocaleDateString()}</td>
                    <td className="py-4 text-right">
                      <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${app.status === "approved" ? "text-emerald-400" : "text-red-400"
                        }`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </motion.div>
  );
}

function ApplicationCard({ app, onAction, isActioning }: { app: Application; onAction: (s: "approved" | "rejected") => void; isActioning: boolean }) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-titanium-800 bg-titanium-900/30 p-8 transition-all hover:border-titanium-700 hover:bg-titanium-900/50">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest border ${app.vendor_type === "ATTORNEY" ? "text-action border-action/30 bg-action/5" : "text-purple-400 border-purple-400/30 bg-purple-400/5"
              }`}>
              {app.vendor_type.replace("_", " ")}
            </span>
            <span className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">
              Submitted {new Date(app.created_at).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-titanium-50">{app.full_name}</h3>
            <p className="text-titanium-400">{app.firm_name || "Independent Professional"}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-sm text-titanium-300">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-action" />
              <span>{app.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-action" />
              <span>{app.phone || "N/A"}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="size-4 text-action" />
              <span>{app.location || "Unknown"}</span>
            </div>
            {app.website && (
              <div className="flex items-center gap-3">
                <Globe className="size-4 text-action" />
                <a href={app.website} target="_blank" className="hover:text-action hover:underline truncate">{app.website}</a>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-titanium-800/50">
            <div className="flex items-center gap-2">
              <Award className="size-4 text-titanium-400" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">Expertise & Specialties</span>
            </div>
            <p className="text-sm leading-relaxed text-titanium-400">{app.specialties}</p>
          </div>

          {app.message && (
            <div className="rounded-sm bg-titanium-950/50 p-4 italic text-sm text-titanium-500">
              "{app.message}"
            </div>
          )}
        </div>

        <div className="space-y-6 lg:border-l lg:border-titanium-800 lg:pl-8">
          {app.vendor_type === "ATTORNEY" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-titanium-800 bg-titanium-950/50 p-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">Bar Number</div>
                <div className="mt-1 font-bold text-titanium-100">{app.bar_number}</div>
              </div>
              <div className="rounded-lg border border-titanium-800 bg-titanium-950/50 p-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">Experience</div>
                <div className="mt-1 font-bold text-titanium-100">{app.years_experience} Years</div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            <button
              disabled={isActioning}
              onClick={() => onAction("approved")}
              className="flex items-center justify-center gap-2 rounded-sm bg-emerald-500 px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-emerald-600 disabled:opacity-50"
            >
              {isActioning ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
              Approve Vendor
            </button>
            <button
              disabled={isActioning}
              onClick={() => onAction("rejected")}
              className="flex items-center justify-center gap-2 rounded-sm border border-red-500/30 bg-red-500/5 px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-red-500 transition-all hover:bg-red-500/10 hover:border-red-500 disabled:opacity-50"
            >
              <XCircle className="size-3" />
              Reject Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
