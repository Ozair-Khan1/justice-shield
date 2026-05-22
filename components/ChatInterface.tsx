"use client";

import { Send, Shield, Loader2, MessageSquare, Video, Phone, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { io, Socket } from "socket.io-client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  onAttorneyClick?: (id: string) => void;
  userName?: string;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export default function ChatInterface({
  receiverId,
  userId,
  receiverName,
  receiverRole,
  onAttorneyClick,
  userName,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showExpiredCallModal, setShowExpiredCallModal] = useState(false);
  const [pendingCallType, setPendingCallType] = useState<"audio" | "video" | null>(null);
  const [receiverStatus, setReceiverStatus] = useState<{
    role: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const roomId = useMemo(() => {
    if (!userId || !receiverId) return "";
    const id1 = userId.toString().replace(/-/g, "");
    const id2 = receiverId.toString().replace(/-/g, "");
    return [id1, id2].sort().join("");
  }, [userId, receiverId]);

  const handleStartCall = async (type: "audio" | "video") => {
    await proceedWithCall(type);
  };

  const proceedWithCall = async (type: "audio" | "video") => {
    if (!roomId) return;
    try {
      const res = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomId, receiverId, callType: type }),
      });
      const { callLog } = await res.json();
      window.location.href = `/call/${roomId}?name=${encodeURIComponent(userName || userId)}&type=${type}&callId=${callLog.id}&isCaller=true&receiverId=${receiverId}`;
    } catch {
      window.open(
        `/call/${roomId}?name=${encodeURIComponent(userName || userId)}&type=${type}`,
        "_blank",
        "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no"
      );
    }
  };

  useEffect(() => {
    fetchMessages();

    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      extraHeaders: { "Bypass-Tunnel-Reminder": "true" },
    });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("join-room", roomId));

    socket.on("new-message", (message: Message) => {
      setMessages(prev => {
        if (prev.find(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (message.sender_id !== userId) markAsRead();
    });

    socket.on("messages-read", (readByUserId: string) => {
      if (readByUserId === receiverId) {
        setMessages(prev => prev.map(m =>
          m.sender_id === userId ? { ...m, is_read: true } : m
        ));
      }
    });

    return () => { socket.disconnect(); };
  }, [receiverId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    const hasUnread = messages.some(m => !m.is_read && m.sender_id !== userId);
    if (hasUnread) markAsRead();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/chat/${receiverId}`, { credentials: "include" });
      const data = await res.json();
      if (data.messages) setMessages(data.messages);
      if (data.receiverStatus) setReceiverStatus(data.receiverStatus);
    } catch (error) {
      console.error("Fetch messages error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await fetch(`/api/chat/${receiverId}`, { method: "PATCH", credentials: "include" });
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
        setMessages(prev => [...prev, data.message]);
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
        <div
          className={`flex items-center gap-3 ${receiverRole === "ATTORNEY" && onAttorneyClick ? "cursor-pointer group" : ""}`}
          onClick={() => {
            if (receiverRole === "ATTORNEY" && onAttorneyClick) onAttorneyClick(receiverId);
          }}
        >
          <div className="size-10 rounded-full bg-action/10 flex items-center justify-center border border-action/20 group-hover:bg-action/20 transition-all">
            <MessageSquare className="size-5 text-action" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-titanium-50 uppercase tracking-wider group-hover:text-action transition-colors">
                {receiverName || "Contact"}
              </h3>
            </div>
            {receiverRole === "ATTORNEY" && (
              <span className="text-[10px] text-titanium-600 capitalize">{receiverRole.toLowerCase()}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => handleStartCall("audio")} variant="outline" size="sm" className="border-titanium-800 text-titanium-400 hover:text-white" title="Audio Call">
            <Phone className="size-4" />
          </Button>
          <Button onClick={() => handleStartCall("video")} variant="outline" size="sm" className="border-titanium-800 text-titanium-400 hover:text-white" title="Video Call">
            <Video className="size-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-titanium-800 scrollbar-track-transparent">
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
            <p className="text-[11px] text-titanium-600 mt-2 leading-relaxed">Start a secure conversation. All messages are private.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.sender_id === userId;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex m-0 w-full ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex flex-col py-2 max-w-[85%] sm:max-w-[75%] min-w-0 ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-2.5 rounded-2xl leading-relaxed shadow-lg max-w-full min-w-0 ${isMe
                      ? "bg-action text-white rounded-tr-none shadow-action/10"
                      : "bg-titanium-900 text-titanium-100 border border-titanium-800 rounded-tl-none shadow-black/20"
                    }`}>
                      <p className="text-[13px] sm:text-sm break-all whitespace-pre-wrap">{msg.content}</p>
                    </div>
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
