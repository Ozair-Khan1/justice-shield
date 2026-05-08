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
import { Search, MapPin, Globe } from "lucide-react";

interface UserRecord {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  country: string | null;
  membership_tier: string;
  created_at: string;
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
