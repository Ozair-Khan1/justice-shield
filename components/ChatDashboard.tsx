"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { MessageSquare, Search, User, Shield, Clock, ChevronRight, Loader2, Scale, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import ChatInterface from "./ChatInterface";
import CaseDetailModal from "@/components/CaseDetailModal";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

interface Participant {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface Conversation {
  id: string; // This is now the other user's ID
  participant: Participant;
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
}

interface AttorneyInfo {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  firm_name: string | null;
  specialties: string | null;
  years_experience: number | null;
  city: string | null;
  country: string | null;
  assigned_intakes: any[];
  assigned_encounters: any[];
}

export default function ChatDashboard({ userId, userName }: {
  userId: string;
  userName?: string | null;
}) {

  const searchParams = useSearchParams();
  const initialUser = searchParams.get("user");
  const initialName = searchParams.get("name");
  const initialRole = searchParams.get("role");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialUser);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const socketRef = useRef<Socket | null>(null);

  // New modal states
  const [viewingAttorney, setViewingAttorney] = useState<AttorneyInfo | null>(null);
  const [fetchingAttorney, setFetchingAttorney] = useState(false);
  const [viewingCase, setViewingCase] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  // Inject the initial user if they aren't in the fetched conversations yet
  const displayedConversations = [...conversations];
  if (initialUser && !conversations.find(c => c.id === initialUser)) {
    displayedConversations.unshift({
      id: initialUser,
      participant: {
        id: initialUser,
        full_name: initialName || "Contact",
        email: "",
        role: initialRole || "USER",
      },
      lastMessage: "Start a new conversation",
      updatedAt: new Date().toISOString(),
      unreadCount: 0,
    });
  }

