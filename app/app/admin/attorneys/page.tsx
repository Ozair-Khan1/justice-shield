"use client";

import { useEffect, useState } from "react";
import { Search, Scale, Briefcase, Mail, Phone, Info } from "lucide-react";
import { useLoading } from "@/components/LoadingProvider";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Pagination } from "@/components/Pagination";

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
  created_at: string;
  _count: {
    encounter_sessions: number;
    civil_intakes: number;
  };
}

export default function AdminAttorneysPage() {
  const [attorneys, setAttorneys] = useState<AttorneyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
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
    </div>
  );
}
