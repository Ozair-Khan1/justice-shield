"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/NotificationProvider";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

export function GlobalNotificationListener() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const socketRef = useRef<Socket | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const hasFetchedUnread = useRef(false);
  const [sessionSeenIds, setSessionSeenIds] = useState<Set<string>>(new Set());
  const activeNotificationIds = useRef<Set<string>>(new Set());
  const activeIncomingCall = useRef<{
    callId: string;
    toastId: string | number;
    timeoutId: any;
  } | null>(null);
  const declinedCallIds = useRef<Set<string>>(new Set());

  // Initialize sessionSeenIds from user data
  useEffect(() => {
    if (user?.seen_notification_ids) {
      setSessionSeenIds(new Set(user.seen_notification_ids));
    } else {
      setSessionSeenIds(new Set());
    }
  }, [user?.id]);

  useEffect(() => {
    hasFetchedUnread.current = false;
    activeNotificationIds.current = new Set();
    declinedCallIds.current = new Set();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (hasFetchedUnread.current) return;

    const fetchUnread = async () => {
      // Small delay to ensure UI/Toaster is ready
      await new Promise(resolve => setTimeout(resolve, 1500));

      hasFetchedUnread.current = true;
      try {
        const [chatResult, notifResult] = await Promise.allSettled([
          fetch("/api/chat/unread").then(r => r.json()),
          fetch("/api/notifications/unread").then(r => r.json())
        ]);

        if (chatResult.status === "fulfilled") {
          const chatData = chatResult.value;
          if (chatData.unreadMessages && chatData.unreadMessages.length > 0) {
            chatData.unreadMessages.forEach((msg: any) => {
              if (!activeNotificationIds.current.has(msg.id)) {
                activeNotificationIds.current.add(msg.id);
                showNotification(msg);
              }
            });
          }
        }

        if (notifResult.status === "fulfilled") {
          const notifData = notifResult.value;

          if (notifData.unreadNotifications && notifData.unreadNotifications.length > 0) {
            const newToSeen: string[] = [];

            notifData.unreadNotifications.forEach((notif: any) => {
              if (!sessionSeenIds.has(notif.id) && !activeNotificationIds.current.has(notif.id)) {

                if (notif.type === "INCOMING_CALL_RECOVERY") {
                  // Don't show call notifications if we are ALREADY in a call tab
                  if (window.location.pathname.startsWith("/call/")) return;

                  if (!activeNotificationIds.current.has(notif.id)) {
                    activeNotificationIds.current.add(notif.id);
                    showIncomingCallNotification(notif);
                  }
                  // DO NOT add to newToSeen for active calls so they can be recovered again if refresh happens
                } else if (notif.type === "SOS") {
                  activeNotificationIds.current.add(notif.id);
                  const sosLink = user.role === "ATTORNEY" ? `/app/attorney/cases?caseId=${notif.id}&type=sos`
                    : user.role === "ADMIN" ? `/app/admin/cases?caseId=${notif.id}&type=sos`
                      : `/app/history?caseId=${notif.id}&type=sos`;
                  addNotification({
                    type: "sos",
                    title: user.role === "ATTORNEY" ? "Case Assigned" : "SOS Alert",
                    message: user.role === "ATTORNEY" ? "An SOS case has been assigned to you." : "A new SOS emergency alert requires attention.",
                    link: sosLink
                  });
                  newToSeen.push(notif.id);
                } else if (notif.type === "MISSED_CALL") {
                  activeNotificationIds.current.add(notif.id);
                  showMissedCallNotification(notif);
                  newToSeen.push(notif.id);
                } else if (notif.type === "CIVIL_INTAKE") {
                  activeNotificationIds.current.add(notif.id);
                  const civilLink = user.role === "ATTORNEY" ? `/app/attorney/cases?caseId=${notif.id}&type=civil`
                    : user.role === "ADMIN" ? `/app/admin/cases?caseId=${notif.id}&type=civil`
                      : `/app/history?caseId=${notif.id}&type=civil`;
                  addNotification({
                    type: "civil",
                    title: user.role === "ATTORNEY" ? "Case Assigned" : "Civil Intake",
                    message: user.role === "ATTORNEY" ? "A civil case has been assigned to you." : "A new civil intake has been filed.",
                    link: civilLink
                  });
                  newToSeen.push(notif.id);
                } else if (notif.type === "MEMBERSHIP_EXPIRED") {
                  activeNotificationIds.current.add(notif.id);
                  addNotification({
                    type: "error",
                    title: "Membership Expired",
                    message: "Your subscription has ended. Access to emergency features is suspended. Reactivate now.",
                    link: "/pricing"
                  });
                  toast.error("Membership Expired", {
                    description: "Your protection plan has ended. Reactivate now to stay covered.",
                    action: {
                      label: "Renew Plan",
                      onClick: () => router.push("/pricing")
                    }
                  });
                  newToSeen.push(notif.id);
                } else {
                  activeNotificationIds.current.add(notif.id);
                  if (notif.type !== "MESSAGE" && notif.type !== "CALL") {
                    const fallbackLink = user.role === "ATTORNEY" ? `/app/attorney/cases`
                      : user.role === "ADMIN" ? `/app/admin/cases`
                        : `/app/history`;
                    addNotification({
                      type: "info",
                      title: "Status Update",
                      message: "You have a new status update on your case records.",
                      link: fallbackLink
                    });
                  }
                  newToSeen.push(notif.id);
                }
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

        // Done
      } catch (err) {
        console.error("fetchUnread error:", err);
      }
    };

    fetchUnread();
  }, [user?.id]);

  const addToSeen = (id: string) => {
    if (!id || !user?.id) return;
    if (!sessionSeenIds.has(id) && !activeNotificationIds.current.has(id)) {
      activeNotificationIds.current.add(id);
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
      <div className="animate-in h-fit fade-in slide-in-from-top-5 sm:slide-in-from-right-5 flex flex-col gap-2 sm:gap-4 !bg-titanium-900/90 backdrop-blur-xl border border-titanium-800 border-l-2 border-l-action p-3.5 sm:p-6 rounded-lg shadow-2xl w-[calc(100vw-24px)] sm:w-[440px] !min-w-0 !z-[9999] pointer-events-auto mx-auto sm:mx-0 mt-4 sm:mt-0">
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
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      extraHeaders: {
        "Bypass-Tunnel-Reminder": "true",
        "ngrok-skip-browser-warning": "true"
      }
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[GlobalNotification] SOCKET CONNECTED:", socket.id);
      socket.emit("join-personal-room", user.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[GlobalNotification] SOCKET CONNECTION ERROR:", err.message);
    });

    socket.on("reconnect_attempt", (attempt) => {
      console.log("[GlobalNotification] Socket reconnecting... attempt:", attempt);
    });

    socket.on("global-notification", (message: any) => {
      const currentPathname = window.location.pathname;
      const searchParams = new URLSearchParams(window.location.search);
      const chattingWithUser = searchParams.get("user");

      const isChatOpen = (currentPathname.includes("/messages") || currentPathname.includes("/chat")) && chattingWithUser === message.sender_id;

      if (!isChatOpen) {
        if (!activeNotificationIds.current.has(message.id)) {
          activeNotificationIds.current.add(message.id);
          showNotification(message);
        }
      }
    });

    socket.on("membership-expired", () => {
      addNotification({
        type: "sos",
        title: "Membership Expired",
        message: "Your protection plan has ended. Emergency SOS and civil features are locked. Reactivate now.",
        link: "/pricing"
      });
      // Force a full refresh to lock UI elements (like the layout banner & cards)
      setTimeout(() => window.location.reload(), 2000);
    });

    socket.on("sos-alert", (data: any) => {
      if (user.role === "ADMIN" && data.type === "SOS_UPDATE") {
        return;
      }
      const key = data.type === "SOS_UPDATE" ? `sos-update-${data.id}-${data.status}` : `sos-new-${data.id}`;
      if (activeNotificationIds.current.has(key)) return;
      activeNotificationIds.current.add(key);

      const currentUserId = user.id?.toString().trim();
      const ownerId = data.owner_id?.toString().trim();
      const assignedId = data.assigned_attorney_id?.toString().trim();

      // Record in center for the owner, assigned attorney, or admin
      if (ownerId === currentUserId || user.role === "ADMIN" || assignedId === currentUserId) {
        const isAssignedToMe = assignedId === currentUserId && user.role === "ATTORNEY";
        const isDispatch = !assignedId && data.type !== "SOS_UPDATE";

        // Determine title based on context
        let sosTitle = data.type === "SOS_UPDATE" ? "SOS Status Updated" : "SOS Alert Triggered";
        let sosMessage = data.type === "SOS_UPDATE"
          ? `Your SOS session status changed to ${data.status.toUpperCase()}.`
          : `A new SOS alert has been triggered by ${data.user_name || "a user"}.`;
        if (isAssignedToMe && data.status === "assigned") {
          sosTitle = "SOS Case Assigned";
          sosMessage = `An SOS case from ${data.user_name || "a user"} has been assigned to you.`;
        } else if (isDispatch && user.role === "ADMIN") {
          sosTitle = "Dispatch Required";
          sosMessage = `A new SOS alert from ${data.user_name || "a user"} requires immediate counselor assignment.`;
        }

        addNotification({
          type: "sos",
          title: sosTitle,
          message: sosMessage,
          link: user.role === "ATTORNEY"
            ? (sosMessage === "Your SOS session status changed to RESOLVED."
              ? `/app/attorney/history?caseId=${data.id}&type=sos`
              : `/app/attorney/cases?caseId=${data.id}&type=sos`)
            : user.role === "ADMIN"
              ? `/app/admin/cases?caseId=${data.id}&type=sos`
              : `/app/history?caseId=${data.id}&type=sos`
        });
      }
    });

    socket.on("new-civil-intake", (data: any) => {
      if (user.role === "ADMIN" && data.type === "CIVIL_UPDATE") {
        return;
      }
      const key = data.type === "CIVIL_UPDATE" ? `civil-update-${data.id}-${data.status}` : `civil-new-${data.id}`;
      if (activeNotificationIds.current.has(key)) return;
      activeNotificationIds.current.add(key);

      const currentUserId = user.id?.toString().trim();
      const ownerId = data.owner_id?.toString().trim();
      const assignedId = data.assigned_attorney_id?.toString().trim();

      // Record in center
      if (ownerId === currentUserId || user.role === "ADMIN" || assignedId === currentUserId) {
        const isAssignedToMe = assignedId === currentUserId && user.role === "ATTORNEY";
        const isDispatch = !assignedId && data.type !== "CIVIL_UPDATE";

        let civilTitle = data.type === "CIVIL_UPDATE" ? "Case Status Updated" : "Intake Filed";
        let civilMessage = data.type === "CIVIL_UPDATE"
          ? `Your case status changed to ${data.status.toUpperCase()}.`
          : `A new civil intake has been filed for ${data.subject || "Legal Matter"}.`;

        if (isAssignedToMe && data.status === "assigned") {
          civilTitle = "Civil Case Assigned";
          civilMessage = `A civil case for ${data.subject || "Legal Matter"} has been assigned to you.`;
        } else if (isDispatch && user.role === "ADMIN") {
          civilTitle = "Assignment Required";
          civilMessage = `A new civil intake for ${data.subject || "Legal Matter"} requires counselor assignment.`;
        }

        addNotification({
          type: "civil",
          title: civilTitle,
          message: civilMessage,
          link: user.role === "ATTORNEY"
            ? (civilMessage === "Your SOS session status changed to RESOLVED."
              ? `/app/attorney/history?caseId=${data.id}&type=civil`
              : `/app/attorney/cases?caseId=${data.id}&type=civil`)
            : user.role === "ADMIN"
              ? `/app/admin/cases?caseId=${data.id}&type=civil`
              : `/app/history?caseId=${data.id}&type=civil`
        });
      }
    });

    socket.on("incoming-video-call", (data: any) => {
      console.log(`[GlobalNotification] RECEIVED incoming-video-call for callId: ${data.callId || data.id}`);
      if (window.location.pathname.startsWith("/call/")) {
        console.log("[GlobalNotification] Ignoring call notif: already in a call page.");
        return;
      }
      if (data.callId && activeNotificationIds.current.has(data.callId)) {
        console.log("[GlobalNotification] Ignoring call notif: already showing or seen.");
        return;
      }
      if (data.callId) activeNotificationIds.current.add(data.callId);
      showIncomingCallNotification(data);
    });

    socket.on("recording-saved", (data: any) => {
      console.log(`[GlobalNotification] RECEIVED recording-saved for callId: ${data.callId}`);

      // Prevent duplicate notifications
      const key = `recording-saved-${data.callId}`;
      if (activeNotificationIds.current.has(key)) {
        return;
      }
      activeNotificationIds.current.add(key);

      toast.custom((t) => (
        <div className="animate-in h-fit fade-in slide-in-from-top-5 sm:slide-in-from-right-5 flex flex-col gap-2 sm:gap-4 !bg-titanium-900/90 backdrop-blur-xl border border-titanium-800 border-l-2 border-l-action p-3.5 sm:p-6 rounded-lg shadow-2xl w-[calc(100vw-24px)] sm:w-[440px] !min-w-0 !z-[9999] pointer-events-auto mx-auto sm:mx-0 mt-4 sm:mt-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-action animate-pulse shrink-0" />
                <span className="font-mono text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-action truncate">
                  Recording Saved
                </span>
              </div>
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-titanium-50 truncate">
                Call Recording Available
              </span>
            </div>
            <button
              onClick={() => toast.dismiss(t)}
              className="text-titanium-600 hover:text-titanium-400 transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>

          <p className="text-xs sm:text-sm text-titanium-400 leading-relaxed">
            The recording for your recent call is now processed and saved.
          </p>

          <div className="flex justify-end mt-2">
            <button
              onClick={() => {
                toast.dismiss(t);
                window.location.href = "/app/recordings";
              }}
              className="text-xs font-bold text-action hover:underline"
            >
              View Recordings
            </button>
          </div>
        </div>
      ));
    });

    const handleMissedCall = (data: any) => {
      const callId = data.callId || data.id;
      if (declinedCallIds.current.has(callId)) return;

      const key = `missed-call-${callId}`;
      if (activeNotificationIds.current.has(key)) return;
      activeNotificationIds.current.add(key);

      // Dismiss active incoming toast if it matches this call
      if (activeIncomingCall.current && activeIncomingCall.current.callId === callId) {
        toast.dismiss(activeIncomingCall.current.toastId);
        clearTimeout(activeIncomingCall.current.timeoutId);
        activeIncomingCall.current = null;
      }

      showMissedCallNotification({
        id: data.callId || data.id,
        caller_name: data.callerName || data.caller_name || "Unknown",
        call_type: data.callType || data.call_type || "video",
        timestamp: data.timestamp || new Date().toISOString()
      });
    };

    socket.on("call-missed", handleMissedCall);
    socket.on("call-cancelled", handleMissedCall);

    socket.on("case-accepted", (data: any) => {
      const key = `case-accepted-${data.caseId}`;
      if (activeNotificationIds.current.has(key)) return;
      activeNotificationIds.current.add(key);

      addNotification({
        type: "success",
        title: "Attorney Accepted",
        message: `${data.attorneyName} has accepted your case.`,
        link: user.role === "ATTORNEY"
          ? `/app/attorney/cases?caseId=${data.caseId}&type=${data.caseType || "civil"}`
          : user.role === "ADMIN"
            ? `/app/admin/cases?caseId=${data.caseId}&type=${data.caseType || "civil"}`
            : `/app/history?caseId=${data.caseId}&type=${data.caseType || "civil"}`
      });
    });

    socket.on("attorney-assigned", (data: any) => {
      // data: { userId, attorneyName, caseSubject, caseId, caseType }
      const key = `attorney-assigned-${data.caseId}`;
      if (activeNotificationIds.current.has(key)) return;
      activeNotificationIds.current.add(key);

      // Toast REMOVED as per request - only record in center
      // showAttorneyAssignedNotification(data);

      addNotification({
        type: "info",
        title: "Attorney Assigned",
        message: `${data.attorneyName} was assigned to your case.`,
        link: user.role === "ATTORNEY"
          ? `/app/attorney/cases?caseId=${data.caseId}&type=${data.caseType || "civil"}`
          : user.role === "ADMIN"
            ? `/app/admin/cases?caseId=${data.caseId}&type=${data.caseType || "civil"}`
            : `/app/history?caseId=${data.caseId}&type=${data.caseType || "civil"}`
      });
    });

    socket.on("case-rejected", (data: any) => {      // data: { userId, attorneyName, caseSubject, caseId, caseType, reason }
      const key = `case-rejected-${data.caseId}`;
      if (activeNotificationIds.current.has(key)) return;
      activeNotificationIds.current.add(key);

      // Toast REMOVED as per request - only record in center
      // showCaseRejectedNotification(data);

      addNotification({
        type: "error",
        title: "Case Rejected",
        message: `${data.attorneyName} could not accept your case. Reason: ${data.reason}`,
        link: user.role === "ATTORNEY"
          ? `/app/attorney/cases?caseId=${data.caseId}&type=${data.caseType || "civil"}`
          : user.role === "ADMIN"
            ? `/app/admin/cases?caseId=${data.caseId}&type=${data.caseType || "civil"}`
            : `/app/history?caseId=${data.caseId}&type=${data.caseType || "civil"}`
      });
    });

    // Vendor application — admin only
    socket.on("vendor-application", (data: any) => {
      if (user.role !== "ADMIN") return;

      const key = `vendor-application-${data.id}`;
      if (activeNotificationIds.current.has(key)) return;
      activeNotificationIds.current.add(key);

      const vendorLabel = data.vendor_type === "ATTORNEY" ? "Attorney" : "Marketing Specialist";

      addNotification({
        type: "info",
        title: "New Vendor Application",
        message: `${data.full_name}${data.firm_name ? ` (${data.firm_name})` : ""} applied as a ${vendorLabel}.`,
        link: "/app/admin/vendors",
      });
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

  const showCaseAcceptedNotification = (data: any) => {
    toast.custom((t) => (
      <div className="animate-in fade-in slide-in-from-top-5 sm:slide-in-from-left-5 flex flex-col gap-2 sm:gap-4 !bg-emerald-950/95 backdrop-blur-xl border border-emerald-800 border-l-4 border-l-emerald-500 p-4 sm:p-6 rounded-lg shadow-[0_0_30px_rgba(16,185,129,0.2)] w-[calc(100vw-24px)] sm:w-[460px] !min-w-0 !z-[9999] pointer-events-auto mx-auto sm:mx-0 mt-4 sm:mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="font-mono text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-emerald-400">
                Case Accepted
              </span>
            </div>
            <span className="font-display text-lg sm:text-xl font-black tracking-tight text-white">
              {data.attorneyName}
            </span>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-emerald-400 hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold text-emerald-300/60 uppercase tracking-widest">Your Case</p>
          <p className="text-sm sm:text-base text-emerald-100 font-medium leading-tight line-clamp-2">
            {data.caseSubject || "Civil Intake"}
          </p>
        </div>

        <p className="text-xs text-emerald-200/80">
          An attorney has accepted your case and will be in contact with you shortly.
        </p>

        <div className="flex justify-end pt-3 border-t border-emerald-800/50 mt-1 sm:mt-2">
          <button
            onClick={() => {
              router.push(`/app/history?caseId=${data.caseId}&type=${data.caseType || "civil"}`);
              toast.dismiss(t);
            }}
            className="flex items-center justify-center w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-200 shadow-lg shadow-emerald-900/40"
          >
            View Case
          </button>
        </div>
      </div>
    ), {
      duration: 4000,
      position: "top-left"
    });
  };

  const showCaseRejectedNotification = (data: any) => {
    toast.custom((t) => (
      <div className="animate-in fade-in slide-in-from-top-5 sm:slide-in-from-left-5 flex flex-col gap-2 sm:gap-4 !bg-red-950/95 backdrop-blur-xl border border-red-800 border-l-4 border-l-red-500 p-4 sm:p-6 rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.2)] w-[calc(100vw-24px)] sm:w-[460px] !min-w-0 !z-[9999] pointer-events-auto mx-auto sm:mx-0 mt-4 sm:mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="font-mono text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-red-400">
                Case Rejected
              </span>
            </div>
            <span className="font-display text-lg sm:text-xl font-black tracking-tight text-white">
              {data.attorneyName}
            </span>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-red-400 hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold text-red-300/60 uppercase tracking-widest">Case Records</p>
          <p className="text-sm sm:text-base text-red-100 font-medium leading-tight line-clamp-2">
            {data.caseSubject || "Civil Intake"}
          </p>
        </div>

        <div className="rounded border border-red-500/20 bg-red-500/5 p-3">
          <p className="text-[10px] uppercase font-bold text-red-400 mb-1 tracking-widest">Reason for Rejection</p>
          <p className="text-xs text-red-100 leading-relaxed italic">
            "{data.reason || "Case does not meet current criteria for representation."}"
          </p>
        </div>

        <div className="flex justify-end pt-3 border-t border-red-800/50 mt-1 sm:mt-2">
          <button
            onClick={() => {
              router.push(`/app/history?caseId=${data.caseId}&type=${data.caseType || "civil"}`);
              toast.dismiss(t);
            }}
            className="flex items-center justify-center w-full sm:w-auto gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-200 shadow-lg shadow-red-900/40"
          >
            Review Reason
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: "top-left"
    });
  };

  const showAttorneyAssignedNotification = (data: any) => {
    toast.custom((t) => (
      <div className="animate-in fade-in slide-in-from-top-5 sm:slide-in-from-left-5 flex flex-col gap-2 sm:gap-4 !bg-sky-950/95 backdrop-blur-xl border border-sky-800 border-l-4 border-l-sky-500 p-4 sm:p-6 rounded-lg shadow-[0_0_30px_rgba(14,165,233,0.2)] w-[calc(100vw-24px)] sm:w-[460px] !min-w-0 !z-[9999] pointer-events-auto mx-auto sm:mx-0 mt-4 sm:mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
              <span className="font-mono text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-sky-400">
                Attorney Assigned
              </span>
            </div>
            <span className="font-display text-lg sm:text-xl font-black tracking-tight text-white">
              {data.attorneyName}
            </span>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-sky-400 hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <div className="space-y-1">
          <p className="text-[11px] font-bold text-sky-300/60 uppercase tracking-widest">Case Records</p>
          <p className="text-sm sm:text-base text-sky-100 font-medium leading-tight line-clamp-2">
            {data.caseSubject || "Civil Intake"}
          </p>
        </div>

        <p className="text-xs text-sky-200/80">
          A legal counsel has been assigned to your case by our administrative team.
        </p>

        <div className="flex justify-end pt-3 border-t border-sky-800/50 mt-1 sm:mt-2">
          <button
            onClick={() => {
              router.push(`/app/history?caseId=${data.caseId}&type=${data.caseType || "civil"}`);
              toast.dismiss(t);
            }}
            className="flex items-center justify-center w-full sm:w-auto gap-2 bg-sky-600 hover:bg-sky-500 text-white px-6 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-200 shadow-lg shadow-sky-900/40"
          >
            View Details
          </button>
        </div>
      </div>
    ), {
      duration: 4000,
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

  const showMissedCallNotification = (notif: any) => {
    toast.custom((t) => (
      <div className="animate-in fade-in slide-in-from-top-5 sm:slide-in-from-right-5 flex flex-col gap-2 sm:gap-4 !bg-titanium-900/90 backdrop-blur-xl border border-titanium-800 border-l-2 border-l-red-500 p-3.5 sm:p-6 rounded-lg shadow-2xl w-[calc(100vw-24px)] sm:w-[440px] !min-w-0 !z-[9999] pointer-events-auto mx-auto sm:mx-0 mt-4 sm:mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
              <span className="font-mono text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-red-500 truncate">
                Missed {notif.call_type || "Call"}
              </span>
            </div>
            <span className="font-display text-base sm:text-lg font-bold tracking-tight text-titanium-50 truncate">
              {notif.caller_name}
            </span>
          </div>
          <button
            onClick={() => toast.dismiss(t)}
            className="text-titanium-600 hover:text-titanium-400 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-titanium-400 leading-relaxed">
          You missed a {notif.call_type || "call"} from {notif.caller_name} at {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
        </p>

        <div className="flex justify-end pt-2 border-t border-titanium-800/50 mt-1 sm:mt-2">
          <button
            onClick={() => {
              toast.dismiss(t);
            }}
            className="flex items-center gap-2 bg-titanium-800 hover:bg-titanium-700 text-titanium-300 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-sm text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-all duration-200"
          >
            Dismiss
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: "top-right"
    });
  };

  const showIncomingCallNotification = (data: any) => {
    let handled = false;
    const callLabel = data.callType === "audio" ? "Audio Call" : "Video Call";
    const callIcon = data.callType === "audio" ?
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg> :
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>;

    // Auto-decline timer
    const timeoutDuration = data.isSos ? 30000 : 45000; // 60s for SOS, 45s for normal
    const timeoutId = setTimeout(async () => {
      if (!handled) {
        handled = true;
        if (data.callId) {
          fetch(`/api/calls/${data.callId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "missed" }),
            keepalive: true
          }).catch(err => console.error("Failed to mark call as missed:", err));
        }

        // IMPORTANT: For SOS, do NOT emit decline signal. 
        // We want the user's recording to keep running indefinitely even if no one picks up.
        if (!data.isSos && socketRef.current && data.callerId) {
          socketRef.current.emit("decline-video-call", {
            callerId: data.callerId,
            declinerName: "System (No Answer)"
          });
        }
        toast.dismiss(incomingToastId);

        // Show missed call notification after auto-decline
        const missedNotif = {
          id: data.callId,
          caller_name: data.senderName,
          call_type: data.callType || "video",
          timestamp: new Date().toISOString()
        };
        showMissedCallNotification(missedNotif);
      }
    }, timeoutDuration);

    const incomingToastId = toast.custom((t) => (
      <div className="animate-in fade-in slide-in-from-top-5 sm:slide-in-from-right-5 flex flex-col gap-2 sm:gap-4 !bg-action/90 backdrop-blur-xl border border-white/20 p-4 sm:p-6 rounded-lg shadow-[0_0_40px_rgba(var(--action-rgb),0.3)] w-[calc(100vw-24px)] sm:w-[440px] !min-w-0 !z-[9999] pointer-events-auto mx-auto sm:mx-0 mt-4 sm:mt-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-white animate-ping shrink-0" />
              <span className="font-mono text-[10px] sm:text-[12px] font-black uppercase tracking-[0.2em] text-white">
                Incoming {callLabel}
              </span>
            </div>
            <span className="font-display text-lg sm:text-xl font-black tracking-tight text-white uppercase mt-1">
              {data.senderName}
            </span>
          </div>
          <button
            onClick={() => {
              toast.dismiss(t);
            }}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
          </button>
        </div>

        <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-medium">
          {data.senderName} is inviting you to a {data.callType || "video"} consultation.
        </p>

        <div className="flex gap-3 pt-3 border-t border-white/20 mt-1 sm:mt-2">
          <button
            onClick={async () => {
              handled = true;
              clearTimeout(timeoutId);
              if (data.callId) {
                declinedCallIds.current.add(data.callId);
                fetch(`/api/calls/${data.callId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "declined" }),
                  keepalive: true
                }).catch(err => console.error("Failed to mark call as declined:", err));
              }
              if (!data.isSos && socketRef.current && data.callerId) {
                console.log(`[GlobalNotification] Declining call for callerId: ${data.callerId}`);
                socketRef.current.emit("decline-video-call", {
                  callerId: data.callerId,
                  declinerName: user?.full_name || "User"
                });
              }
              toast.dismiss(t);
            }}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all"
          >
            Decline
          </button>
          <button
            onClick={async () => {
              handled = true;
              clearTimeout(timeoutId);
              if (data.callId) {
                fetch(`/api/calls/${data.callId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "answered" }),
                  keepalive: true
                }).catch(err => console.error("Failed to mark call as answered:", err));
              }
              const url = `/call/${data.room}?name=${encodeURIComponent(user?.full_name || user?.id || "User")}&type=${data.callType || "video"}&callId=${data.callId || ""}`;
              window.location.href = url;
              toast.dismiss(t);
            }}
            className="flex-1 bg-white text-action px-4 py-2.5 rounded-sm text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-black/10 flex items-center justify-center gap-2"
          >
            {callIcon}
            Join Call
          </button>
        </div>
      </div>
    ), {
      duration: 15000,
      position: "top-right"
    });

    // Track this call
    activeIncomingCall.current = {
      callId: data.callId,
      toastId: incomingToastId,
      timeoutId: timeoutId,
    };
  };

  return null;
}

