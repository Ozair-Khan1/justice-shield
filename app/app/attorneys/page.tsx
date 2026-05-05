"use client";

import { useEffect, useState } from "react";
import { Search, Briefcase, Mail, Phone, Scale, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface Attorney {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  firm_name: string | null;
  specialties: string | null;
  years_experience: number | null;
  city: string | null;
  country: string | null;
}

export default function AttorneyDirectoryPage() {
  const { user, refreshUser } = useAuth();
  const [attorneys, setAttorneys] = useState<Attorney[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialtySearch, setSpecialtySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/attorneys")
      .then((res) => res.json())
      .then((data) => {
        setAttorneys(data.attorneys ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    refreshUser();
  }, []);

  const filtered = attorneys.filter(
    (a) =>
      ((a.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())) &&
      (a.specialties ?? "").toLowerCase().includes(specialtySearch.toLowerCase()) &&
      (a.city ?? "").toLowerCase().includes(citySearch.toLowerCase()) &&
      (a.country ?? "").toLowerCase().includes(countrySearch.toLowerCase())
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

      <div className="flex flex-col gap-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
            <input
              type="text"
              placeholder="Search Name/Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-sm border border-titanium-700 bg-titanium-900 py-4 pl-10 pr-4 text-xs text-titanium-50 outline-none transition-colors focus:border-action"
            />
          </div>
          <div className="relative lg:col-span-1">
            <Briefcase className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
            <input
              type="text"
              placeholder="Legal Specialty..."
              value={specialtySearch}
              onChange={(e) => setSpecialtySearch(e.target.value)}
              className="w-full rounded-sm border border-titanium-700 bg-titanium-900 py-4 pl-10 pr-4 text-xs text-titanium-50 outline-none transition-colors focus:border-action"
            />
          </div>
          <div className="flex gap-2 lg:col-span-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!user?.country) {
                  setLocationError(`Please set your Country in Account Settings first.`);
                  return;
                }
                setLocationError(null);
                setCountrySearch(user.country);
              }}
              className={`flex-1 h-full border-titanium-800 bg-titanium-900/50 font-mono text-[9px] uppercase tracking-widest ${countrySearch === user?.country && user?.country ? "text-action border-action/50" : "text-titanium-500"}`}
            >
              Filter by Country {user?.country ? `(${user.country})` : ""}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!user?.city) {
                  setLocationError("Please set your City in Account Settings first.");
                  return;
                }
                setLocationError(null);
                setCitySearch(user.city);
              }}
              className={`flex-1 h-full border-titanium-800 bg-titanium-900/50 font-mono text-[9px] uppercase tracking-widest ${citySearch === user?.city && user?.city ? "text-action border-action/50" : "text-titanium-500"}`}
            >
              Filter by City {user?.city ? `(${user.city})` : ""}
            </Button>
            {(citySearch !== "" || countrySearch !== "" || specialtySearch !== "" || search !== "") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearch("");
                  setSpecialtySearch("");
                  setCitySearch("");
                  setCountrySearch("");
                  setLocationError(null);
                }}
                className="h-full px-4 font-mono text-[9px] uppercase tracking-widest text-titanium-600 hover:text-titanium-400"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {locationError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between rounded-sm border border-red-500/20 bg-red-500/5 px-4 py-2"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-red-400">
                {locationError}
              </p>
              <Button
                asChild
                variant="link"
                className="h-auto p-0 font-mono text-[10px] uppercase tracking-widest text-action hover:text-action/80"
              >
                <Link href="/app/account">Go to Settings</Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
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
                {(a.city || a.country) && (
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-tight text-action/70">
                    <Scale className="size-3 text-action/50" />
                    <span>{[a.city, a.country].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
              {a.specialties && (
                <div className="mt-4 rounded-sm bg-titanium-950/50 p-3">
                  <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-titanium-500 mb-1">Specialties</div>
                  <p className="text-xs text-titanium-300 line-clamp-3">
                    {a.specialties}
                  </p>
                </div>
              )}
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-lg border border-dashed border-titanium-800 p-20 text-center">
              <Scale className="mx-auto size-10 text-titanium-800" />
              <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                No matching legal professionals found
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSpecialtySearch("");
                  setCitySearch("");
                  setCountrySearch("");
                }}
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
