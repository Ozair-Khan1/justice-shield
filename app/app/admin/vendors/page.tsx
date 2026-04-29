"use client";

import { useEffect, useState } from "react";

interface Vendor {
  id: string;
  vendor_type: string;
  full_name: string;
  firm_name: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  specialties: string | null;
  bar_number: string | null;
  years_experience: number | null;
  message: string | null;
  status: string;
  created_at: string;
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingVendor, setApprovingVendor] = useState(false);
  const [rejectingVendor, setRejectingVendor] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const fetchVendors = () => {
    fetch("/api/admin/vendors")
      .then((res) => res.json())
      .then((data) => {
        setVendors(data.vendors ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/vendors`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchVendors();
      } else {
        const data = await res.json();
        alert(data.error || "Update failed");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setApprovingVendor(false);
      setRejectingVendor(false);
    }
  };

  const filtered = filter === "all" ? vendors : vendors.filter((v) => v.status === filter);

  if (loading) return <div className="font-mono text-xs text-titanium-500">Loading vendors...</div>;

  return (
    <div className="space-y-8">
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">Admin</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Vendor Applications</h1>
        <p className="mt-2 text-sm text-titanium-400">
          {vendors.length} total · {vendors.filter((v) => v.status === "pending").length} pending
        </p>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-1 border-b border-titanium-800 overflow-auto">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`relative px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${filter === f ? "text-red-500" : "text-titanium-400 hover:text-titanium-50"
              }`}
          >
            {f}
            {filter === f && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-red-500" />}
          </button>
        ))}
      </div>

      {/* Vendor Cards */}
      <div className="space-y-4">
        {filtered.map((v) => (
          <div key={v.id} className="rounded-sm border border-titanium-800 bg-titanium-900/50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-display text-lg font-bold">{v.full_name}</h3>
                  <span className={`inline-block rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${v.status === "approved"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : v.status === "rejected"
                      ? "bg-red-500/15 text-red-400"
                      : "bg-amber-500/15 text-amber-400"
                    }`}>
                    {v.status}
                  </span>
                </div>
                <p className="font-mono text-xs text-titanium-400">
                  {v.vendor_type.replace("_", " ")} · {v.email}
                  {v.phone && ` · ${v.phone}`}
                </p>
                {v.firm_name && (
                  <p className="text-sm text-titanium-300">{v.firm_name}</p>
                )}
                {v.location && (
                  <p className="text-xs text-titanium-500">{v.location}</p>
                )}
              </div>

              {v.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => { updateStatus(v.id, "approved"); setApprovingVendor(true); setRejectingVendor(false) }}
                    disabled={approvingVendor || rejectingVendor}
                    className="rounded-sm bg-emerald-600 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approvingVendor ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => { updateStatus(v.id, "rejected"); setRejectingVendor(true); setApprovingVendor(false) }}
                    disabled={rejectingVendor || approvingVendor}
                    className="rounded-sm border border-titanium-700 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-400 transition-colors hover:border-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {rejectingVendor ? "Rejecting..." : "Reject"}
                  </button>
                </div>
              )}
            </div>

            {(v.specialties || v.bar_number || v.years_experience !== null) && (
              <div className="mt-4 flex flex-wrap gap-4 border-t border-titanium-800/60 pt-4">
                {v.bar_number && (
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-titanium-600">Bar #</span>
                    <p className="text-xs text-titanium-300">{v.bar_number}</p>
                  </div>
                )}
                {v.years_experience !== null && (
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-titanium-600">Experience</span>
                    <p className="text-xs text-titanium-300">{v.years_experience} years</p>
                  </div>
                )}
                {v.specialties && (
                  <div className="flex-1">
                    <span className="font-mono text-[9px] uppercase tracking-widest text-titanium-600">Specialties</span>
                    <p className="text-xs text-titanium-300">{v.specialties}</p>
                  </div>
                )}
              </div>
            )}

            {v.message && (
              <div className="mt-4 border-t border-titanium-800/60 pt-4">
                <span className="font-mono text-[9px] uppercase tracking-widest text-titanium-600">Message</span>
                <p className="mt-1 text-xs leading-relaxed text-titanium-400">{v.message}</p>
              </div>
            )}

            <p className="mt-3 font-mono text-[10px] text-titanium-600">
              Applied {new Date(v.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-titanium-500">No {filter === "all" ? "" : filter} applications found.</p>
        )}
      </div>
    </div>
  );
}
