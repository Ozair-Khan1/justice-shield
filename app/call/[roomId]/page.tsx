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
        onLeave={() => window.close()}
      />
    </div>
  );
}
