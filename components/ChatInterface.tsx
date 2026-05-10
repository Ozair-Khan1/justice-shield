"use client";
import React, { useState, useEffect, useRef } from "react";
import { Send, Shield, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { io, Socket } from "socket.io-client";
import { LoadingScreen } from "@/components/LoadingScreen";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  created_at: string;
  sender: {
    id: string;
    full_name: string | null;
    role: string;
  };
}

interface ChatInterfaceProps {
  receiverId: string;
  userId: string;
  receiverName?: string | null;
  receiverRole?: string;
}

const SOCKET_URL = "http://localhost:3001";

export default function ChatInterface({ receiverId, userId, receiverName, receiverRole }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  // Unique room key for this conversation (sorted so both users share the same room)
  const roomId = [userId, receiverId].sort().join("_");

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 2000);

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", roomId);
    });

    socket.on("new-message", (message: Message) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
      // Auto-mark as read if it's incoming
      if (message.sender_id !== userId) {
        markAsRead();
      }
    });

    // Listen for real-time read receipts
    socket.on("messages-read", (readByUserId: string) => {
      if (readByUserId === receiverId) {
        setMessages(prev => prev.map(m =>
          m.sender_id === userId ? { ...m, is_read: true } : m
        ));
      }
    });

    return () => {
      clearInterval(intervalId);
      socket.disconnect();
    };
  }, [receiverId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Mark incoming messages as read whenever messages update
    const hasUnread = messages.some(m => !m.is_read && m.sender_id !== userId);
    if (hasUnread) {
      markAsRead();
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${receiverId}`, { credentials: "include" });
      const data = await res.json();
      if (data.messages) {
        setMessages((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(data.messages)) {
            return data.messages;
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Fetch messages error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`/api/chat/${receiverId}`, { method: "PATCH", credentials: "include" });
      // Notify the other user via socket
      if (socketRef.current) {
        socketRef.current.emit("mark-read", { room: roomId, readByUserId: userId });
      }
    } catch (error) {
      console.error("Mark as read error:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/chat/${receiverId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newMessage }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        if (socketRef.current) {
          socketRef.current.emit("send-message", { room: roomId, message: data.message, receiverId });
        }
      }
    } catch (error) {
      console.error("Send message error:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-titanium-950/50 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-titanium-800/50 bg-titanium-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-action/10 flex items-center justify-center border border-action/20">
            <MessageSquare className="size-5 text-action" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-titanium-50 uppercase tracking-wider">{receiverName || "Contact"}</h3>
            {receiverRole === "ATTORNEY" && (
              <span className="text-[10px] text-titanium-600 capitalize">{receiverRole.toLowerCase()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-titanium-800 scrollbar-track-transparent"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="size-6 text-titanium-700 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-10">
            <div className="size-16 rounded-full bg-titanium-900 flex items-center justify-center mb-4 border border-titanium-800">
              <MessageSquare className="size-8 text-titanium-700" />
            </div>
            <h4 className="text-titanium-400 font-bold uppercase tracking-wider text-xs">No Messages Yet</h4>
            <p className="text-[11px] text-titanium-600 mt-2 leading-relaxed">
              Start a secure conversation. All messages are private
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.sender_id === userId;
              const isAttorney = msg.sender.role === "ATTORNEY";
              const isAdmin = msg.sender.role === "ADMIN";

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex m-0  w-full ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex flex-col py-2 max-w-[85%] sm:max-w-[75%] min-w-0 ${isMe ? "items-end" : "items-start"}`}>
                    {/* Sender label (only for incoming) */}
                    {/* Bubble */}
                    <div className={`px-4 py-2.5 rounded-2xl leading-relaxed shadow-lg max-w-full min-w-0 ${isMe
                      ? "bg-action text-white rounded-tr-none shadow-action/10"
                      : "bg-titanium-900 text-titanium-100 border border-titanium-800 rounded-tl-none shadow-black/20"
                      }`}>
                      <p className="text-[13px] sm:text-sm break-all whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Timestamp + Seen */}
                    <div className="flex items-center gap-1.5 mt-1 px-1">
                      <span className="text-[9px] text-titanium-600 font-mono">
                        {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                      </span>
                      {isMe && msg.is_read && (
                        <span className="text-[9px] text-action font-bold uppercase tracking-widest flex items-center gap-0.5">
                          <Shield className="size-2" /> Seen
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-titanium-900/50 border-t border-titanium-800/50">
        <div className="flex gap-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a secure message..."
            className="flex-1 bg-titanium-950/50 border-titanium-800 text-titanium-50 placeholder:text-titanium-700 h-11 focus:ring-action focus:border-action transition-all rounded-xl"
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="bg-action hover:bg-action/90 text-white size-11 rounded-xl shadow-lg shadow-action/20 transition-all flex items-center justify-center p-0"
          >
            {isSending ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
