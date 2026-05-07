"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { User, Shield, ChevronRight, Loader2, Scale, AlertTriangle, BadgeInfo, MapPin, Award, Mail, Phone, ShieldCheck, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ENCOUNTER_TYPES = [
  { id: "traffic_stop", label: "Traffic Stop" },
  { id: "pedestrian_stop", label: "Pedestrian Stop" },
  { id: "domestic", label: "Domestic Incident" },
  { id: "accident", label: "Accident" },
  { id: "search", label: "Search / Seizure" },
  { id: "arrest", label: "Arrest" },
  { id: "other", label: "Other" },
] as const;

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

export default function SOSPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [stage, setStage] = useState<"select" | "armed" | "connecting" | "match">("select");
  const [encounterType, setEncounterType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommendedAttorneys, setRecommendedAttorneys] = useState<Attorney[]>([]);
  const [assigning, setAssigning] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });

  useEffect(() => {
    refreshUser();
  }, []);

  const onTrigger = async (type: string) => {
    if (!user) return;
    setEncounterType(type);
    setStage("armed");
    setError(null);

    let coords: GeolocationCoordinates | null = null;
    try {
      coords = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error("Geolocation unavailable"));
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 8000 },
        );
      });
      setLocationCoords({ lat: coords.latitude, lng: coords.longitude });
    } catch {
      // proceed without coords
    }

    setStage("connecting");

    try {
      setLocationCoords({ lat: coords?.latitude ?? null, lng: coords?.longitude ?? null });
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encounter_type: type,
          location_lat: coords?.latitude ?? null,
          location_lng: coords?.longitude ?? null,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setResolvedAddress(data.address);
      setRecommendedAttorneys(data.recommendedAttorneys || []);
      setStage("match");
    } catch (err: any) {
      setError(err.message || "Failed to initiate emergency protocol");
      setStage("select");
      return;
    }
  };

  const onAssign = async (
    attorneyId: string | null,
    typeOverride?: string,
    coordsOverride?: { lat: number | null, lng: number | null },
    addressOverride?: string | null
  ) => {
    setAssigning(true);
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encounter_type: typeOverride || encounterType,
          location_lat: coordsOverride ? coordsOverride.lat : locationCoords.lat,
          location_lng: coordsOverride ? coordsOverride.lng : locationCoords.lng,
          location_address: addressOverride !== undefined ? addressOverride : resolvedAddress,
          assigned_attorney_id: attorneyId,
          confirm: true,
        }),
      });
      if (!res.ok) throw new Error("Failed to assign attorney");
      router.push("/app/history");
    } catch (err: any) {
      setError(err.message);
      setAssigning(false);
    }
  };

  if (stage === "armed" || stage === "connecting") {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
        <div className="relative">
          <div className="absolute inset-0 -m-8 animate-ping rounded-full bg-action/20" />
          <div className="relative flex size-40 items-center justify-center rounded-full bg-action glow-action">
            <span className="font-display text-3xl font-bold text-action-foreground">SOS</span>
          </div>
        </div>
        <div className="mt-12 space-y-2">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">Shield Activated</div>
          <h1 className="font-display text-3xl font-bold">
            {stage === "armed" ? "Capturing location..." : "Scanning network..."}
          </h1>
          <p className="text-sm text-titanium-400">Encounter logged: {encounterType?.replace("_", " ")}</p>
        </div>
        <div className="mt-12 grid grid-cols-3 gap-6 font-mono text-[10px] uppercase tracking-widest text-titanium-500">
          <Indicator label="GPS" active />
          <Indicator label="Audio" active />
          <Indicator label="Counsel" active={stage === "connecting"} />
        </div>
      </div>
    );
  }

  if (stage === "match") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-10 max-w-2xl mx-auto"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto size-16 bg-action/10 rounded-full flex items-center justify-center border border-action/20">
            <Shield className="size-8 text-action" />
          </div>
          {recommendedAttorneys.length > 0 ? (
            <>
              <h1 className="font-display text-4xl font-bold tracking-tight">Specialist <span className="text-action">Found.</span></h1>
              <p className="text-titanium-400 max-w-md mx-auto">
                We've identified attorneys on standby specializing in <span className="text-titanium-200 uppercase font-mono text-xs">{encounterType?.replace("_", " ")}</span>. Select one to bridge them in now.
              </p>
            </>
          ) : (
            <>
              <h1 className="font-display text-4xl font-bold tracking-tight">No Specialist Found.</h1>
              <p className="text-titanium-400 max-w-md mx-auto">
                We couldn't find any attorneys specializing in <span className="text-titanium-200 uppercase font-mono text-xs">{encounterType?.replace("_", " ")}</span> Contact admin for assistance.
              </p>
            </>
          )}
        </div>

        <div className="grid gap-4">
          {recommendedAttorneys.map((attorney) => (
            <Card key={attorney.id} className="group border-titanium-800 bg-titanium-900/40 hover:border-action/30 transition-all cursor-pointer overflow-hidden" onClick={() => onAssign(attorney.id)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="size-12 rounded-full bg-titanium-950 flex items-center justify-center border border-titanium-800 group-hover:border-action/50 transition-colors">
                      <User className="size-6 text-titanium-400 group-hover:text-action transition-colors" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg font-bold text-titanium-50 group-hover:text-action transition-colors">{attorney.full_name}</h3>
                      <p className="text-sm text-titanium-400">{attorney.firm_name || "Specialized Response Counsel"}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider">
                        <span className="text-titanium-600">{attorney.years_experience || 0} Years Exp.</span>
                        <span className="text-titanium-800">•</span>
                        <span className="text-emerald-500/80">{attorney.resolved_cases || 0} Resolved</span>
                        <span className="text-titanium-800">•</span>
                        <span className="text-titanium-600">{attorney.total_cases || 0} Total</span>
                        <span className="text-titanium-800">•</span>
                        <span className="text-action/70">{attorney.specialties || "Generalist"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
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
                                  <div className="font-mono text-lg md:text-base font-bold text-titanium-50 leading-none">{attorney.total_cases}</div>
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
                                {attorney.phone && (
                                  <div className="flex items-center gap-3 text-xs md:text-sm text-titanium-300 group/link">
                                    <div className="size-7 md:size-8 rounded-sm bg-titanium-900 flex items-center justify-center border border-titanium-800 group-hover/link:border-action/30 transition-colors">
                                      <Phone className="size-3.5 md:size-4 text-action/70" />
                                    </div>
                                    <span>{attorney.phone}</span>
                                  </div>
                                )}
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
                            {attorney.resolved_cases > 0 && (
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
                    <ChevronRight className="size-5 text-titanium-600 group-hover:text-action group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-titanium-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-mono tracking-widest">
              <span className="bg-background px-4 text-titanium-500">No Preference?</span>
            </div>
          </div>

          <Button
            variant="outline"
            disabled={assigning}
            onClick={() => onAssign(null)}
            className="w-full h-16 border-titanium-800 bg-titanium-950/50 hover:bg-titanium-900 hover:border-titanium-700 text-titanium-400 font-mono text-[10px] uppercase tracking-widest"
          >
            {assigning ? <Loader2 className="size-4 animate-spin mr-2" /> : <Scale className="size-4 mr-2 text-action" />}
            Let Admin Dispatch (Fastest)
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-12">
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">Tier 1 — Emergency Response</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Select encounter type.</h1>
        <p className="mt-3 max-w-2xl text-titanium-400">
          On tap, Justice Shield logs your GPS, begins audio recording, and bridges a vetted attorney into a live video session.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {ENCOUNTER_TYPES.map((t) => (
          <button key={t.id} onClick={() => onTrigger(t.id)}
            className="group flex items-center justify-between rounded-lg border border-titanium-700 bg-titanium-900 p-6 text-left transition-all hover:border-action hover:bg-titanium-800">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-500 group-hover:text-action">{t.id.replace("_", "-")}</div>
              <div className="mt-1 font-display text-xl font-bold">{t.label}</div>
            </div>
            <span className="font-mono text-action opacity-0 transition-opacity group-hover:opacity-100">→</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-sm border border-destructive/40 bg-destructive/10 p-4 font-mono text-xs text-destructive">{error}</div>
      )}

      <div className="rounded-lg border border-titanium-800 bg-titanium-900/40 p-6">
        <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-action">Member Notice</div>
        <p className="mt-3 text-sm text-titanium-400">
          Activating the SOS will create a privileged record. Use only during active law-enforcement encounters. For non-urgent civil matters, use the Civil Intake form instead.
        </p>
      </div>
    </div>
  );
}

function Indicator({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`size-2 rounded-full ${active ? "bg-emerald-500" : "bg-titanium-700"} ${active ? "animate-pulse" : ""}`} />
      {label}
    </div>
  );
}
