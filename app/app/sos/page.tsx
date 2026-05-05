"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { User, Shield, ChevronRight, Loader2, Scale, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ENCOUNTER_TYPES = [
  { id: "traffic_stop", label: "Traffic Stop" },
  { id: "pedestrian_stop", label: "Pedestrian Stop" },
  { id: "domestic", label: "Domestic Incident" },
  { id: "accident", label: "Accident" },
  { id: "search", label: "Search / Seizure" },
  { id: "arrest", label: "Arrest" },
  { id: "other", label: "Other" },
] as const;

export default function SOSPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [stage, setStage] = useState<"select" | "armed" | "connecting" | "match">("select");
  const [encounterType, setEncounterType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recommendedAttorneys, setRecommendedAttorneys] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [locationCoords, setLocationCoords] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });

  useEffect(() => {
    refreshUser();
  }, []);

  const onTrigger = async (type: string) => {
    if (!user) return;
    if (!user.emergency_contact_phone) {
      setError("Emergency contact required to trigger SOS.");
      return;
    }
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

      if (data.recommendedAttorneys && data.recommendedAttorneys.length > 0) {
        setRecommendedAttorneys(data.recommendedAttorneys);
        setStage("match");
      } else {
        // No recommended attorneys, establish protection via admin dispatch immediately
        await onAssign(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to initiate emergency protocol");
      setStage("select");
      return;
    }
  };

  const onAssign = async (attorneyId: string | null) => {
    setAssigning(true);
    try {
      const res = await fetch("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          encounter_type: encounterType,
          location_lat: locationCoords.lat,
          location_lng: locationCoords.lng,
          location_address: resolvedAddress,
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
          <h1 className="font-display text-4xl font-bold tracking-tight">Specialist <span className="text-action">Found.</span></h1>
          <p className="text-titanium-400 max-w-md mx-auto">
            We've identified attorneys on standby specializing in <span className="text-titanium-200 uppercase font-mono text-xs">{encounterType?.replace("_", " ")}</span>. Select one to bridge them in now.
          </p>
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
                      <div className="mt-2 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider">
                        <span className="text-titanium-600">{attorney.years_experience || 0} Years Exp.</span>
                        <span className="text-titanium-800">•</span>
                        <span className="text-action/70">{attorney.specialties || "Generalist"}</span>
                        <span className="text-titanium-600">{attorney.city}</span>
                        <span className="text-titanium-600">{attorney.country}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="size-5 text-titanium-600 group-hover:text-action group-hover:translate-x-1 transition-all" />
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

      {!user?.emergency_contact_phone ? (
        <Card className="border-action/30 bg-action/5 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-action/20" />
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-action/10 border border-action/20 mb-6">
            <AlertTriangle className="size-8 text-action" />
          </div>
          <h2 className="font-display text-2xl font-bold text-titanium-50">Emergency Contact Required</h2>
          <p className="mt-4 text-sm text-titanium-400 max-w-md mx-auto leading-relaxed">
            To activate SOS protection, you must add an emergency contact in your account settings. This person will be automatically notified when you trigger a live session.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4">
            <Button asChild className="bg-action text-action-foreground h-12 px-8 font-bold uppercase tracking-widest text-[10px]">
              <Link href="/app/account">Add Emergency Contact</Link>
            </Button>
            <p className="font-mono text-[9px] uppercase tracking-widest text-titanium-600">Verification Required before deployment</p>
          </div>
        </Card>
      ) : (
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
      )}

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
