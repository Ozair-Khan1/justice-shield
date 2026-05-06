"use client";

import { useEffect, useState, useMemo } from "react";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Archive,
  Mail,
  Loader2,
  Trash2,
  AlertCircle,
  Inbox,
  CheckCircle,
  ArchiveRestore
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Pagination } from "@/components/Pagination";

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
  const [activeTab, setActiveTab] = useState<"unread" | "read" | "archived">("unread");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

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
        setMessages(msgs => msgs.filter(msg => msg.id !== id));
      } else {
        const res = await fetch(`/api/admin/messages`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: action }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
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

  const filteredMessages = useMemo(() => {
    return messages.filter(m => m.status === activeTab);
  }, [messages, activeTab]);

  const totalPages = Math.ceil(filteredMessages.length / ITEMS_PER_PAGE);
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const stats = {
    unread: messages.filter(m => m.status === "unread").length,
    read: messages.filter(m => m.status === "read").length,
    archived: messages.filter(m => m.status === "archived").length,
  };

  if (loading) return <LoadingScreen message="Loading Messages..." />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-10 pb-20"
    >
      <header>
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.4em] text-action">Administration</span>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Contact <span className="text-titanium-500">Inbox</span>
        </h1>
        <p className="mt-4 max-w-2xl text-titanium-400 text-sm">
          Review and respond to direct inquiries from users and potential enterprise clients.
        </p>
      </header>

      {/* Tabs */}
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 border-b border-titanium-800 pb-px">
          {[
            { id: "unread", label: "Unread", icon: Inbox, count: stats.unread, color: "text-red-400" },
            { id: "read", label: "Read", icon: CheckCircle, count: stats.read, color: "text-blue-400" },
            { id: "archived", label: "Archived", icon: ArchiveRestore, count: stats.archived, color: "text-titanium-500" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`group relative flex items-center gap-2 px-6 py-4 transition-all ${activeTab === tab.id
                  ? "text-titanium-50"
                  : "text-titanium-500 hover:text-titanium-300"
                }`}
            >
              <tab.icon className={`size-4 ${activeTab === tab.id ? tab.color : "text-titanium-600"}`} />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                {tab.label}
              </span>
              {tab.count > 0 && (
                <span className={`flex size-5 items-center justify-center rounded-full text-[9px] font-bold ring-1 ${activeTab === tab.id
                    ? "bg-titanium-50 text-titanium-950 ring-titanium-50"
                    : "bg-titanium-800 text-titanium-400 ring-titanium-700"
                  }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-action"
                />
              )}
            </button>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filteredMessages.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />

        <div className="grid gap-6 min-h-[400px]">
          <AnimatePresence mode="wait">
            {paginatedMessages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center rounded-lg border border-dashed border-titanium-800 p-20 text-center"
              >
                <div className="rounded-full bg-titanium-900/50 p-4 ring-1 ring-titanium-800">
                  <Inbox className="size-8 text-titanium-700" />
                </div>
                <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-titanium-600">
                  No {activeTab} messages found
                </p>
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid gap-6"
              >
                {paginatedMessages.map((msg) => (
                  <MessageCard
                    key={msg.id}
                    msg={msg}
                    onAction={(action) => handleAction(msg.id, action)}
                    isActioning={actioningId === msg.id}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function MessageCard({
  msg,
  onAction,
  isActioning
}: {
  msg: ContactMessage;
  onAction: (s: "read" | "archived" | "delete") => void;
  isActioning: boolean;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-sm border border-titanium-800 transition-all hover:border-titanium-700 ${msg.status === 'unread' ? 'bg-titanium-900/40' : 'bg-titanium-950/20'
      } p-6 sm:p-8`}>
      <div className="grid gap-8 lg:grid-cols-[1fr_250px]">
        <div className="space-y-6 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${msg.status === 'unread' ? 'text-action border-action/30 bg-action/5' : 'text-titanium-500 border-titanium-800 bg-titanium-900/30'
              }`}>
              {msg.status}
            </span>
            <span className="font-mono text-[10px] text-titanium-600 uppercase tracking-widest">
              {new Date(msg.created_at).toLocaleString()}
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="font-display text-2xl font-bold text-titanium-50 tracking-tight">{msg.name}</h3>
            <div className="flex items-center gap-2 text-titanium-400 text-sm">
              <Mail className="size-3 text-action/70" />
              <a href={`mailto:${msg.email}`} className="hover:text-action transition-colors truncate">{msg.email}</a>
            </div>
          </div>

          <div className="w-full overflow-hidden rounded-sm border border-titanium-800/50 bg-titanium-950/50 p-6 text-sm leading-relaxed text-titanium-300 whitespace-pre-wrap break-words">
            {msg.message}
          </div>
        </div>

        <div className="flex flex-col gap-2 justify-center lg:border-l lg:border-titanium-800 lg:pl-8">
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
              className="flex items-center justify-center gap-2 rounded-sm border border-titanium-800 bg-titanium-900/50 px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-400 transition-all hover:border-titanium-700 hover:text-titanium-100 disabled:opacity-50"
            >
              <Archive className="size-3" />
              Archive
            </button>
          )}
          {(msg.status === "read" || msg.status === "archived") && (
            <button
              disabled={isActioning}
              onClick={() => onAction("delete")}
              className="flex items-center justify-center gap-2 rounded-sm border border-red-500/20 bg-red-500/5 px-6 py-3 font-mono text-[10px] font-bold uppercase tracking-widest text-red-500/70 transition-all hover:border-red-500 hover:text-red-500 disabled:opacity-50"
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
