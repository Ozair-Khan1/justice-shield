"use client";

import { Suspense } from "react";
import { useAuth } from "@/lib/auth";
import ChatDashboard from "@/components/ChatDashboard";
import { motion } from "framer-motion";
import { MessageSquare, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function MessagesPage() {
  const { user } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="h-[calc(100vh-160px)]"
    >
      <Suspense fallback={<div className="h-full flex items-center justify-center border border-titanium-800 rounded-3xl"><div className="size-8 rounded-full border-2 border-action border-t-transparent animate-spin" /></div>}>
        <ChatDashboard userId={user?.id || ""} />
      </Suspense>
    </motion.div>
  );
}
