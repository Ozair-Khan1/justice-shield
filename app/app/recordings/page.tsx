"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Download, Calendar, Users, Video, Shield, Clock, ExternalLink, Mic } from "lucide-react";
import { format } from "date-fns";

interface Recording {
  id: string;
  type: string;
  url: string;
  started_at: string;
  ended_at?: string;
  participants: string;
  room: string;
}

const formatDuration = (start: string, end?: string) => {
  if (!end) return "Ongoing";
  const durationMs = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor((durationMs / 1000) % 60);
  const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
  const hours = Math.floor(durationMs / (1000 * 60 * 60));

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(" ");
};

export default function RecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecordings() {
      try {
        const res = await fetch("/api/recordings");
        const data = await res.json();
        if (data.recordings) {
          setRecordings(data.recordings);
        }
      } catch (error) {
        console.error("Error fetching recordings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchRecordings();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-action border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-bold tracking-tight text-white uppercase italic">
          Session <span className="text-action">Recordings</span>
        </h1>
        <p className="text-sm font-mono text-titanium-400 uppercase tracking-widest">
          Secure archives of your video calls and SOS encounters
        </p>
      </div>

      {recordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-titanium-800 bg-titanium-900/30 p-20 text-center">
          <Video className="mb-4 h-12 w-12 text-titanium-700" />
          <h3 className="text-lg font-bold text-titanium-200 uppercase tracking-tight">No recordings found</h3>
          <p className="mt-2 text-sm text-titanium-500">Recorded sessions will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recordings.map((recording, idx) => (
            <motion.div
              key={recording.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative overflow-hidden rounded-xl border border-titanium-800 bg-titanium-900/50 p-6 transition-all hover:border-action/50 hover:bg-titanium-900/80"
            >
              <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-action/5 blur-3xl group-hover:bg-action/10" />

              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-full bg-titanium-800/50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-titanium-400 group-hover:bg-action/20 group-hover:text-action">
                  {recording.type === "Video Call" ? (
                    <Video className="h-3 w-3" />
                  ) : recording.type === "Voice Call" ? (
                    <Mic className="h-3 w-3" />
                  ) : (
                    <Shield className="h-3 w-3" />
                  )}
                  {recording.type}
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-titanium-950/80 px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-widest text-action border border-titanium-800">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDuration(recording.started_at, recording.ended_at)}
                </div>
              </div>

              <h3 className="mb-4 line-clamp-1 font-display text-lg font-bold text-white uppercase tracking-tight">
                {recording.participants}
              </h3>

              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-titanium-400">
                  <Calendar className="h-4 w-4 text-action" />
                  <span className="font-mono text-[11px] uppercase tracking-wider">
                    {format(new Date(recording.started_at), "MMMM d, yyyy · HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-titanium-400">
                  <Users className="h-4 w-4 text-action" />
                  <span className="font-mono text-[11px] uppercase tracking-wider truncate">
                    ID: {recording.room.split("-").pop()?.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={recording.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-action px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-action-hover active:scale-95"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  Play
                </a>
                <a
                  href={recording.url}
                  download
                  className="flex items-center justify-center rounded-lg border border-titanium-700 bg-titanium-800/50 px-4 py-2.5 text-titanium-300 transition-all hover:border-titanium-600 hover:bg-titanium-800 hover:text-white"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