  const selectedChat = displayedConversations.find(c => c.id === selectedId);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/chat/conversations", { credentials: "include" });
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Fetch conversations error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Connect socket to listen for new messages and update conversation list in real-time
    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      extraHeaders: { "Bypass-Tunnel-Reminder": "true" }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      // Join personal room to receive notifications for this user
      socket.emit("join-personal-room", userId);
    });

    // When a new message arrives in any conversation, refresh the conversation list
    socket.on("new-message", () => {
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/chat/${id}`, { method: "PATCH", credentials: "include" });
      setConversations(prev => prev.map(c =>
        c.id === id ? { ...c, unreadCount: 0 } : c
      ));
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    markAsRead(id);

    const chat = displayedConversations.find(c => c.id === id);
    if (chat) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("user", id);
      window.history.replaceState(null, "", `?${params.toString()}`);
    }
  };

  const openAttorneyInfo = async (attorneyId: string, e?: React.MouseEvent) => {
 // Don't select the chat
    setFetchingAttorney(true);
    try {
      const res = await fetch(`/api/attorneys/${attorneyId}`);
      const data = await res.json();
      if (data.attorney) {
        setViewingAttorney(data.attorney);
      }
    } catch (error) {
      console.error("Fetch attorney info error:", error);
    } finally {
      setFetchingAttorney(false);
    }
  };

  const filteredConversations = displayedConversations.filter(c =>
    c.participant?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.participant?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full bg-titanium-950/40 rounded-3xl border border-titanium-800/50 overflow-hidden backdrop-blur-xl shadow-2xl relative">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-titanium-800/50 flex flex-col bg-titanium-900/30 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-titanium-800/50">
          <h2 className="text-lg font-bold text-titanium-50 uppercase tracking-wider mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-titanium-600" />
            <Input
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-titanium-950/50 border-titanium-800 pl-9 h-10 text-xs focus:ring-action transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="size-6 text-action animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="size-8 text-titanium-800 mx-auto mb-2" />
              <p className="text-[10px] text-titanium-600 uppercase font-mono tracking-widest">No Conversations Yet</p>
            </div>
          ) : (
            filteredConversations.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelect(chat.id)}
                className={`w-full p-4 flex items-center gap-3 border-b border-titanium-800/30 transition-all hover:bg-titanium-800/30 text-left relative ${selectedId === chat.id ? "bg-action/10 border-l-2 border-l-action" : ""}`}
              >
                <div className="size-11 rounded-full bg-titanium-950 flex items-center justify-center border border-titanium-800 shrink-0 relative">
                  {chat.participant?.role === "ATTORNEY" ? (
                    <Shield className="size-5 text-action" />
                  ) : (
                    <User className="size-5 text-titanium-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className={`text-sm font-bold truncate ${selectedId === chat.id ? "text-action" : "text-titanium-50"}`}>
                      {chat.participant?.full_name || chat.participant?.email || "Unknown"}
                    </h3>
                    <span className={`text-[9px] font-mono shrink-0 ml-1 ${chat.unreadCount > 0 ? "text-action" : "text-titanium-600"}`}>
                      {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1 gap-2">
                    <p className="text-[11px] text-titanium-500 truncate flex-1">{chat.lastMessage}</p>
                    {chat.unreadCount > 0 && (
                      <div className="flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-action text-[9px] font-bold text-white shrink-0">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-titanium-950/20 ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
        <AnimatePresence mode="wait">
          {selectedId ? (
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col"
            >
              {/* Mobile Back Button */}
              <div className="md:hidden p-3 border-b border-titanium-800/50 bg-titanium-900 flex items-center gap-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="p-2 -ml-2 text-titanium-400 hover:text-action transition-colors"
                >
                  <ChevronRight className="size-5 rotate-180" />
                </button>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-titanium-50 truncate">
                    {selectedChat?.participant?.full_name || "Contact"}
                  </h4>
                  <p className="text-[9px] text-titanium-500 uppercase tracking-widest">
                    {selectedChat?.participant?.role === "ATTORNEY" ? "Attorney" : "Member"}
                  </p>
                </div>
              </div>

              <ChatInterface
                receiverId={selectedId}
                userId={userId}
                userName={userName || undefined}
                receiverName={selectedChat?.participant?.full_name}
                receiverRole={selectedChat?.participant?.role}
                onAttorneyClick={(id) => openAttorneyInfo(id)}
              />

            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-12">
              <div className="size-24 rounded-full bg-titanium-900 flex items-center justify-center mb-6 border border-titanium-800 shadow-2xl">
                <MessageSquare className="size-10 text-titanium-700" />
              </div>
              <h3 className="text-xl font-bold text-titanium-50 uppercase tracking-[0.2em]">Messages</h3>
              <p className="text-sm text-titanium-500 mt-3 max-w-sm leading-relaxed">
                Let the attorney accept your case to start the conversation.
              </p>
              <div className="mt-8 flex items-center gap-4 text-[10px] text-titanium-600 font-mono uppercase tracking-[0.3em]">
                <div className="flex items-center gap-1.5"><Shield className="size-3" /> Secure</div>
                <div className="size-1 bg-titanium-800 rounded-full" />
                <div className="flex items-center gap-1.5"><Clock className="size-3" /> Real-time</div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Attorney Info Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {viewingAttorney && (
            <div className="fixed inset-0 z-[9997] flex items-center justify-center bg-titanium-950/90 backdrop-blur-md p-4" onClick={() => setViewingAttorney(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-titanium-900 border border-titanium-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-4 sm:p-6 border-b border-titanium-800 flex justify-between items-center bg-titanium-950/50">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="size-10 sm:size-12 rounded-full bg-action/10 flex items-center justify-center border border-action/20">
                      <Scale className="size-5 sm:size-6 text-action" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-titanium-50 truncate">{viewingAttorney.full_name}</h2>
                      <p className="text-[9px] sm:text-[10px] text-action font-mono uppercase tracking-[0.2em] truncate">{viewingAttorney.firm_name || "Independent Counsel"}</p>
                    </div>
                  </div>
                  <button onClick={() => setViewingAttorney(null)} className="text-titanium-500 hover:text-white transition-colors p-2 shrink-0">
                    <X className="size-5 sm:size-6" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 scrollbar-hide">
                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-titanium-950/50 p-3 sm:p-4 rounded-xl border border-titanium-800">
                      <p className="text-[8px] sm:text-[9px] text-titanium-500 uppercase tracking-widest mb-1">Experience</p>
                      <p className="text-base sm:text-lg font-bold text-titanium-50">{viewingAttorney.years_experience || 0} Years</p>
                    </div>
                    <div className="bg-titanium-950/50 p-3 sm:p-4 rounded-xl border border-titanium-800">
                      <p className="text-[8px] sm:text-[9px] text-titanium-500 uppercase tracking-widest mb-1">Location</p>
                      <p className="text-[10px] sm:text-[11px] font-bold text-titanium-50 truncate">{viewingAttorney.city}, {viewingAttorney.country}</p>
                    </div>
                    <div className="bg-titanium-950/50 p-3 sm:p-4 rounded-xl border border-titanium-800 col-span-2">
                      <p className="text-[8px] sm:text-[9px] text-titanium-500 uppercase tracking-widest mb-1">Specialties</p>
                      <p className="text-[10px] sm:text-[11px] font-bold text-action truncate">{viewingAttorney.specialties || "General Defense"}</p>
                    </div>
                  </div>

                  {/* Cases */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] sm:text-xs font-bold text-titanium-50 uppercase tracking-[0.2em] flex items-center gap-2">
                      <Clock className="size-3.5 sm:size-4 text-action" /> Active & History
                    </h3>
                    <div className="space-y-2.5 sm:space-y-3">
                      {[...viewingAttorney.assigned_intakes.map(i => ({ ...i, type: 'civil' })),
                      ...viewingAttorney.assigned_encounters.map(e => ({ ...e, type: 'sos' }))]
                        .sort((a, b) => new Date(b.created_at || b.started_at).getTime() - new Date(a.created_at || a.started_at).getTime())
                        .map((c: any) => (
                          <div key={c.id} className="flex items-center justify-between p-3 sm:p-4 bg-titanium-950/30 rounded-xl border border-titanium-800/50 hover:border-titanium-700 transition-colors group">
                            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                              <div className={`size-8 sm:size-9 rounded-lg flex items-center justify-center shrink-0 ${c.type === 'sos' ? 'bg-red-500/10 text-red-400' : 'bg-action/10 text-action'}`}>
                                {c.type === 'sos' ? <Clock className="size-4 sm:size-4.5" /> : <Scale className="size-4 sm:size-4.5" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-titanium-50 truncate pr-2">{c.subject || `SOS: ${c.encounter_type?.replace('_', ' ')}`}</p>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className={`text-[8px] sm:text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${c.status === 'active' || c.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : c.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                    {c.status}
                                  </span>
                                  <span className="text-[8px] sm:text-[9px] text-titanium-600 font-mono">
                                    {new Date(c.created_at || c.started_at).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => setViewingCase(c)}
                              className="p-2 rounded-lg bg-titanium-800/50 text-titanium-400 hover:text-action hover:bg-action/10 transition-all shrink-0"
                            >
                              <Search className="size-3.5 sm:size-4" />
                            </button>
                          </div>
                        ))}
                      {viewingAttorney.assigned_intakes.length === 0 && viewingAttorney.assigned_encounters.length === 0 && (
                        <div className="text-center py-10 border border-dashed border-titanium-800 rounded-xl bg-titanium-950/20">
                          <p className="text-[9px] sm:text-[10px] text-titanium-600 uppercase font-mono tracking-widest">No shared legal matters found</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <CaseDetailModal caseData={viewingCase} onClose={() => setViewingCase(null)} />

      {mounted && fetchingAttorney && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-titanium-950/40 backdrop-blur-sm">
          <Loader2 className="size-10 text-action animate-spin" />
        </div>,
        document.body
      )}
    </div>
  );
}
