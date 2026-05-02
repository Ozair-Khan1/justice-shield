"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Loader2, CheckCircle2, User as UserIcon, Scale, ShieldCheck, ChevronRight } from "lucide-react";

const MATTER_TYPES = [
  { id: "landlord_tenant", label: "Landlord / Tenant" },
  { id: "employment", label: "Employment & Wages" },
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
}

export default function CivilIntakePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [matterType, setMatterType] = useState("landlord_tenant");
  const [urgency, setUrgency] = useState("standard");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [preferredContact, setPreferredContact] = useState("phone");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [metadata, setMetadata] = useState<Record<string, string>>({});

  const [submittedIntakeId, setSubmittedIntakeId] = useState<string | null>(null);
  const [availableAttorneys, setAvailableAttorneys] = useState<Attorney[]>([]);
  const [loadingAttorneys, setLoadingAttorneys] = useState(false);

  const handleMetadataChange = (key: string, value: string) => {
    setMetadata(prev => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      if (!subject) throw new Error("Please enter a subject");
      if (!description) throw new Error("Description is required");
      if (!user) throw new Error("You must be logged in.");

      setError(null);
      setSubmitting(true);

      const res = await fetch("/api/civil/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matterType,
          urgency,
          subject,
          description,
          preferredContact,
          metadata,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit intake");

      setSubmittedIntakeId(data.intake.id);

      // Fetch attorneys based on matter type (if other, fetch all)
      setLoadingAttorneys(true);
      const url = matterType === "other" ? "/api/attorneys" : `/api/attorneys?specialty=${matterType}`;
      const attRes = await fetch(url);
      const attData = await attRes.json();
      setAvailableAttorneys(attData.attorneys || []);
      setLoadingAttorneys(false);

      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAttorney = async (attorneyId: string | null) => {
    if (!submittedIntakeId) return;

    setSubmitting(true);
    try {
      if (attorneyId) {
        const res = await fetch(`/api/civil/intake/${submittedIntakeId}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attorneyId }),
        });
        if (!res.ok) throw new Error("Failed to assign attorney");
      }

      router.push("/app/history");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className="size-12 rounded-full bg-titanium-950 flex items-center justify-center border border-titanium-800 group-hover:border-action/50 transition-colors">
                          <UserIcon className="size-6 text-titanium-400 group-hover:text-action transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold text-titanium-50 group-hover:text-action transition-colors">{attorney.full_name}</h3>
                          <p className="text-sm text-titanium-400">{attorney.firm_name || "Independent Network Counsel"}</p>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="font-mono text-[10px] uppercase tracking-wider text-titanium-600">
                              {attorney.years_experience || 0} Years Exp.
                            </span>
                            <span className="text-titanium-800">•</span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-action/70">
                              {attorney.specialties || "Generalist"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" className="text-titanium-600 group-hover:text-action group-hover:translate-x-1 transition-all">
                        Assign <ChevronRight className="size-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="p-8 text-center border border-dashed border-titanium-800 rounded-lg bg-titanium-950/20">
                <p className="text-sm text-titanium-500">No direct matches found for this specialty. You can assign a generalist or let an admin handle it.</p>
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
              Let Admin Dispatch (Fastest)
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-12">
      <header>
        <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-[0.3em] text-titanium-400 border-titanium-800">
          Tier 2 — Strategic Civil Counsel
        </Badge>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
          File a <span className="text-titanium-500">civil intake.</span>
        </h1>
        <p className="mt-3 max-w-2xl text-titanium-400 leading-relaxed">
          Submit non-urgent civil matters here. A vetted attorney will reach out within 4 hours (urgent) or 24 hours (standard).
        </p>
      </header>

      <form onSubmit={onSubmit}>
        <Card className="border-titanium-800 bg-titanium-900/40 backdrop-blur-sm overflow-hidden">
          <CardContent className="p-6 sm:p-8 space-y-8">
            <div className="space-y-4">
              <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Matter Type</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                {MATTER_TYPES.map((m) => (
                  <Button
                    key={m.id}
                    type="button"
                    variant={matterType === m.id ? "default" : "outline"}
                    className={`h-auto py-3 px-2 text-xs transition-all ${matterType === m.id ? "bg-action text-action-foreground" : "border-titanium-800 bg-titanium-950/50 text-titanium-400 hover:border-titanium-600 hover:text-titanium-200"}`}
                    onClick={() => { setMatterType(m.id); setMetadata({}); }}
                  >
                    {m.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Matter Specific Fields */}
            <AnimatePresence mode="wait">
              {matterType === "landlord_tenant" && (
                <motion.div
                  key="landlord"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid gap-6 sm:grid-cols-2 border-t border-titanium-800/50 pt-8"
                >
                  <div className="sm:col-span-2 space-y-2">
                    <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Property Address</Label>
                    <Input
                      placeholder="123 Legal Way, Suite 4..."
                      className="border-titanium-800 bg-titanium-950/50 focus:border-action h-12"
                      onChange={(e) => handleMetadataChange("property_address", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Landlord Name</Label>
                    <Input
                      className="border-titanium-800 bg-titanium-950/50 focus:border-action h-12"
                      onChange={(e) => handleMetadataChange("landlord_name", e.target.value)}
                    />
                  </div>
                </motion.div>
              )}

              {matterType === "employment" && (
                <motion.div
                  key="employment"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid gap-6 sm:grid-cols-2 border-t border-titanium-800/50 pt-8"
                >
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Employer Name</Label>
                    <Input
                      className="border-titanium-800 bg-titanium-950/50 focus:border-action h-12"
                      onChange={(e) => handleMetadataChange("employer_name", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Employment Start Date</Label>
                    <Input
                      type="date"
                      className="border-titanium-800 bg-titanium-950/50 focus:border-action h-12 [color-scheme:dark]"
                      onChange={(e) => handleMetadataChange("employment_start_date", e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Urgency</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "urgent", label: "Urgent · 4h" },
                  { id: "standard", label: "Standard · 24h" },
                  { id: "routine", label: "Routine · 3d" }
                ].map((u) => (
                  <Button
                    key={u.id}
                    type="button"
                    variant={urgency === u.id ? "default" : "outline"}
                    className={`font-mono text-[10px] uppercase tracking-widest h-12 ${urgency === u.id ? "bg-action text-action-foreground" : "border-titanium-800 bg-titanium-950/50 text-titanium-400 hover:border-titanium-600 hover:text-titanium-200"}`}
                    onClick={() => setUrgency(u.id)}
                  >
                    {u.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Landlord refuses to return security deposit"
                className="border-titanium-800 bg-titanium-950/50 focus:border-action h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Describe the situation</Label>
              <Textarea
                rows={6}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include dates, parties involved, and what outcome you're seeking..."
                className="border-titanium-800 bg-titanium-950/50 focus:border-action min-h-[150px] resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-4">
              <Label className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Preferred Contact</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "phone", label: "Phone Call" },
                  { id: "email", label: "Email" }
                ].map((c) => (
                  <Button
                    key={c.id}
                    type="button"
                    variant={preferredContact === c.id ? "default" : "outline"}
                    className={`h-12 ${preferredContact === c.id ? "bg-action text-action-foreground" : "border-titanium-800 bg-titanium-950/50 text-titanium-400 hover:border-titanium-600 hover:text-titanium-200"}`}
                    onClick={() => setPreferredContact(c.id)}
                  >
                    {c.label}
                  </Button>
                ))}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-sm border border-destructive/40 bg-destructive/10 p-4 font-mono text-[11px] text-destructive flex items-center gap-3"
              >
                <div className="size-1.5 rounded-full bg-destructive animate-pulse" />
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-14 bg-action text-action-foreground font-bold uppercase tracking-widest hover:bg-action/90 shadow-lg shadow-action/10"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Encrypting & Sending...
                </>
              ) : (
                <>
                  Submit Intake
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
