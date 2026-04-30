"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

interface Session {
  id: string;
  encounter_type: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  attorney_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
}

interface Intake {
  id: string;
  matter_type: string;
  urgency: string;
  subject: string;
  status: string;
  created_at: string;
  assigned_attorney: string | null;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"sos" | "civil">("sos");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setSessions(data.sessions || []);
        setIntakes(data.intakes || []);
      } catch (err: any) {
        setError(err.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user]);

  return (
    <div className="space-y-8">
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">Encrypted Vault</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Session history</h1>
        <p className="mt-3 text-titanium-400">All records sealed under attorney–client privilege.</p>
      </header>

      <div className="flex gap-1 border-b border-titanium-800">
        {(["sos", "civil"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`relative px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors ${tab === t ? "text-action" : "text-titanium-400 hover:text-titanium-50"}`}>
            {t === "sos" ? "Police Encounters" : "Civil Intakes"}
            {tab === t && <span className="absolute inset-x-2 bottom-0 h-0.5 bg-action" />}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="font-mono text-xs text-titanium-500">Loading...</div>
      ) : error ? (
        <div className="font-mono text-xs text-red-500 p-4 border border-red-500/20 bg-red-500/5 rounded-sm">
          {error}
        </div>
      ) : tab === "sos" ? (
        sessions.length === 0 ? <Empty label="No emergency sessions on record" /> : (
          <div className="divide-y divide-titanium-800 rounded-lg border border-titanium-800 bg-titanium-900/40">
            {sessions.map((s) => (
              <div key={s.id} className="grid gap-2 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6">
                <div className="font-mono text-[10px] uppercase tracking-widest text-action">SOS · {s.encounter_type.replace("_", " ")}</div>
                <div className="space-y-1 text-sm">
                  <div>{new Date(s.started_at).toLocaleString()}</div>
                  {s.attorney_name && <div className="font-mono text-[10px] text-titanium-500">ATTORNEY: {s.attorney_name}</div>}
                  {s.location_lat && <div className="font-mono text-[10px] text-titanium-500">GPS: {s.location_lat.toFixed(4)}, {s.location_lng?.toFixed(4)}</div>}
                </div>
                <span className="justify-self-start rounded-sm bg-titanium-800 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-titanium-300 sm:justify-self-end">{s.status}</span>
              </div>
            ))}
          </div>
        )
      ) : intakes.length === 0 ? <Empty label="No civil intakes filed" /> : (
        <div className="divide-y divide-titanium-800 rounded-lg border border-titanium-800 bg-titanium-900/40">
          {intakes.map((i) => (
            <div key={i.id} className="grid gap-2 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-6">
              <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-400">CIVIL · {i.matter_type.replace("_", " ")}</div>
              <div className="space-y-1">
                <div className="text-sm font-medium">{i.subject}</div>
                <div className="font-mono text-[10px] uppercase text-titanium-500">{new Date(i.created_at).toLocaleDateString()} · {i.urgency}</div>
              </div>
              <span className="justify-self-start rounded-sm bg-titanium-800 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-titanium-300 sm:justify-self-end">{i.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-titanium-700 bg-titanium-900/30 p-12 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">{label}</div>
    </div>
  );
}
