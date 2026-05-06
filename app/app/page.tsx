"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";
import { LoadingScreen } from "@/components/LoadingScreen";

interface SessionRow { id: string; encounter_type: string; status: string; started_at: string }
interface IntakeRow { id: string; matter_type: string; subject: string; status: string; created_at: string }

export default function AppDashboard() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [intakes, setIntakes] = useState<IntakeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (data.sessions) setSessions(data.sessions.slice(0, 3));
        if (data.intakes) setIntakes(data.intakes.slice(0, 3));
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, [user]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12"
    >
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-action">Operations Console</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Standby. Shield armed.</h1>
        <p className="mt-3 text-titanium-400">Welcome back, {user?.full_name}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <Link href="/app/sos" className="group relative overflow-hidden rounded-lg border border-action/30 bg-linear-to-br from-action/15 via-titanium-900 to-titanium-900 p-8 transition-all hover:border-action/60 hover:glow-action">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-action">Tier 1 / Emergency</span>
          <h2 className="mt-4 font-display text-3xl font-bold">Trigger SOS</h2>
          <p className="mt-3 text-sm text-titanium-400">Police encounter? Tap to launch the emergency attorney patch.</p>
          <div className="mt-8 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-action">Launch <span className="transition-transform group-hover:translate-x-1">→</span></div>
        </Link>
        <Link href="/app/civil" className="group rounded-lg border border-titanium-700 bg-titanium-900 p-8 transition-all hover:border-titanium-500">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-400">Tier 2 / Strategic</span>
          <h2 className="mt-4 font-display text-3xl font-bold">File Civil Intake</h2>
          <p className="mt-3 text-sm text-titanium-400">Submit a non-urgent matter. Attorney callback within 4 hours.</p>
          <div className="mt-8 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-titanium-300">Open intake <span className="transition-transform group-hover:translate-x-1">→</span></div>
        </Link>
      </section>

      <section>
        <div className="flex items-end justify-between">
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-titanium-500">Recent Activity</span>
            <h2 className="mt-2 font-display text-2xl font-bold">Logs</h2>
          </div>
          <Link href="/app/history" className="font-mono text-[10px] uppercase tracking-widest text-titanium-400 hover:text-titanium-50">View all →</Link>
        </div>
        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingScreen message="Establishing Secure Uplink..." />
          </div>
        ) : sessions.length === 0 && intakes.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-titanium-700 bg-titanium-900/40 p-12 text-center">
            <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">No incidents recorded</div>
            <p className="mt-2 text-sm text-titanium-400">Your shield is active. Stay safe.</p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-titanium-800 rounded-lg border border-titanium-800 bg-titanium-900/40">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-action">SOS · {s.encounter_type.replace("_", " ")}</div>
                  <div className="mt-1 text-sm">{new Date(s.started_at).toLocaleString()}</div>
                </div>
                <span className="rounded-sm bg-titanium-800 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-titanium-300">{s.status}</span>
              </div>
            ))}
            {intakes.map((i) => (
              <div key={i.id} className="flex items-center justify-between p-4">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-titanium-400">CIVIL · {i.matter_type.replace("_", " ")}</div>
                  <div className="mt-1 text-sm">{i.subject}</div>
                </div>
                <span className="rounded-sm bg-titanium-800 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-titanium-300">{i.status}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}
