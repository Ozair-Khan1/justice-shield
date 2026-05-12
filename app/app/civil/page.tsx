"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2, CheckCircle2, Save, User as UserIcon, Scale, ShieldCheck, ChevronRight, MapPin, BadgeInfo, Mail, Phone, Award, X } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { LoadingScreen } from "@/components/LoadingScreen";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const MATTER_TYPES = [
  { id: "landlord_tenant", label: "Landlord / Tenant" },
  { id: "employment", label: "Employment & Wages" },
  { id: "personal_injury", label: "Personal Injury" },
  { id: "bankruptcy", label: "Bankruptcy" },
  { id: "contracts", label: "Contracts" },
  { id: "small_claims", label: "Small Claims" },
  { id: "family", label: "Family Matters" },
  { id: "consumer", label: "Consumer / Debt" },
  { id: "other", label: "Other" },
];

interface Attorney {
  id: string;
  full_name: string | null;
  email: string;
  firm_name: string | null;
  specialties: string | null;
  years_experience: number | null;
  city: string | null;
  country: string | null;
  total_cases?: number;
  resolved_cases?: number;
}

export default function CivilIntakePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [matterType, setMatterType] = useState("landlord_tenant");
  const [urgency, setUrgency] = useState("standard");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [opposingParty, setOpposingParty] = useState("");
  const [opposingPartyLocation, setOpposingPartyLocation] = useState("");
  const [preferredContact, setPreferredContact] = useState("phone");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [locationError, setLocationError] = useState<boolean>(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  const [availableAttorneys, setAvailableAttorneys] = useState<Attorney[]>([]);
  const [loadingAttorneys, setLoadingAttorneys] = useState(false);
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const draftIdParam = searchParams.get("draft");

  useEffect(() => {
    refreshUser()
  }, [])

  useEffect(() => {
    if (draftIdParam && !draftId) {
      const fetchDraft = async () => {
        try {
          const res = await fetch(`/api/civil/intake/${draftIdParam}`);
          const data = await res.json();
          if (data.intake) {
            const { intake } = data;
            setMatterType(intake.matter_type);
            setUrgency(intake.urgency);
            setSubject(intake.subject);
            setDescription(intake.description);
            setOpposingParty(intake.opposing_party || "");
            setOpposingPartyLocation(intake.opposing_party_location || "");
            setPreferredContact(intake.preferred_contact);
            setMetadata(intake.metadata as any || {});
            setDraftId(intake.id);

            if (searchParams.get("step") === "2") {
              setStep(2);
              // Also trigger attorney fetch
              setLoadingAttorneys(true);
              // Use intake.user if available (now returned by API), fallback to auth user
              const locationCity = intake.user?.city || user?.city;
              const locationCountry = intake.user?.country || user?.country;
              const locationParams = [];
              if (locationCity) locationParams.push(`city=${encodeURIComponent(locationCity)}`);
              if (locationCountry) locationParams.push(`country=${encodeURIComponent(locationCountry)}`);
              const specialtyParam = intake.matter_type !== "other" ? `specialty=${intake.matter_type}` : "";
              const queryString = [specialtyParam, ...locationParams].filter(Boolean).join("&");
              const url = `/api/attorneys${queryString ? `?${queryString}` : ""}`;
              const attRes = await fetch(url);
              const attData = await attRes.json();
              setAvailableAttorneys(attData.attorneys || []);
              setLoadingAttorneys(false);
            }
          }
        } catch (err) {
          console.error("Failed to load draft:", err);
        }
      };
      fetchDraft();
    }
  }, [draftIdParam, draftId, user]);
  const handleMetadataChange = (key: string, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (!subject) {
        throw new Error("Please enter a subject")
      } else if (subject.trim().length < 4) {
        throw new Error("Subject must be at least 4 characters long");
      }
      if (!description) {
        throw new Error("Description is required")
      } else if (description.trim().length < 10) {
        throw new Error("Description must be at least 10 characters long");
      }
      if (!user) throw new Error("You must be logged in.");
      if (!user?.city || !user?.country) {
        setLocationError(true);
        return
      };

      setError(null);
      setSubmitting(true);
      setLoading(true);
      // Fetch attorneys based on matter type + user location (both required)
      setLoadingAttorneys(true);
      const locationParams = [];
      if (user?.city) locationParams.push(`city=${encodeURIComponent(user.city)}`);
      if (user?.country) locationParams.push(`country=${encodeURIComponent(user.country)}`);
      const specialtyParam = matterType !== "other" ? `specialty=${matterType}` : "";
      const queryString = [specialtyParam, ...locationParams].filter(Boolean).join("&");
      const url = `/api/attorneys${queryString ? `?${queryString}` : ""}`;
      const attRes = await fetch(url);
      const attData = await attRes.json();

      const attorneys = attData.attorneys || [];

      setAvailableAttorneys(attorneys);
      setLoadingAttorneys(false);

      // Save as draft
      const res = await fetch("/api/civil/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftId,
          matterType: matterType.toLowerCase(),
          urgency,
          subject,
          description,
          preferredContact,
          metadata,
          opposingParty,
          opposingPartyLocation,
          status: "draft"
        }),
      });
      const data = await res.json();
      if (data.intake?.id) {
        setDraftId(data.intake.id);
        toast.success("Draft saved", { description: "Your case has been saved as a draft." });
      }

      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth', });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const handleAssignAttorney = async (attorneyId: string | null) => {
    setSubmitting(true);
    setLoading(true);
    try {
      const res = await fetch("/api/civil/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftId,
          matterType: matterType.toLowerCase(),
          urgency,
          subject,
          description,
          preferredContact,
          metadata,
          assignedAttorneyId: attorneyId,
          opposingParty,
          opposingPartyLocation,
          status: attorneyId === null ? "pending" : "assigned"
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit intake");

      router.push("/app/history");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    try {
      const res = await fetch("/api/civil/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: draftId,
          matterType: matterType.toLowerCase(),
          urgency,
          subject,
          description,
          preferredContact,
          metadata,
          opposingParty,
          opposingPartyLocation,
          status: "draft"
        }),
      });
      const data = await res.json();
      if (data.intake?.id) {
        setDraftId(data.intake.id);
        toast.success("Draft saved", { duration: 2000, description: "Your case has been saved as a draft in cases dashboard." });
      } else {
        toast.error("Failed to save draft", { description: "Please try again." });
      }
    } catch (err) {
      console.error("Failed to save draft:", err);
      toast.error("Failed to save draft", { description: "An unexpected error occurred." });
    }
  }

  if (loading) {
    return (
      <LoadingScreen />
    )
  }

  if (step === 2) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-12 max-w-4xl mx-auto"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto size-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="size-8 text-emerald-500" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Intake <span className="text-emerald-500">Received.</span></h1>
          <p className="text-titanium-400 max-w-md mx-auto">
            Your case has been securely logged. To expedite your response, you can select a specialized attorney below or leave it to our administrators.
          </p>
        </div>

        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-titanium-500">
              {availableAttorneys.length > 0 ? "Recommended Specialists" : "Attorney Network"}
            </h2>
            <Badge variant="outline" className="text-action border-action/20 font-mono text-[9px] uppercase tracking-widest bg-action/5">
              {matterType.replace("_", " ")}
            </Badge>
          </div>

          <div className="grid gap-4">
            {loadingAttorneys ? (
              <div className="p-12 text-center border border-dashed border-titanium-800 rounded-lg">
                <Loader2 className="size-6 animate-spin mx-auto text-action opacity-50" />
                <p className="mt-4 font-mono text-[10px] text-titanium-500 uppercase tracking-widest">Scanning Network for Specialists...</p>
              </div>
            ) : availableAttorneys.length > 0 ? (
              availableAttorneys.map((attorney) => (
                <Card key={attorney.id} className="group border-titanium-800 bg-titanium-900/40 hover:border-action/30 transition-all cursor-pointer overflow-hidden" onClick={() => handleAssignAttorney(attorney.id)}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div className="flex items-start sm:items-center gap-5">
                        <div className="size-12 rounded-full bg-titanium-950 flex items-center justify-center border border-titanium-800 group-hover:border-action/50 transition-colors shrink-0">
                          <UserIcon className="size-6 text-titanium-400 group-hover:text-action transition-colors" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-display text-lg font-bold text-titanium-50 group-hover:text-action transition-colors truncate">{attorney.full_name}</h3>
                          <p className="text-sm text-titanium-400 truncate">{attorney.firm_name || "Independent Network Counsel"}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] uppercase tracking-wider">
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-titanium-800/30 border border-titanium-800">
                              <span className="text-titanium-400">{attorney.years_experience || 0}Y Exp.</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                              <span className="text-emerald-500/80">{attorney.resolved_cases || 0} Resolved</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-titanium-800/30 border border-titanium-800">
                              <span className="text-titanium-400">{attorney.total_cases || 0} Total</span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="font-mono text-[9px] uppercase tracking-widest text-action/70 bg-action/5 border border-action/10 px-2 py-0.5 rounded-sm">
                              {attorney.specialties || "Generalist"}
                            </span>
                          </div>
                          {(attorney.city || attorney.country) && (
                            <div className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-tight text-titanium-600">
                              <MapPin className="size-3" />
                              <span className="truncate">{[attorney.city, attorney.country].filter(Boolean).join(", ")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 border-t border-titanium-800/50 sm:border-none pt-4 sm:pt-0">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={(e) => e.stopPropagation()}
                              className="size-10 border-titanium-800 bg-titanium-950/50 hover:border-action/50 hover:text-action transition-all shrink-0"
                            >
                              <BadgeInfo className="size-5" />
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto border-titanium-800 bg-titanium-950 p-0 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] scrollbar-hide text-left">
                            <div className="relative h-24 md:h-32 bg-gradient-to-r from-action/20 via-titanium-900 to-titanium-950 border-b border-titanium-800">
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
                                    {attorney.full_name}
                                  </DialogTitle>
                                  <p className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em] text-action/80">
                                    {attorney.firm_name || "Independent Legal Professional"}
                                  </p>
                                </div>
                                {attorney.years_experience !== null && (
                                  <div className="flex md:flex-col items-center md:items-end gap-3 md:gap-1">
                                    <div className="flex flex-col items-center md:items-end">
                                      <span className="font-mono text-lg md:text-xl font-bold text-titanium-50 leading-none">{attorney.years_experience}</span>
                                      <span className="font-mono text-[7px] md:text-[8px] uppercase tracking-widest text-titanium-500 mt-1">Years Practice</span>
                                    </div>
                                    <div className="size-1 bg-titanium-800 rounded-full md:hidden" />
                                    <div className="flex flex-col items-center md:items-end">
                                      <div className="font-mono text-lg md:text-base font-bold text-titanium-50 leading-none">{attorney.total_cases || 0}</div>
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
                                      <span className="truncate">{attorney.email}</span>
                                    </div>
                                    {(attorney.city || attorney.country) && (
                                      <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300 group/link">
                                        <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800 group-hover/link:border-action/30 transition-colors">
                                          <MapPin className="size-3.5 md:size-4 text-action/70" />
                                        </div>
                                        <span>{[attorney.city, attorney.country].filter(Boolean).join(", ")}</span>
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
                                    {attorney.specialties?.split(",").map((s: string, idx: number) => (
                                      <span key={idx} className="rounded-sm border border-titanium-800 bg-titanium-900/50 px-2 md:px-2.5 py-1 md:py-1.5 font-mono text-[8px] md:text-[9px] uppercase tracking-widest text-titanium-200 transition-colors hover:border-action/30 hover:bg-titanium-900">
                                        {s.trim()}
                                      </span>
                                    )) || <span className="text-xs text-titanium-500 italic">General Practice Law</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-6">
                                {(attorney.resolved_cases ?? 0) > 0 && (
                                  <div className="flex items-center justify-between rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                        <ShieldCheck className="size-4" />
                                      </div>
                                      <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-emerald-400">Success Metric</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-mono text-xl font-bold text-emerald-400 leading-none">{attorney.resolved_cases}</div>
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
                                    "{attorney.full_name} is a verified senior member of the Justice Shield attorney network. They have undergone rigorous vetting for tactical legal defense capabilities."
                                  </p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="ghost" className="text-titanium-600 group-hover:text-action group-hover:translate-x-1 transition-all">
                          Assign <ChevronRight className="size-4 ml-1" />
                        </Button>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-titanium-800 rounded-lg bg-titanium-950/20">
                <p className="text-sm text-titanium-500">No attorneys found for this specialty in your City/Country. Let an admin handle it.</p>
              </div>
            )}

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-titanium-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase font-mono tracking-widest">
                <span className="bg-background px-4 text-titanium-500">Or</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => handleAssignAttorney(null)}
              className="w-full h-16 border-titanium-800 bg-titanium-950/50 hover:bg-titanium-900 hover:border-titanium-700 text-titanium-400 font-mono text-[10px] uppercase tracking-widest"
            >
              <ShieldCheck className="size-4 mr-2 text-action" />
              Let Admin Dispatch
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <header className="space-y-6">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">Resource Center</span>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            File a <span className="text-titanium-500">civil intake.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-titanium-400 leading-relaxed">
            Submit non-urgent civil matters here. A vetted attorney will reach out within 4 hours (urgent) or 24 hours (standard).
          </p>
        </div>
      </header>
      <form onSubmit={onSubmit} className="grid gap-8 rounded-lg border border-titanium-800 bg-titanium-900/40 p-6 sm:p-8 mx-auto">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Matter Type</span>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {MATTER_TYPES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setMatterType(m.id); setMetadata({}); }}
                className={`rounded-sm border px-3 py-2.5 text-left text-sm transition-colors ${matterType === m.id
                  ? "border-action bg-action/10 text-action"
                  : "border-titanium-700 bg-titanium-900 text-titanium-300 hover:border-titanium-500"
                  }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Matter Specific Fields (Maintained for functionality) */}
        <AnimatePresence mode="wait">
          {(matterType === "landlord_tenant" || matterType === "employment") && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="grid gap-6 sm:grid-cols-2 p-4 rounded-sm border border-titanium-800/40 bg-titanium-900/20"
            >
              {matterType === "landlord_tenant" && (
                <>
                  <div className="sm:col-span-2 space-y-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Property Address</span>
                    <input
                      placeholder="123 Legal Way, Suite 4..."
                      className="w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action"
                      onChange={(e) => handleMetadataChange("property_address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Landlord Name</span>
                    <input
                      className="w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action"
                      onChange={(e) => handleMetadataChange("landlord_name", e.target.value)}
                    />
                  </div>
                </>
              )}
              {matterType === "employment" && (
                <>
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Employer Name</span>
                    <input
                      className="w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action"
                      onChange={(e) => handleMetadataChange("employer_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Start Date</span>
                    <input
                      type="date"
                      className="w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action [color-scheme:dark]"
                      onChange={(e) => handleMetadataChange("employment_start_date", e.target.value)}
                    />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Urgency</span>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { id: "urgent", label: "Urgent · 4h" },
              { id: "standard", label: "Standard · 24h" },
              { id: "routine", label: "Routine · 3d" }
            ].map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setUrgency(u.id)}
                className={`rounded-sm border px-3 py-2.5 font-mono text-[11px] uppercase tracking-widest transition-colors ${urgency === u.id
                  ? "border-action bg-action/10 text-action"
                  : "border-titanium-700 bg-titanium-900 text-titanium-400 hover:border-titanium-500"
                  }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Subject <span className="text-red-500">*</span></span>
          <input
            placeholder="e.g. Landlord refuses to return security deposit"
            className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Opposing Party</span>
            <input
              placeholder="Full Name or Entity"
              className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action"
              type="text"
              value={opposingParty}
              onChange={(e) => setOpposingParty(e.target.value)}
            />
          </div>
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Opposing Party Location (City / State)</span>
            <input
              placeholder="e.g. Los Angeles, CA"
              className="mt-2 w-full rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm outline-none focus:border-action"
              type="text"
              value={opposingPartyLocation}
              onChange={(e) => setOpposingPartyLocation(e.target.value)}
            />
          </div>
        </div>

        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Describe the situation <span className="text-red-500">*</span></span>
          <textarea
            rows={6}
            placeholder="Include dates, parties involved, and what outcome you're seeking..."
            className="mt-2 w-full resize-y rounded-sm border border-titanium-700 bg-titanium-900 px-4 py-3 text-sm leading-relaxed outline-none focus:border-action"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          ></textarea>
        </div>

        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Preferred Contact</span>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              { id: "phone", label: "Phone Call" },
              { id: "email", label: "Email" }
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setPreferredContact(c.id)}
                className={`rounded-sm border px-3 py-2.5 text-sm transition-colors ${preferredContact === c.id
                  ? "border-action bg-action/10 text-action"
                  : "border-titanium-700 bg-titanium-900 text-titanium-300 hover:border-titanium-500"
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-sm border border-destructive/40 bg-destructive/10 p-4 font-mono text-[11px] text-destructive">
            {error}
          </div>
        )}

        <AnimatePresence>
          {locationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-sm border border-action/20 bg-action/5 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-action animate-pulse" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-titanium-400">
                  Please set your city/country to match with local counsel.
                </p>
              </div>
              <Button
                asChild
                variant="link"
                className="h-auto p-0 font-mono text-[10px] uppercase tracking-widest text-action hover:text-action/80"
              >
                <Link href="/app/account" onClick={() => saveDraft()}>Go to Settings</Link>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={submitting}
          className="rounded-sm bg-action px-6 py-4 text-sm font-bold uppercase tracking-widest text-action-foreground transition-colors hover:bg-action/90 disabled:opacity-50"
        >
          {submitting ? "Submitting Intake..." : "Submit Intake →"}
        </button>
      </form>
    </div>
  );
}
