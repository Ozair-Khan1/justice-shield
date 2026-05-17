"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Download, Calendar, Users, Video, Shield, Clock, Search, Filter, Mic } from "lucide-react";
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

export default function AdminRecordingsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredRecordings = recordings.filter(r => 
    r.participants.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.room.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold tracking-tight text-white uppercase italic">
            Admin <span className="text-red-500">Recordings</span>
          </h1>
          <p className="text-sm font-mono text-titanium-400 uppercase tracking-widest">
            Complete archive of all system call recordings
          </p>
        </div>

        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-titanium-500" />
          <input
            type="text"
            placeholder="Search participants or sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-titanium-800 bg-titanium-900/50 py-2.5 pl-10 pr-4 font-mono text-[11px] text-white placeholder-titanium-600 outline-none focus:border-red-500/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <button className="flex items-center gap-2 whitespace-nowrap rounded-full bg-red-500/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-red-500 border border-red-500/20">
          All Sessions ({recordings.length})
        </button>
        <button className="flex items-center gap-2 whitespace-nowrap rounded-full bg-titanium-900/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-titanium-400 border border-titanium-800 hover:border-titanium-700">
          Video Calls
        </button>
        <button className="flex items-center gap-2 whitespace-nowrap rounded-full bg-titanium-900/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-titanium-400 border border-titanium-800 hover:border-titanium-700">
          Voice Calls
        </button>
        <button className="flex items-center gap-2 whitespace-nowrap rounded-full bg-titanium-900/50 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-titanium-400 border border-titanium-800 hover:border-titanium-700">
          SOS Encounters
        </button>
      </div>

      {filteredRecordings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-titanium-800 bg-titanium-900/30 p-20 text-center">
          <Video className="mb-4 h-12 w-12 text-titanium-700" />
          <h3 className="text-lg font-bold text-titanium-200 uppercase tracking-tight">No recordings found</h3>
          <p className="mt-2 text-sm text-titanium-500">No sessions match your search criteria.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-titanium-800 bg-titanium-900/50">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-titanium-800 bg-titanium-950/50">
                <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-400">Session</th>
                <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-400">Participants</th>
                <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-400">Date & Time</th>
                <th className="px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-400">Duration</th>
                <th className="px-6 py-4 text-right font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-titanium-800">
              {filteredRecordings.map((recording, idx) => (
                <motion.tr
                  key={recording.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group hover:bg-titanium-800/30"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${recording.type === "Video Call" ? "bg-blue-500/10 text-blue-500" : recording.type === "Voice Call" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                        {recording.type === "Video Call" ? <Video className="h-4 w-4" /> : recording.type === "Voice Call" ? <Mic className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase text-white">{recording.type}</div>
                        <div className="font-mono text-[9px] uppercase tracking-tighter text-titanium-500">{recording.room}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-titanium-200">{recording.participants}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-titanium-300">{format(new Date(recording.started_at), "MMM d, yyyy")}</div>
                    <div className="font-mono text-[10px] text-titanium-500 uppercase tracking-widest">{format(new Date(recording.started_at), "HH:mm")}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-[10px] text-titanium-300 uppercase tracking-widest">
                      {formatDuration(recording.started_at, recording.ended_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <a
                        href={recording.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-titanium-700 bg-titanium-800/50 text-titanium-400 hover:border-red-500/50 hover:text-red-500 transition-colors"
                        title="Play"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </a>
                      <a
                        href={recording.url}
                        download
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-titanium-700 bg-titanium-800/50 text-titanium-400 hover:border-titanium-500 hover:text-white transition-colors"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
