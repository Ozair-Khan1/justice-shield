"use client";

import { useEffect, useState } from "react";
import { Search, Briefcase, Mail, Phone, Scale, ShieldCheck } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BadgeInfo, MapPin, Award, BookOpen, User as UserIcon } from "lucide-react";

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
  total_cases: number;
  resolved_cases: number;
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
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;

  const isFree = user?.role === "USER" && user?.membership_tier === "free" && user?.stripe_customer_id === null && user?.stripe_subscription_id === null && user?.subscription_cancel_at === null;


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

  useEffect(() => {
    setCurrentPage(1);
  }, [search, specialtySearch, citySearch, countrySearch]);

  const filtered = attorneys.filter(
    (a) =>
      ((a.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())) &&
      (a.specialties ?? "").toLowerCase().includes(specialtySearch.toLowerCase()) &&
      (a.city ?? "").toLowerCase().includes(citySearch.toLowerCase()) &&
      (a.country ?? "").toLowerCase().includes(countrySearch.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedAttorneys = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return <LoadingScreen message="Loading Attorney Network..." />
  }

  return (
    <div className="space-y-12">
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">Resource Center</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Attorney Network</h1>
        <p className="mt-4 max-w-2xl text-titanium-400">
          Our network of verified legal professionals. Search by name, email, or legal specialty to find the right counsel for your situation.
        </p>
      </header>

      <div className="flex flex-col gap-4 w-full">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
            <input
              type="text"
              placeholder="Search Name/Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-sm border border-titanium-700 bg-titanium-900 py-3 md:py-4 pl-10 pr-4 text-xs text-titanium-50 outline-none transition-colors focus:border-action"
            />
          </div>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-titanium-500" />
            <input
              type="text"
              placeholder="Legal Specialty..."
              value={specialtySearch}
              onChange={(e) => setSpecialtySearch(e.target.value)}
              className="w-full rounded-sm border border-titanium-700 bg-titanium-900 py-3 md:py-4 pl-10 pr-4 text-xs text-titanium-50 outline-none transition-colors focus:border-action"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-2">
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
              className={`h-full border-titanium-800 bg-titanium-900/50 font-mono text-[9px] uppercase tracking-widest px-2 ${countrySearch === user?.country && user?.country ? "text-action border-action/50" : "text-titanium-500"}`}
            >
              <span className="truncate">Country {user?.country ? `(${user.country})` : ""}</span>
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
              className={`h-full border-titanium-800 bg-titanium-900/50 font-mono text-[9px] uppercase tracking-widest px-2 ${citySearch === user?.city && user?.city ? "text-action border-action/50" : "text-titanium-500"}`}
            >
              <span className="truncate">City {user?.city ? `(${user.city})` : ""}</span>
            </Button>
          </div>
        </div>

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
            className="w-fit h-auto py-1 px-0 font-mono text-[9px] uppercase tracking-widest text-titanium-600 hover:text-titanium-400"
          >
            Reset All Filters
          </Button>
        )}

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
        <LoadingScreen message="Syncing Network..." />
      ) : (
        <div className="space-y-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedAttorneys.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative flex flex-col rounded-lg border border-titanium-800 bg-titanium-900/40 p-6 transition-all hover:border-action/40 hover:bg-titanium-900/60 hover:glow-action/5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-action/10 p-2 text-action">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <h3 className="font-display text-lg font-bold text-titanium-50 group-hover:text-action transition-colors leading-tight">
                        {a.full_name || "Verified Attorney"}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2">
                        {a.firm_name && (
                          <div className="font-mono text-[8px] font-bold uppercase tracking-widest text-titanium-500">
                            {a.firm_name}
                          </div>
                        )}
                        {a.years_experience !== null && (
                          <div className="font-mono text-[9px] font-bold text-action/60 uppercase tracking-widest">
                            {a.years_experience} Yrs Exp
                            {a.total_cases > 0 && (
                              <span className="ml-1 text-titanium-500">• {a.total_cases} Total</span>
                            )}
                            {a.resolved_cases > 0 && (
                              <span className="ml-1 text-emerald-500/80">• {a.resolved_cases} Resolved</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 border-titanium-800 bg-titanium-950/50 hover:border-action/50 hover:text-action transition-all min-w-[35px]"
                      >
                        <BadgeInfo className="size-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto border-titanium-800 bg-titanium-950 p-0 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] scrollbar-hide">
                      <div className="relative h-24 md:h-32 bg-linear-to-r from-action/20 via-titanium-900 to-titanium-950 border-b border-titanium-800">
                        <div className="absolute -bottom-10 left-4 md:left-8 rounded-full border-4 border-titanium-950 bg-titanium-900 p-3 md:p-4 text-action shadow-2xl">
                          <UserIcon className="size-8 md:size-12" />
                        </div>
                        <div className="absolute top-4 right-4 flex gap-2">
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
                              <div className="size-1 bg-titanium-800 rounded-full md:hidden" />
                              <div className="flex flex-col items-center md:items-end">
                                <div className="font-mono text-lg md:text-base font-bold text-titanium-50 leading-none">{a.total_cases}</div>
                                <div className="font-mono text-[7px] uppercase tracking-widest text-titanium-500 mt-1">Total Cases</div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 border-y border-titanium-800/50 py-6 md:py-8">
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
                          {a.resolved_cases > 0 && (
                            <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                  <ShieldCheck className="size-4" />
                                </div>
                                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">Success Metric</div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono text-xl font-bold text-emerald-400 leading-none">{a.resolved_cases}</div>
                                <div className="font-mono text-[7px] uppercase tracking-widest text-emerald-500/70 mt-1">Cases Resolved</div>
                              </div>
                            </div>
                          )}

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

                <div className="mt-6 flex-grow space-y-3">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-tight text-titanium-500">
                    <Mail className="size-3 text-titanium-600" />
                    <span>{a.email}</span>
                  </div>
                  {(a.city || a.country) && (
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-tight text-action/70">
                      <MapPin className="size-3 text-action/50" />
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
        </div>
      )}
    </div>
  );
}
