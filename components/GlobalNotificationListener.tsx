"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://127.0.0.1:3001";

export function GlobalNotificationListener() {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const hasFetchedUnread = useRef(false);
  const [sessionSeenIds, setSessionSeenIds] = useState<Set<string>>(new Set());

  // Initialize sessionSeenIds from user data
  useEffect(() => {
    if (user?.seen_notification_ids) {
      setSessionSeenIds(new Set(user.seen_notification_ids));
    }
  }, [user?.id]);

  useEffect(() => {
    hasFetchedUnread.current = false;
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (hasFetchedUnread.current) return;

    const fetchUnread = async () => {
      try {
        const [chatResult, notifResult] = await Promise.allSettled([
          fetch("/api/chat/unread").then(r => r.json()),
          fetch("/api/notifications/unread").then(r => r.json())
        ]);

        if (chatResult.status === "fulfilled") {
          const chatData = chatResult.value;
          if (chatData.unreadMessages && chatData.unreadMessages.length > 0) {
            chatData.unreadMessages.forEach((msg: any) => {
              showNotification(msg);
            });
          }
        }

        if (notifResult.status === "fulfilled") {
          const notifData = notifResult.value;
          if (notifData.unreadNotifications && notifData.unreadNotifications.length > 0) {
            const newToSeen: string[] = [];

            notifData.unreadNotifications.forEach((notif: any) => {
              if (!sessionSeenIds.has(notif.id)) {
                if (notif.type === "SOS") {
                  showEmergencyNotification(notif);
                } else if (notif.type === "CIVIL_INTAKE") {
                  showIntakeNotification(notif);
                } else {
                  showUserConfirmationNotification(notif);
                }
                newToSeen.push(notif.id);
              }
            });

            if (newToSeen.length > 0) {
              setSessionSeenIds(prev => {
                const next = new Set(prev);
                newToSeen.forEach(id => next.add(id));
                return next;
              });
              // Persist to DB
              fetch("/api/notifications/seen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationIds: newToSeen })
              }).catch(err => console.error("Failed to persist seen notifications:", err));
            }
          }
        }

        hasFetchedUnread.current = true;
      } catch (err) {
        console.error("fetchUnread error:", err);
      }
    };

    fetchUnread();
  }, [user?.id]);

  const addToSeen = (id: string) => {
    if (!id || !user?.id) return;
    if (!sessionSeenIds.has(id)) {
      setSessionSeenIds(prev => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      fetch("/api/notifications/seen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] })
      }).catch(err => console.error("Failed to persist seen notification:", err));
    }
  };

  const showNotification = (message: any) => {
    toast.custom((t) => (
      <div className="animate-in fade-in slide-in-from-top-5 sm:slide-in-from-right-5 flex flex-col gap-2 sm:gap-4 !bg-titanium-900/90 backdrop-blur-xl border border-titanium-800 border-l-2 border-l-action p-3.5 sm:p-6 rounded-lg shadow-2xl w-[calc(100vw-24px)] sm:w-[440px] !min-w-0 !z-[9999] pointer-events-auto mx-auto sm:mx-0 mt-4 sm:mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-action animate-pulse shrink-0" />
              <span className="font-mono text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-action truncate">
                New Message
              </span>
            </div>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-titanium-50 truncate">
              {message.sender.full_name || "User"}
            </span>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-titanium-600 hover:text-titanium-400 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-titanium-400 leading-relaxed line-clamp-2 sm:line-clamp-3">
          {message.content}
        </p>

        <div className="flex justify-end pt-2 border-t border-titanium-800/50 mt-1 sm:mt-2">
          <button
            onClick={() => {
              router.push(`/app/messages?user=${message.sender_id}&name=${encodeURIComponent(message.sender.full_name)}&role=${message.sender.role}`);
              toast.dismiss(t);
            }}
            className="flex items-center gap-2 bg-action/10 hover:bg-action text-action hover:text-white px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-sm text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all duration-200 shadow-lg shadow-action/5"
          >
            Reply
          </button>
        </div>
      </div>
    ), {
      duration: 4000,
      position: "top-right"
    });
  };

  useEffect(() => {
    if (!user) {
      console.log("[GlobalNotification] No user found, skipping listener.");
      return;
    }

    console.log("[GlobalNotification] MOUNTED for user:", user.id);
    console.log("[GlobalNotification] Connecting to:", SOCKET_URL);

    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[GlobalNotification] SOCKET CONNECTED:", socket.id);
      socket.emit("join-personal-room", user.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[GlobalNotification] SOCKET CONNECTION ERROR:", err.message);
    });

    socket.on("global-notification", (message: any) => {
      const currentPathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const chattingWithUser = searchParams.get("user");

      const isChatOpen = (currentPathname.includes("/messages") || currentPathname.includes("/chat")) && chattingWithUser === message.sender_id;

      if (!isChatOpen) {
        showNotification(message);
      }
    });

    socket.on("sos-alert", (data: any) => {
      console.log("[GlobalNotification] SOS Alert received:", data.type, "Status:", data.status);
      const currentUserId = user.id?.toString().trim();
      const assignedId = data.assigned_attorney_id?.toString().trim();
      const performedBy = data.performed_by?.toString().trim();
      const ownerId = data.owner_id?.toString().trim();

      console.log("[GlobalNotification] SOS Debug:", {
        currentUserId,
        ownerId,
        assignedId,
        performedBy,
        role: user.role,
        matchOwner: ownerId === currentUserId,
        matchAssigned: assignedId === currentUserId
      });

      // If triggered by current user, show confirmation if they are a regular USER
      if (performedBy === currentUserId) {
        if (user.role === "USER") {
          showUserConfirmationNotification({
            type: "SOS_CONFIRMATION",
            id: data.id,
            encounter_type: data.encounter_type.replace("_", " "),
            status: data.status
          });
          addToSeen(data.id);
        }
        return;
      }

      // If it's just an update (like "Accepted" or "Resolved"), we show it to:
      // 1. Admins
      // 2. The assigned attorney
      // 3. The OWNER of the SOS
      if (data.type === "SOS_UPDATE") {
        if (user.role === "ADMIN") {
          // Don't show rejection notifications to admin as per request
          if (data.status !== "rejected") {
            showEmergencyNotification(data);
          }
        } else if (assignedId === currentUserId) {
          showEmergencyNotification(data);
        } else if (ownerId === currentUserId) {
          showUserConfirmationNotification({
            type: "SOS_UPDATE_CONFIRMATION",
            id: data.id,
            encounter_type: data.encounter_type,
            status: data.status
          });
        }
        return;
      }

      // Original New SOS logic:
      if (assignedId) {
        if (currentUserId === assignedId) {
          showEmergencyNotification(data);
          addToSeen(data.id);
        } else {
          console.log("[GlobalNotification] SOS Alert ignored: targeted to another attorney");
        }
      } else if (user.role === "ADMIN") {
        showEmergencyNotification(data);
        addToSeen(data.id);
      } else {
        console.log("[GlobalNotification] SOS Alert ignored: Admin-only dispatch alert");
      }
    });

    socket.on("new-civil-intake", (data: any) => {
      console.log("[GlobalNotification] Civil Intake event:", data.type, "Status:", data.status);
      const currentUserId = user.id?.toString().trim();
      const assignedId = data.assigned_attorney_id?.toString().trim();
      const performedBy = data.performed_by?.toString().trim();
      const ownerId = data.owner_id?.toString().trim();

      console.log("[GlobalNotification] Civil Debug:", {
        currentUserId,
        ownerId,
        assignedId,
        performedBy,
        role: user.role,
        matchOwner: ownerId === currentUserId,
        matchAssigned: assignedId === currentUserId
      });

      // If triggered by current user, show confirmation if they are a regular USER
      if (performedBy === currentUserId) {
        if (user.role === "USER") {
          showUserConfirmationNotification({
            type: "CIVIL_CONFIRMATION",
            id: data.id,
            subject: data.subject,
            status: data.status
          });
          addToSeen(data.id);
        }
        return;
      }

      // Handle Updates
      if (data.type === "CIVIL_UPDATE") {
        if (user.role === "ADMIN") {
          // Don't show rejection notifications to admin as per request
          if (data.status !== "rejected") {
            showIntakeNotification(data);
          }
        } else if (assignedId === currentUserId) {
          showIntakeNotification(data);
        } else if (ownerId === currentUserId) {
          showUserConfirmationNotification({
            type: "CIVIL_UPDATE_CONFIRMATION",
            id: data.id,
            subject: data.subject,
            status: data.status
          });
        }
        return;
      }

      // Original New Intake logic:
      if (assignedId) {
        if (currentUserId === assignedId) {
          showIntakeNotification(data);
          addToSeen(data.id);
        } else {
          console.log("[GlobalNotification] Intake Alert ignored: targeted to another attorney");
        }
      } else if (user.role === "ADMIN") {
        showIntakeNotification(data);
        addToSeen(data.id);
      } else {
        console.log("[GlobalNotification] Intake Alert ignored: Admin-only dispatch alert");
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id, user?.role]);

  const showEmergencyNotification = (data: any) => {
    toast.custom((t) => (
      <div className="animate-in fade-in slide-in-from-top-5 sm:slide-in-from-left-5 flex flex-col gap-2 sm:gap-4 !bg-red-950/95 backdrop-blur-xl border border-red-800 border-l-4 border-l-red-500 p-4 sm:p-6 rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.2)] w-[calc(100vw-24px)] sm:w-[460px] !min-w-0 !z-[9999] pointer-events-auto mx-auto sm:mx-0 mt-4 sm:mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="font-mono text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-red-400">
                {data.type === "SOS_UPDATE" ? `SOS Update: ${data.status.toUpperCase()}` : "SOS Alert"}
              </span>
            </div>
            <span className="font-display text-lg sm:text-xl font-black tracking-tight text-white uppercase">
              {data.user_name}
            </span>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-red-400 hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold text-red-300/60 uppercase tracking-widest">Situation</p>
          <p className="text-sm sm:text-base text-red-100 font-medium leading-tight">
            User is in a <span className="font-bold underline">{data.encounter_type}</span>
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold text-red-300/60 uppercase tracking-widest">Location</p>
          <p className="text-xs sm:text-sm text-red-200 line-clamp-1 italic">
            {data.location}
          </p>
        </div>

        <div className="flex justify-end pt-3 border-t border-red-800/50 mt-1 sm:mt-2">
          <button
            onClick={() => {
              const target = user?.role === "ADMIN" ? "/app/admin/cases" : "/app/attorney/cases";
              router.push(`${target}?caseId=${data.id}&type=sos`);
              toast.dismiss(t);
            }}
            className="flex items-center justify-center w-full sm:w-auto gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-200 shadow-lg shadow-red-900/40"
          >
            View
          </button>
        </div>
      </div>
    ), {
      duration: 4000, // Longer for emergencies
      position: "top-left"
    });
  };

  const showIntakeNotification = (data: any) => {
    toast.custom((t) => (
      <div className="animate-in fade-in slide-in-from-top-5 sm:slide-in-from-left-5 flex flex-col gap-2 sm:gap-4 !bg-titanium-900/95 backdrop-blur-xl border border-titanium-700 border-l-4 border-l-action p-3.5 sm:p-6 rounded-lg shadow-2xl w-[calc(100vw-24px)] sm:w-[440px] !min-w-0 !z-[9999] pointer-events-auto mx-auto sm:mx-0 mt-4 sm:mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-action animate-pulse shrink-0" />
              <span className="font-mono text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-action truncate">
                {data.type === "CIVIL_UPDATE" ? `Case Update: ${data.status.toUpperCase()}` : "New Case Assigned"}
              </span>
            </div>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-titanium-50 truncate">
              {data.user_name}
            </span>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-titanium-600 hover:text-titanium-400 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-titanium-300 font-bold line-clamp-1">
            {data.subject}
          </p>
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${data.urgency === "high" ? "bg-red-900/30 text-red-400" : "bg-titanium-800 text-titanium-400"}`}>
            {data.urgency} Urgency
          </span>
        </div>

        <div className="flex justify-end pt-2 border-t border-titanium-800/50 mt-1 sm:mt-2">
          <button
            onClick={() => {
              const target = user?.role === "ADMIN" ? "/app/admin/cases" : "/app/attorney/cases";
              router.push(`${target}?caseId=${data.id}&type=civil`);
              toast.dismiss(t);
            }}
            className="flex items-center justify-center w-full sm:w-auto gap-2 bg-action hover:bg-action-hover text-titanium-950 px-6 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-action/20"
          >
            Review Case
          </button>
        </div>
      </div>
    ), {
      duration: 2000,
      position: "top-left"
    });
  };

  const showUserConfirmationNotification = (data: any) => {
    const isSos = data.type === "SOS_CONFIRMATION" || data.type === "SOS_UPDATE_CONFIRMATION";
    const isUpdate = data.type.includes("UPDATE");

    const title = isUpdate
      ? (isSos ? "SOS Status Updated" : "Case Status Updated")
      : (isSos ? "SOS Triggered" : "Intake Filed");

    const subtitle = isSos ? data.encounter_type : data.subject;
    const typeParam = isSos ? "sos" : "civil";

    toast.custom((t) => (
      <div className="animate-in fade-in slide-in-from-top-5 sm:slide-in-from-left-5 flex flex-col gap-2 sm:gap-4 !bg-titanium-900/95 backdrop-blur-xl border border-titanium-700 border-l-4 border-l-action p-3.5 sm:p-6 rounded-lg shadow-2xl w-[calc(100vw-24px)] sm:w-[440px] !min-w-0 !z-[9999] pointer-events-auto mx-auto sm:mx-0 mt-4 sm:mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-action animate-pulse shrink-0" />
              <span className="font-mono text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-action truncate">
                {isUpdate ? `Your Case Status: ${data.status.toUpperCase()}` : "Request Pending"}
              </span>
            </div>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-titanium-50 truncate">
              {title}
            </span>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-titanium-600 hover:text-titanium-400 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold text-titanium-500 uppercase tracking-widest">{isSos ? "Type" : "Subject"}</p>
          <p className="text-sm text-titanium-200 font-medium leading-tight truncate">
            {subtitle}
          </p>
        </div>

        <p className="text-xs text-titanium-400 leading-relaxed italic">
          {isUpdate
            ? `Your request has been ${data.status} by our team. Check details for more info.`
            : "Your request is currently being reviewed by our legal team."}
        </p>

        <div className="flex justify-end pt-2 border-t border-titanium-800/50 mt-1 sm:mt-2">
          <button
            onClick={() => {
              router.push(`/app/history?caseId=${data.id}&type=${typeParam}`);
              toast.dismiss(t);
            }}
            className="flex items-center gap-2 bg-action/10 hover:bg-action text-action hover:text-white px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-sm text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all duration-200 shadow-lg shadow-action/5"
          >
            View Details
          </button>
        </div>
      </div>
    ), {
      duration: 2000,
      position: "top-left"
    });
  };

  return null;
}
