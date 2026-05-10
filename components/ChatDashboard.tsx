"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Search, User, Shield, Clock, ChevronRight, Loader2, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import ChatInterface from "./ChatInterface";
import { LoadingScreen } from "@/components/LoadingScreen";

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

export default function ChatDashboard({ userId }: { userId: string }) {
  const searchParams = useSearchParams();
  const initialUser = searchParams.get("user");
  const initialName = searchParams.get("name");
  const initialRole = searchParams.get("role");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialUser);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
    const interval = setInterval(fetchConversations, 2000);
    return () => clearInterval(interval);
  }, []);

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
                receiverName={selectedChat?.participant?.full_name}
                receiverRole={selectedChat?.participant?.role}
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
    </div>
  );
}
