"use client";

import { useSearchParams, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import LiveKitVideoCall from "@/components/LiveKitVideoCall";
import { useEffect, useState } from "react";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function CallPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  const roomId = params.roomId as string;
  const userName = searchParams.get("name") || user?.full_name || "Guest";
  const callType = (searchParams.get("type") as "video" | "audio") || "video";

  const callId = searchParams.get("callId");
  const isCaller = searchParams.get("isCaller") === "true";
  const isSos = searchParams.get("isSos") === "true";
  const receiverId = searchParams.get("receiverId");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return <LoadingScreen message="Initializing secure call..." />;
  }

  return (
    <div className="h-[100dvh] w-screen bg-black overflow-hidden">
      <LiveKitVideoCall
        room={roomId}
        username={userName}
        type={callType}
        callId={callId}
        isCaller={isCaller}
        isSos={isSos}
        receiverId={receiverId}
        onLeave={() => {
          if (user.role === "ATTORNEY") {
            window.location.href = "/app/attorney/cases";
          } else if (user.role === "ADMIN") {
            window.location.href = "/app/admin/cases";
          } else {
            window.location.href = "/app/messages";
          }
        }}
      />
    </div>
  );
}
