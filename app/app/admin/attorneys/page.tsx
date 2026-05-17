"use client";

import { useEffect, useState } from "react";
import { Search, Scale, Briefcase, Mail, Phone, Info, MessageSquare, BadgeInfo, MapPin, Award, User as UserIcon, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/components/LoadingProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth";
import { CallMethodModal } from "@/components/CallMethodModal";
import { io } from "socket.io-client";

interface AttorneyRecord {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  firm_name: string | null;
  specialties: string | null;
  bar_number: string | null;
  years_experience: number | null;
  membership_tier: string;
  city: string | null;
  country: string | null;
  created_at: string;
  case_stats?: {
    active: number;
    assigned: number;
    resolved: number;
  };
  _count: {
    assigned_encounters: number;
    assigned_intakes: number;
  };
}

export default function AdminAttorneysPage() {
  const router = useRouter();
  const [attorneys, setAttorneys] = useState<AttorneyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const { user: currentUser } = useAuth();
  const [callModal, setCallModal] = useState<{ isOpen: boolean; attorney: AttorneyRecord | null }>({ isOpen: false, attorney: null });
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  useEffect(() => {
    fetch("/api/admin/attorneys")
      .then((res) => res.json())
      .then((data) => {
        setAttorneys(data.attorneys ?? []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, specialtySearch]);

  const filtered = attorneys.filter((a) => {
    const searchLower = search.toLowerCase();
    const specialtyLower = specialtySearch.toLowerCase();
    const matchesSearch =
      a.email.toLowerCase().includes(searchLower) ||
      (a.full_name ?? "").toLowerCase().includes(searchLower);
    const matchesSpecialty = (a.specialties ?? "").toLowerCase().includes(specialtyLower);
    return matchesSearch && matchesSpecialty;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedAttorneys = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <LoadingScreen message="Fetching our network of legal defenders..." />;

  return (
    <div className="space-y-8">
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">Admin</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">Attorney Network</h1>
        <p className="mt-2 text-sm text-titanium-400">{attorneys.length} registered attorneys</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm border border-titanium-700 bg-titanium-900 py-3 pl-10 pr-4 text-sm text-titanium-50 outline-none transition-colors focus:border-red-500"
          />
        </div>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
          <input
            type="text"
            placeholder="Filter by specialty (e.g. Criminal, Civil)..."
            value={specialtySearch}
            onChange={(e) => setSpecialtySearch(e.target.value)}
            className="w-full rounded-sm border border-titanium-700 bg-titanium-900 py-3 pl-10 pr-4 text-sm text-titanium-50 outline-none transition-colors focus:border-red-500"
          />
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={attorneys.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      <div className="overflow-x-auto rounded-sm border border-titanium-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-titanium-800 bg-titanium-900/60">
            <tr>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Attorney</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Contact</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Firm / Bar</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500 text-center">Exp</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Specialties</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Joined</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-titanium-800/60">
            {paginatedAttorneys.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-titanium-900/40">
                <td className="px-4 py-4">
                  <div className="font-bold text-titanium-100">{a.full_name || "—"}</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase text-titanium-500">{a.membership_tier}</div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2 text-xs text-titanium-300">
                    <Mail className="size-3 text-titanium-500" />
                    {a.email}
                  </div>
                  {a.phone && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-titanium-400">
                      <Phone className="size-3 text-titanium-500" />
                      {a.phone}
                    </div>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-xs text-titanium-300">{a.firm_name || "—"}</div>
                  <div className="mt-1 font-mono text-[10px] text-titanium-500 uppercase tracking-tighter">
                    {a.bar_number ? `Bar: ${a.bar_number}` : "No Bar #"}
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="font-mono text-xs text-titanium-300">{a.years_experience ?? 0}y</div>
                </td>
                <td className="px-4 py-4">
                  <div className="max-w-[200px] text-xs leading-relaxed text-titanium-400">
                    {a.specialties || "—"}
                  </div>
                </td>
                <td className="px-4 py-4 font-mono text-xs text-titanium-500">
                  {new Date(a.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <Dialog open={openDialogId === a.id} onOpenChange={(v) => setOpenDialogId(v ? a.id : null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setOpenDialogId(a.id)}
                          className="size-[26px] border-titanium-800 bg-titanium-950/50 hover:border-action/50 hover:text-action transition-all min-w-[26px]"
                        >
                          <BadgeInfo className="size-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto border-titanium-800 bg-titanium-950 p-0 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] scrollbar-hide">
                        <div className="relative h-24 md:h-32 bg-gradient-to-r from-action/20 via-titanium-900 to-titanium-950 border-b border-titanium-800">
                          <div className="absolute -bottom-10 left-4 md:left-8 rounded-full border-4 border-titanium-950 bg-titanium-900 p-3 md:p-4 text-action shadow-2xl">
                            <UserIcon className="size-8 md:size-12" />
                          </div>
                          <div className="absolute top-4 right-4 flex gap-2">
                            <Button
                              onClick={() => {
                                setOpenDialogId(null);
                                setTimeout(() => setCallModal({ isOpen: true, attorney: a }), 150);
                              }}
                              variant="outline"
                              size="sm"
                              className="border-action/30 text-action hover:bg-action hover:text-white font-mono text-[10px] uppercase tracking-widest h-8 px-3 bg-titanium-950/50"
                            >
                              <Phone className="size-3 mr-2" />
                              Call Attorney
                            </Button>
                            <div className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2 md:px-3 py-0.5 md:py-1 font-mono text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-emerald-400 backdrop-blur-sm">
                              Verified Partner
                            </div>
                          </div>
                        </div>
                        <div className="p-4 md:p-8 pt-12 md:pt-14 space-y-6 md:space-y-8">
                          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div className="space-y-1">
                              <DialogTitle className="font-display text-2xl md:text-3xl font-bold text-titanium-50 tracking-tight">
                                {a.full_name}
                              </DialogTitle>
                              <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-action/80">
                                {a.firm_name || "Independent Legal Professional"}
                              </p>
                            </div>
                            {a.years_experience !== null && (
                              <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-1">
                                <div className="flex flex-col items-center md:items-end">
                                  <span className="font-mono text-lg md:text-xl font-bold text-titanium-50 leading-none">{a.years_experience}</span>
                                  <span className="font-mono text-[7px] md:text-[8px] uppercase tracking-widest text-titanium-500 mt-1">Years Practice</span>
                                </div>
                                <div className="size-1 bg-titanium-800 rounded-full hidden md:block" />
                                <div className="flex flex-col items-center md:items-end">
                                  <div className="font-mono text-lg md:text-base font-bold text-titanium-50 leading-none">{a._count.assigned_intakes + a._count.assigned_encounters}</div>
                                  <div className="font-mono text-[7px] uppercase tracking-widest text-titanium-500 mt-1">Total Assigned Cases</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {a.case_stats && (
                            <div className="grid grid-cols-3 gap-2 border-y border-titanium-800/50 py-4">
                              <div className="flex flex-col items-center p-2 rounded bg-titanium-900/30 border border-titanium-800/50">
                                <span className="font-mono text-lg font-bold text-action">{a.case_stats.active}</span>
                                <span className="font-mono text-[8px] uppercase tracking-widest text-titanium-500 mt-1">Active</span>
                              </div>
                              <div className="flex flex-col items-center p-2 rounded bg-titanium-900/30 border border-titanium-800/50">
                                <span className="font-mono text-lg font-bold text-blue-500">{a.case_stats.assigned}</span>
                                <span className="font-mono text-[8px] uppercase tracking-widest text-titanium-500 mt-1">Assigned</span>
                              </div>
                              <div className="flex flex-col items-center p-2 rounded bg-titanium-900/30 border border-titanium-800/50">
                                <span className="font-mono text-lg font-bold text-emerald-500">{a.case_stats.resolved}</span>
                                <span className="font-mono text-[8px] uppercase tracking-widest text-titanium-500 mt-1">Resolved</span>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 py-6 md:py-8 pt-2">
                            <div className="space-y-4 md:space-y-5">
                              <div className="flex items-center gap-2">
                                <div className="size-1 bg-action rounded-full" />
                                <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Contact Interface</h4>
                              </div>
                              <div className="space-y-3 md:space-y-4">
                                <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300 group/link">
                                  <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800 group-hover/link:border-action/30 transition-colors">
                                    <Mail className="size-3.5 md:size-4 text-action/70" />
                                  </div>
                                  <span className="truncate">{a.email}</span>
                                </div>
                                {a.phone && (
                                  <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300 group/link">
                                    <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800 group-hover/link:border-action/30 transition-colors">
                                      <Phone className="size-3.5 md:size-4 text-action/70" />
                                    </div>
                                    <span>{a.phone}</span>
                                  </div>
                                )}
                                {(a.city || a.country) && (
                                  <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300 group/link">
                                    <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800 group-hover/link:border-action/30 transition-colors">
                                      <MapPin className="size-3.5 md:size-4 text-action/70" />
                                    </div>
                                    <span>{[a.city, a.country].filter(Boolean).join(", ")}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="space-y-4 md:space-y-5">
                              <div className="flex items-center gap-2">
                                <div className="size-1 bg-action rounded-full" />
                                <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Legal Specializations</h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {a.specialties?.split(",").map((s, idx) => (
                                  <span key={idx} className="rounded-sm border border-titanium-800 bg-titanium-900/50 px-2 md:px-2.5 py-1 md:py-1.5 font-mono text-[8px] md:text-[9px] uppercase tracking-widest text-titanium-200 transition-colors hover:border-action/30 hover:bg-titanium-900">
                                    {s.trim()}
                                  </span>
                                )) || <span className="text-xs text-titanium-500 italic">General Practice Law</span>}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-6">
                            <div className="rounded-lg bg-action/5 border border-action/10 p-4 md:p-6 space-y-3 md:space-y-4">
                              <div className="flex items-center gap-2 text-action">
                                <Award className="size-4" />
                                <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Network Verification</h4>
                              </div>
                              <p className="text-[13px] md:text-sm leading-relaxed text-titanium-300 italic">
                                "{a.full_name} is a verified senior member of the Justice Shield attorney network. They have undergone rigorous vetting for tactical legal defense capabilities."
                              </p>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedAttorneys.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-50">
                    <Info className="size-8 text-titanium-700" />
                    <p className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                      {search || specialtySearch ? "No matching attorneys" : "No attorneys registered"}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Call Method Modal */}
      <CallMethodModal
        isOpen={callModal.isOpen}
        onClose={() => setCallModal({ isOpen: false, attorney: null })}
        userName={callModal.attorney?.full_name || "Attorney"}
        phoneNumber={callModal.attorney?.phone || undefined}
        onBrowserCall={async () => {
          if (!callModal.attorney || !currentUser) return;
          const id1 = currentUser.id.replace(/-/g, "");
          const id2 = callModal.attorney.id.replace(/-/g, "");
          const roomId = [id1, id2].sort().join("");

          try {
            // 1. Create Call Log in DB
            const res = await fetch("/api/calls", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ room: roomId, receiverId: callModal.attorney.id, callType: "video" })
            });
            const { callLog } = await res.json();

            // 2. Navigate to Call
            const url = `/call/${roomId}?name=${encodeURIComponent(currentUser.full_name || currentUser.id || "Admin")}&type=video&callId=${callLog.id}&isCaller=true&receiverId=${callModal.attorney.id}`;
            window.location.href = url;
          } catch (err) {
            console.error("Failed to start call:", err);
            // Fallback
            const url = `/call/${roomId}?name=${encodeURIComponent(currentUser.full_name || currentUser.id || "Admin")}&type=video&isCaller=true&receiverId=${callModal.attorney.id}`;
            window.location.href = url;
          }
        }}
      />
    </div>
  );
}
