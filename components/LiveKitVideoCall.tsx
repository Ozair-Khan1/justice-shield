"use client";

import { useEffect, useState, useRef } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  PreJoin,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { X, PhoneOff } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

interface LiveKitVideoCallProps {
  room: string;
  username: string;
  type?: "video" | "audio";
  onLeave: () => void;
}

export default function LiveKitVideoCall({ room, username, type = "video", onLeave }: LiveKitVideoCallProps) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [preJoinPassed, setPreJoinPassed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeclined, setIsDeclined] = useState(false);
  const [declinerName, setDeclinerName] = useState("");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[LiveKitVideoCall] Socket connected. Joining personal room: ${user.id}`);
      socket.emit("join-personal-room", user.id);
    });

    socket.on("start-video-call", (data) => {
      console.log(`Video call started in ${data.room} by ${data.senderName} for ${data.receiverId}`);
      // Assuming io.to is used on server-side, not client
    });

    socket.on("decline-video-call", (data) => {
      console.log(`Video call declined by ${data.declinerName} for caller ${data.callerId}`);
    });

    socket.on("video-call-declined", (data: any) => {
      console.log(`[LiveKitVideoCall] RECEIVED video-call-declined from ${data.declinerName}`);
      setIsDeclined(true);
      setDeclinerName(data.declinerName);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const callId = searchParams.get("callId");

    const endCall = () => {
      if (callId) {
        // Use keepalive to ensure request finishes even if window closes
        fetch(`/api/calls/${callId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ended" }),
          keepalive: true
        }).catch(err => console.error("Failed to end call log:", err));
      }
    };

    window.addEventListener("beforeunload", endCall);

    return () => {
      window.removeEventListener("beforeunload", endCall);
      // We no longer call endCall() here to prevent closing the call when the window is still open or refreshing
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const url = `/api/livekit/token?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`;
        const resp = await fetch(url);
        const data = await resp.json();

        if (data.error) {
          setError(data.error);
        } else {
          setToken(data.token);
        }
      } catch (e) {
        setError("Failed to fetch LiveKit token");
      }
    })();
  }, [room, username]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500">
        <p className="font-bold mb-2">Error</p>
        <p>{error}</p>
        <button
          onClick={onLeave}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  if (isDeclined) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-black h-screen text-white">
        <div className="size-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <PhoneOff className="size-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Call Declined</h2>
        <p className="text-titanium-400 mb-8">{declinerName} is unavailable at the moment.</p>
        <button
          onClick={onLeave}
          className="px-8 py-3 bg-titanium-800 hover:bg-titanium-700 text-white rounded-lg font-bold transition-colors"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-titanium-900 border border-titanium-800 rounded-xl">
        <div className="w-8 h-8 border-2 border-titanium-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-titanium-400">Joining video call...</p>
      </div>
    );
  }

  return (
    <div
      className="relative w-full bg-black"
      style={{ height: "100dvh" }}
    >
      {/* Header — compact on mobile */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-titanium-950/90 backdrop-blur-sm border-b border-titanium-800">
        <div>
          <h2 className="text-sm font-bold text-white">{type === "audio" ? "Audio Call" : "Video Call"}</h2>
          <p className="text-[10px] text-titanium-500 hidden sm:block">Room: {room}</p>
        </div>
        <button
          onClick={onLeave}
          className="p-2 hover:bg-titanium-800 rounded-full transition-colors text-titanium-400"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video area — fills from below header to bottom, uses padding-bottom on mobile for safe area */}
      <div
        className="absolute inset-0"
        style={{ top: "48px", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <LiveKitRoom
          video={type === "video"}
          audio={true}
          token={token}
          serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          onDisconnected={onLeave}
          onConnected={() => { }}
          onError={(err) => {
            console.error("[LiveKit] Connection Error:", err);
            setError(`LiveKit Error: ${err.message}`);
          }}
          style={{ height: "100%", width: "100%" }}
          data-lk-theme="default"
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  );
}
