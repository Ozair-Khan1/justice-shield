"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Archive,
  Mail,
  Loader2,
  Trash2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: "unread" | "read" | "archived";
  created_at: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/admin/messages");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleAction = async (id: string, action: "read" | "archived" | "delete") => {
    setActioningId(id);
    try {
      if (action === "delete") {
        const res = await fetch(`/api/admin/messages`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Remove from local state
        setMessages(msgs => msgs.filter(msg => msg.id !== id));
      } else {
        const res = await fetch(`/api/admin/messages`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: action }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        // Update local state
        setMessages(msgs => msgs.map(msg =>
          msg.id === id ? { ...msg, status: action } : msg
        ));
      }
    } catch (err: any) {
      alert(err.message || "Action failed");
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-action" />
      </div>
    );
  }

  const unread = messages.filter(m => m.status === "unread");
  const read = messages.filter(m => m.status === "read");
  const archived = messages.filter(m => m.status === "archived");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12"
    >
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-action">Administration</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Contact <span className="text-titanium-500">Messages</span>
        </h1>
        <p className="mt-4 max-w-2xl text-titanium-400">
          Review and respond to direct inquiries from users and potential enterprise clients.
        </p>
      </header>

      {/* Unread Messages */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="size-4 text-action" />
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-titanium-300">New Messages ({unread.length})</h2>
        </div>

        <div className="grid gap-6">
          {unread.length === 0 ? (
            <div className="rounded-lg border border-dashed border-titanium-800 p-12 text-center text-titanium-600 font-mono text-[10px] uppercase tracking-widest">
              Inbox is empty
            </div>
          ) : (
            unread.map((msg) => (
              <MessageCard
                key={msg.id}
                msg={msg}
                onAction={(action) => handleAction(msg.id, action)}
                isActioning={actioningId === msg.id}
              />
            ))
          )}
        </div>
      </section>

      {/* Read Messages */}
      {read.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-titanium-800">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-4 text-titanium-500" />
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-titanium-500">Read Messages</h2>
          </div>
          <div className="grid gap-6">
            {read.map((msg) => (
              <MessageCard
                key={msg.id}
                msg={msg}
                onAction={(action) => handleAction(msg.id, action)}
                isActioning={actioningId === msg.id}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {/* Archived History */}
      {archived.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-titanium-800">
          <div className="flex items-center gap-3">
            <Archive className="size-4 text-titanium-500" />
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-titanium-500">Archive</h2>
          </div>
          <div className="grid gap-6">
            {archived.map((msg) => (
              <MessageCard
                key={msg.id}
                msg={msg}
                onAction={(action) => handleAction(msg.id, action)}
                isActioning={actioningId === msg.id}
                compact
              />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}

function MessageCard({ msg, onAction, isActioning, compact = false }: { msg: ContactMessage; onAction: (s: "read" | "archived" | "delete") => void; isActioning: boolean; compact?: boolean }) {
  return (
    <div className={`group relative overflow-hidden rounded-lg border border-titanium-800 ${msg.status === 'unread' ? 'bg-titanium-900/50' : 'bg-titanium-900/20'} p-8 transition-all hover:border-titanium-700 hover:bg-titanium-900/50`}>
      <div className="grid gap-8 lg:grid-cols-[1fr_250px]">
        <div className="space-y-6 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`font-mono text-[10px] uppercase tracking-widest ${msg.status === 'unread' ? 'text-action' : 'text-titanium-500'}`}>
              {new Date(msg.created_at).toLocaleString()}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-titanium-50">{msg.name}</h3>
            <div className="flex items-center gap-2 text-titanium-400 text-sm">
              <Mail className="size-3" />
              <a href={`mailto:${msg.email}`} className="hover:text-action transition-colors">{msg.email}</a>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-sm bg-titanium-950/50 p-4 sm:p-6 text-sm leading-relaxed text-titanium-300 whitespace-pre-wrap break-words">
            {msg.message}
          </div>
        </div>

        <div className="flex flex-col gap-3 justify-center lg:border-l lg:border-titanium-800 lg:pl-8">
          {msg.status === "unread" && (
            <button
              disabled={isActioning}
              onClick={() => onAction("read")}
              className="flex items-center justify-center gap-2 rounded-sm bg-action px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-action-foreground transition-all hover:bg-action/90 disabled:opacity-50"
            >
              {isActioning ? <Loader2 className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />}
              Mark Read
            </button>
          )}
          {msg.status !== "archived" && (
            <button
              disabled={isActioning}
              onClick={() => onAction("archived")}
              className="flex items-center justify-center gap-2 rounded-sm border border-titanium-700 bg-titanium-900 px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-400 transition-all hover:bg-titanium-800 hover:text-titanium-50 disabled:opacity-50"
            >
              <Archive className="size-3" />
              Archive
            </button>
          )}
          {(msg.status === "read" || msg.status === "archived") && (
            <button
              disabled={isActioning}
              onClick={() => onAction("delete")}
              className="flex items-center justify-center gap-2 rounded-sm border border-red-500/30 bg-red-500/5 px-6 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-red-500 transition-all hover:bg-red-500/10 hover:border-red-500 disabled:opacity-50"
            >
              <Trash2 className="size-3" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
