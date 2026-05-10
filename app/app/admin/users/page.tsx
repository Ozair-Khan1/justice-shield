"use client";

import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Pagination } from "@/components/Pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MapPin, Globe, Phone, Mail, Award, User as UserIcon, BadgeInfo } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface UserRecord {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  membership_tier: string;
  created_at: string;
  case_stats?: {
    pending: number;
    active: number;
    assigned: number;
    resolved: number;
    rejected: number;
  };
  _count: {
    encounter_sessions: number;
    civil_intakes: number;
    emergency_alerts: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    fetch("/api/admin/users")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, countryFilter]);

  const countries = Array.from(new Set(users.map(u => u.country).filter(Boolean))).sort() as string[];

  const filtered = users.filter((u: UserRecord) => {
    const matchesSearch = u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCountry = countryFilter === "all" || u.country === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedUsers = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) return <LoadingScreen message="Loading Users..." />;

  return (
    <div className="space-y-8">
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-red-500">Admin</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight">All Users</h1>
        <p className="mt-2 text-sm text-titanium-400">{users.length} registered users</p>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm border border-titanium-700 bg-titanium-900 pl-10 pr-4 py-2.5 text-sm text-titanium-50 outline-none transition-colors focus:border-red-500"
          />
        </div>

        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-full sm:w-[200px] border-titanium-700 bg-titanium-900 text-titanium-300 font-mono text-[10px] uppercase tracking-widest h-[42px]">
            <Globe className="size-3.5 mr-2 text-titanium-500" />
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>
          <SelectContent className="border-titanium-800 bg-titanium-950 text-titanium-200">
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filtered.length}
        itemsPerPage={ITEMS_PER_PAGE}
      />

      <div className="overflow-x-auto rounded-sm border border-titanium-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-titanium-800 bg-titanium-900/60">
            <tr>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Name</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Email</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Role</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Location</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Tier</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Sessions</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Intakes</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Alerts</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Joined</th>
              <th className="px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-titanium-800/60">
            {paginatedUsers.map((u) => (
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
                <td className="px-4 py-3">
                  {u.country ? (
                    <div className="flex items-center gap-1.5 text-titanium-300 text-xs font-mono">
                      <MapPin className="size-3 text-titanium-500" />
                      {u.country}
                    </div>
                  ) : (
                    <span className="text-titanium-600">—</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs capitalize text-titanium-400">{u.membership_tier}</td>
                <td className="px-4 py-3 text-center font-mono text-xs text-titanium-400">{u._count.encounter_sessions}</td>
                <td className="px-4 py-3 text-center font-mono text-xs text-titanium-400">{u._count.civil_intakes}</td>
                <td className="px-4 py-3 text-center font-mono text-xs text-titanium-400">{u._count.emergency_alerts}</td>
                <td className="px-4 py-3 font-mono text-xs text-titanium-500">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
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
                          <div className={`rounded-full border px-2 md:px-3 py-0.5 md:py-1 font-mono text-[8px] md:text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm ${u.role === "ADMIN" ? "border-red-500/20 bg-red-500/5 text-red-400" : u.role === "ATTORNEY" ? "border-blue-500/20 bg-blue-500/5 text-blue-400" : "border-titanium-500/20 bg-titanium-500/5 text-titanium-400"}`}>
                            {u.role}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 md:p-8 pt-12 md:pt-14 space-y-6 md:space-y-8">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                          <div className="space-y-1">
                            <DialogTitle className="font-display text-2xl md:text-3xl font-bold text-titanium-50 tracking-tight">
                              {u.full_name || "User"}
                            </DialogTitle>
                            <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-action/80">
                              {u.membership_tier} Member
                            </p>
                          </div>
                          <div className="flex flex-col md:flex-row items-center md:items-end gap-3 md:gap-4">
                            <div className="flex flex-col items-center md:items-end">
                              <span className="font-mono text-lg md:text-xl font-bold text-titanium-50 leading-none">{u._count.civil_intakes + u._count.encounter_sessions}</span>
                              <span className="font-mono text-[7px] md:text-[8px] uppercase tracking-widest text-titanium-500 mt-1">Total Cases</span>
                            </div>
                            <div className="size-1 bg-titanium-800 rounded-full hidden md:block" />
                            <div className="flex flex-col items-center md:items-end">
                              <div className="font-mono text-lg md:text-base font-bold text-red-500 leading-none">{u._count.emergency_alerts}</div>
                              <div className="font-mono text-[7px] uppercase tracking-widest text-red-500/70 mt-1">SOS Alerts</div>
                            </div>
                          </div>
                        </div>

                        {u.case_stats && (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-y border-titanium-800/50 py-4">
                            <div className="flex flex-col items-center p-2 rounded bg-titanium-900/30 border border-titanium-800/50">
                              <span className="font-mono text-lg font-bold text-amber-500">{u.case_stats.pending}</span>
                              <span className="font-mono text-[8px] uppercase tracking-widest text-titanium-500 mt-1">Pending</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded bg-titanium-900/30 border border-titanium-800/50">
                              <span className="font-mono text-lg font-bold text-action">{u.case_stats.active}</span>
                              <span className="font-mono text-[8px] uppercase tracking-widest text-titanium-500 mt-1">Active</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded bg-titanium-900/30 border border-titanium-800/50">
                              <span className="font-mono text-lg font-bold text-blue-500">{u.case_stats.assigned}</span>
                              <span className="font-mono text-[8px] uppercase tracking-widest text-titanium-500 mt-1">Assigned</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded bg-titanium-900/30 border border-titanium-800/50">
                              <span className="font-mono text-lg font-bold text-emerald-500">{u.case_stats.resolved}</span>
                              <span className="font-mono text-[8px] uppercase tracking-widest text-titanium-500 mt-1">Resolved</span>
                            </div>
                            <div className="flex flex-col items-center p-2 rounded bg-titanium-900/30 border border-titanium-800/50">
                              <span className="font-mono text-lg font-bold text-red-500">{u.case_stats.rejected}</span>
                              <span className="font-mono text-[8px] uppercase tracking-widest text-titanium-500 mt-1">Rejected</span>
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
                                <span className="truncate">{u.email}</span>
                              </div>
                              {u.phone && (
                                <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300 group/link">
                                  <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800 group-hover/link:border-action/30 transition-colors">
                                    <Phone className="size-3.5 md:size-4 text-action/70" />
                                  </div>
                                  <span>{u.phone}</span>
                                </div>
                              )}
                              {(u.city || u.country) && (
                                <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300 group/link">
                                  <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800 group-hover/link:border-action/30 transition-colors">
                                    <MapPin className="size-3.5 md:size-4 text-action/70" />
                                  </div>
                                  <span>{[u.city, u.country].filter(Boolean).join(", ")}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="space-y-4 md:space-y-5">
                            <div className="flex items-center gap-2">
                              <div className="size-1 bg-action rounded-full" />
                              <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-500">Account Details</h4>
                            </div>
                            <div className="space-y-3 md:space-y-4">
                              <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300">
                                <span className="font-mono text-[10px] uppercase text-titanium-500">Joined:</span>
                                <span>{new Date(u.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          <div className="rounded-lg bg-action/5 border border-action/10 p-4 md:p-6 space-y-3 md:space-y-4">
                            <div className="flex items-center gap-2 text-action">
                              <Award className="size-4" />
                              <h4 className="font-mono text-[10px] font-bold uppercase tracking-widest">Platform Membership</h4>
                            </div>
                            <p className="text-[13px] md:text-sm leading-relaxed text-titanium-300 italic">
                              "{u.full_name || "This user"} is a registered member of the Justice Shield platform with a {u.membership_tier} tier membership."
                            </p>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-titanium-500">
                  {search ? "No matching users" : "No users yet"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
