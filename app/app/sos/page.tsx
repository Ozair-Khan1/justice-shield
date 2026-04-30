"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

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
  const { user } = useAuth();
  const router = useRouter();
  const [stage, setStage] = useState<"select" | "armed" | "connecting">("select");
  const [encounterType, setEncounterType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    } catch {
      // proceed without coords
    }

    setStage("connecting");

    try {
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

      // Successfully connected
    } catch (err: any) {
      setError(err.message || "Failed to initiate emergency protocol");
      setStage("select");
      return;
    }

    setTimeout(() => {
      router.push("/app/history");
    }, 3500);
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
            {stage === "armed" ? "Capturing location..." : "Patching attorney..."}
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
