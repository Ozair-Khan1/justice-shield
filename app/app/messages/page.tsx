"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import ChatDashboard from "@/components/ChatDashboard";
import { motion } from "framer-motion";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useRouter } from "next/navigation";

export default function MessagesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const router = useRouter()

  const isFree = user?.role === "USER" && user?.membership_tier === "free" && user?.stripe_customer_id === null && user?.stripe_subscription_id === null && user?.subscription_cancel_at === null;

  useEffect(() => {
    setLoading(true);
    if(isFree) router.push("/pricing")
    setTimeout(() => setLoading(false), 1000);
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading messages" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="h-[calc(100vh-160px)]"
    >
      <Suspense fallback={
        <div className="h-full flex items-center justify-center border border-titanium-800 rounded-3xl">
          <div className="size-8 rounded-full border-2 border-action border-t-transparent animate-spin" />
        </div>
      }>
        <ChatDashboard
          userId={user?.id || ""}
          userName={user?.full_name}
        />
      </Suspense>
    </motion.div>
  );
}
