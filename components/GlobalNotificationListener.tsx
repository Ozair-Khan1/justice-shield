"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

const SOCKET_URL = "http://localhost:3001";

export function GlobalNotificationListener() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    if (socket.connected) {
      console.log("GlobalNotificationListener already connected, joining room:", user.id);
      socket.emit("join-personal-room", user.id);
    }

    socket.on("connect", () => {
      console.log("GlobalNotificationListener connected, joining room:", user.id);
      socket.emit("join-personal-room", user.id);
    });

    socket.on("global-notification", (message: any) => {
      console.log("GlobalNotificationListener received message:", message);
      const currentPathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const chattingWithUser = searchParams.get("user");

      const isChatOpen = (currentPathname.includes("/messages") || currentPathname.includes("/chat")) && chattingWithUser === message.sender_id;
      console.log("isChatOpen:", isChatOpen);

      if (!isChatOpen) {
        console.log("Showing toast for message");
        toast(
          <div className="flex flex-col gap-1">
            <span className="font-bold text-[13px]">{message.sender.full_name || "User"} sent a message</span>
            <span className="text-xs text-titanium-300 line-clamp-2">{message.content}</span>
          </div>,
          {
            duration: 4000,
            action: {
              label: "Reply",
              onClick: () => {
                { router.push(`/app/messages?user=${message.sender_id}&name=${encodeURIComponent(message.sender.full_name)}&role=${message.sender.role}`); toast.dismiss(); };
              }
            }
          }
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  return null;
}
