"use client";

import { useEffect, useState } from "react";
import { Search, Briefcase, Mail, Phone, Scale, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface Attorney {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  firm_name: string | null;
  specialties: string | null;
  years_experience: number | null;
}

export default function AttorneyDirectoryPage() {
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtySearch, setSpecialtySearch] = useState("");

  useEffect(() => {
    fetch("/api/attorneys")
      .then((res) => res.json())
      .then((data) => {
        setAttorneys(data.attorneys ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = attorneys.filter(
    (a) =>
      ((a.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())) &&
      (a.specialties ?? "").toLowerCase().includes(specialtySearch.toLowerCase())
  );

  return (
    <div className="space-y-12">
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">Resource Center</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Attorney Network</h1>
        <p className="mt-4 max-w-2xl text-titanium-400">
          Our network of verified legal professionals. Search by name, email, or legal specialty to find the right counsel for your situation.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-sm border border-titanium-700 bg-titanium-900 py-4 pl-10 pr-4 text-sm text-titanium-50 outline-none transition-colors focus:border-action"
          />
        </div>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
          <input
            type="text"
            placeholder="Filter by specialty (e.g. Civil Rights, DUI)..."
            value={specialtySearch}
            onChange={(e) => setSpecialtySearch(e.target.value)}
            className="w-full rounded-sm border border-titanium-700 bg-titanium-900 py-4 pl-10 pr-4 text-sm text-titanium-50 outline-none transition-colors focus:border-action"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <span className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 animate-pulse">Syncing Network...</span>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group relative flex flex-col rounded-lg border border-titanium-800 bg-titanium-900/40 p-6 transition-all hover:border-action/40 hover:bg-titanium-900/60 hover:glow-action/5"
            >
              <div className="flex items-start justify-between">
                <div className="rounded-full bg-action/10 p-2 text-action">
                  <ShieldCheck className="size-5" />
                </div>
                <div className="text-right">
                  {a.firm_name && (
                    <div className="font-mono text-[8px] font-bold uppercase tracking-widest text-titanium-500">
                      {a.firm_name}
                    </div>
                  )}
                  {a.years_experience !== null && (
                    <div className="mt-1 font-mono text-[10px] font-bold text-action/60 uppercase tracking-widest">
                      {a.years_experience} Yrs Exp
                    </div>
                  )}
                </div>
              </div>

              <h3 className="mt-4 font-display text-xl font-bold text-titanium-50 group-hover:text-action transition-colors">
                {a.full_name || "Verified Attorney"}
              </h3>

              <div className="mt-4 flex-grow space-y-3">
                <div className="flex items-center gap-2 text-xs text-titanium-400">
                  <Mail className="size-3.5 text-titanium-500" />
                  <span>{a.email}</span>
                </div>
                {a.phone && (
                  <div className="flex items-center gap-2 text-xs text-titanium-400">
                    <Phone className="size-3.5 text-titanium-500" />
                    <span>{a.phone}</span>
                  </div>
                )}
                {a.specialties && (
                  <div className="mt-4 rounded-sm bg-titanium-950/50 p-3">
                    <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-titanium-500 mb-1">Specialties</div>
                    <p className="text-xs text-titanium-300 line-clamp-3">
                      {a.specialties}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-titanium-800 p-20 text-center">
              <Scale className="mx-auto size-10 text-titanium-800" />
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                No matching legal professionals found
              </p>
              <button
                onClick={() => { setSearch(""); setSpecialtySearch(""); }}
                className="mt-4 text-xs text-action hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
