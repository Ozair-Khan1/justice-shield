"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useRemoteParticipants,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { X, PhoneOff, ShieldCheck } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/lib/auth";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

interface LiveKitVideoCallProps {
  room: string;
  username: string;
  type?: "video" | "audio";
  onLeave: () => void;
  callId?: string | null;
  isCaller?: boolean;
  isSos?: boolean;
  receiverId?: string | null;
}

function ParticipantTracker({ onUpdate }: { onUpdate: (count: number) => void }) {
  const participants = useRemoteParticipants();
  useEffect(() => {
    onUpdate(participants.length);
  }, [participants.length, onUpdate]);
  return null;
}

function MediaReadyTracker({ onReady }: { onReady: (ready: boolean) => void }) {
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);
  useEffect(() => {
    const hasRemoteMedia = tracks.some(
      (t) => !t.participant.isLocal && t.publication.isSubscribed
    );
    if (hasRemoteMedia) {
      onReady(true);
    }
  }, [tracks, onReady]);
  return null;
}

export default function LiveKitVideoCall({
  room,
  username,
  type = "video",
  onLeave,
  callId,
  isCaller,
  isSos,
  receiverId,
}: LiveKitVideoCallProps) {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeclined, setIsDeclined] = useState(false);
  const [declinerName, setDeclinerName] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const isConnected = useRef(false);
  const [isConnectedState, setIsConnectedState] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [shouldRecord, setShouldRecord] = useState(isSos ?? false);
  const [showRecordingPrompt, setShowRecordingPrompt] = useState(isCaller && !isSos);
  const [isRecording, setIsRecording] = useState(false);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const egressStarted = useRef(false);
  const userId = user?.id;

  // ── Socket setup ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const socket = io(SOCKET_URL, {
      transports: ["polling", "websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 20000,
      extraHeaders: { "Bypass-Tunnel-Reminder": "true" },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-personal-room", userId);
    });

    socket.on("video-call-declined", (data: any) => {
      setIsDeclined(true);
      setDeclinerName(data.declinerName);
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // ── Token fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const url = `/api/livekit/token?room=${encodeURIComponent(room)}&username=${encodeURIComponent(username)}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.error) setError(data.error);
        else setToken(data.token);
      } catch {
        setError("Failed to fetch LiveKit token");
      }
    })();
  }, [room, username]);

  // ── Stop recording (stable ref) ──────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (!isCaller || !callId) return;
    console.log("[Egress] Stopping recording...");
    setIsRecording(false);
    fetch("/api/livekit/egress/stop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callId }),
    }).catch((err) => console.error("[Egress] Stop failed:", err));
  }, [isCaller, callId]);

  // ── Start recording — only depends on the conditions that gate it ────────────
  // Intentionally excludes isConnectedState to prevent timer cancellation on connect
  useEffect(() => {
    if (
      !isCaller ||
      !callId ||
      !userId ||
      !isMediaReady ||
      !shouldRecord ||
      egressStarted.current
    ) return;

    egressStarted.current = true;
    console.log("[Egress] Media ready. Starting recording in 2 seconds...");

    const timer = setTimeout(() => {
      setIsRecording(true);
      fetch("/api/livekit/egress/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: room, callId, recordedById: userId }),
      }).catch((err) => {
        console.error("[Egress] Recording failed to start:", err);
        setIsRecording(false);
        egressStarted.current = false;
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [isMediaReady, isCaller, callId, room, shouldRecord, userId]);

  // ── Stop recording if user toggles off mid-call ──────────────────────────────
  useEffect(() => {
    if (!shouldRecord && egressStarted.current) {
      stopRecording();
      egressStarted.current = false;
    }
  }, [shouldRecord, stopRecording]);

  // ── beforeunload cleanup ─────────────────────────────────────────────────────
  useEffect(() => {
    const endCall = () => {
      if (!callId) return;

      if (egressStarted.current) stopRecording();

      if (isCaller && !isConnected.current && socketRef.current && receiverId) {
        socketRef.current.emit("call-cancelled", {
          receiverId,
          callerId: userId,
          callerName: username,
          callId,
        });
      }

      fetch(`/api/calls/${callId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: isConnectedState ? "ended" : "missed" }),
        keepalive: true,
      }).catch((err) => console.error("Failed to end call log:", err));
    };

    window.addEventListener("beforeunload", endCall);
    return () => window.removeEventListener("beforeunload", endCall);
  }, [callId, isCaller, receiverId, username, userId, isConnectedState, stopRecording]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleEndCall = useCallback(() => {
    if (egressStarted.current) stopRecording();
    onLeave();
  }, [stopRecording, onLeave]);

  const handleMediaReady = useCallback((ready: boolean) => {
    setIsMediaReady(ready);
  }, []);

  const handleParticipantUpdate = useCallback((count: number) => {
    setParticipantCount(count);
  }, []);

  const handleConnected = useCallback(() => {
    isConnected.current = true;
    setIsConnectedState(true);
    if (isCaller && socketRef.current && receiverId) {
      socketRef.current.emit("start-video-call", {
        room,
        callId,
        receiverId,
        senderName: username,
        callerId: userId,
        callType: type,
        isSos,
      });
    }
  }, [isCaller, receiverId, room, callId, username, userId, type, isSos]);

  const handleError = useCallback((err: Error) => {
    if (err.message?.includes("Abort handler called")) {
      console.warn("Ignoring Strict Mode abort error");
      return;
    }
    setError(`LiveKit Error: ${err.message}`);
  }, []);

  // ── Render guards ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-center">
        <p className="font-bold mb-2 text-xl tracking-tight">Configuration Error</p>
        <p className="text-red-300 font-mono text-sm mb-2 font-bold bg-black p-2 rounded">
          Error: {error}
        </p>
        <p className="text-red-300 font-mono text-sm mb-2 font-bold bg-black p-2 rounded">
          URL: {process.env.NEXT_PUBLIC_LIVEKIT_URL}
        </p>
        <p className="opacity-80 max-w-sm mb-6">
          Ensure your local LiveKit server is running at ws://localhost:7800
        </p>
        <button
          onClick={onLeave}
          className="px-6 py-2 bg-red-500 text-white rounded-lg font-bold"
        >
          Close
        </button>
      </div>
    );
  }

  if (isDeclined) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-black h-screen text-white text-center">
        <div className="size-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6">
          <PhoneOff className="size-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Call Declined</h2>
        <p className="text-titanium-400 mb-8">{declinerName} is unavailable.</p>
        <button
          onClick={onLeave}
          className="px-8 py-3 bg-titanium-800 text-white rounded-lg font-bold"
        >
          Dismiss
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-screen bg-black">
        <div className="w-8 h-8 border-2 border-action border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-titanium-400 font-mono text-[10px] uppercase tracking-[0.2em]">
          Connecting to Local Server...
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-black" style={{ height: "100dvh" }}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-titanium-950/90 backdrop-blur-sm border-b border-titanium-800">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-tight">
              {type === "audio" ? "Audio Call" : "Video Call"}
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-titanium-500 hidden sm:block">
                Room: {room}
              </p>
              {isRecording && (
                <div className="flex items-center gap-1.5 text-[8px] text-red-500 font-bold uppercase tracking-widest">
                  <div className="size-1.5 bg-red-500 rounded-full animate-pulse" />
                  Recording Active
                </div>
              )}
            </div>
          </div>
        </div>
        {isConnectedState && (
          <button
            onClick={handleEndCall}
            className="p-2 hover:bg-titanium-800 rounded-full transition-colors text-titanium-400"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main content */}
      <div
        className="absolute inset-0"
        style={{ top: "48px", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {showRecordingPrompt ? (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-titanium-950">
            <div className="bg-titanium-900 border border-titanium-800 p-10 rounded-3xl max-w-md w-full mx-4 shadow-2xl text-center">
              <div className="size-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-8 text-blue-500">
                <ShieldCheck className="size-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                Call Recording
              </h3>
              <p className="text-titanium-400 text-sm mb-10 leading-relaxed">
                Would you like to record this session? The recording will be stored
                locally on your server for case documentation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setShouldRecord(false);
                    setShowRecordingPrompt(false);
                  }}
                  className="flex-1 px-6 py-4 bg-titanium-800 text-titanium-300 rounded-2xl font-bold hover:bg-titanium-700 transition-all active:scale-95"
                >
                  No, Skip
                </button>
                <button
                  onClick={() => {
                    setShouldRecord(true);
                    setShowRecordingPrompt(false);
                  }}
                  className="flex-1 px-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  Yes, Record
                </button>
              </div>
            </div>
          </div>
        ) : (
          <LiveKitRoom
            video={type === "video"}
            audio={true}
            token={token}
            serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7800"}
            onDisconnected={handleEndCall}
            onError={handleError}
            onConnected={handleConnected}
            style={{ height: "100%", width: "100%" }}
            data-lk-theme="default"
          >
            <ParticipantTracker onUpdate={handleParticipantUpdate} />
            <MediaReadyTracker onReady={handleMediaReady} />
            <VideoConference />
            <RoomAudioRenderer />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}