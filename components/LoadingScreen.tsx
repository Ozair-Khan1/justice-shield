"use client";

import { motion } from "framer-motion";
import { ShieldMark } from "./ShieldMark";

export function LoadingScreen({ message = "Establishing Secure Uplink..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center px-6 h-screen w-screen bg-titanium-950">
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full" />
      </div>

      <div className="relative flex flex-col items-center gap-8">
        {/* Animated Shield Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <ShieldMark className="size-20 md:size-24 text-action" />
        </motion.div>

        {/* Brand Text */}
        <div className="flex flex-col items-center gap-3 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <div className="flex flex-col items-center">
              <h1 className="font-display text-3xl font-bold uppercase italic tracking-tighter sm:text-4xl">
                Justice <span className="text-action">Shield</span>
              </h1>
              <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.5em] text-titanium-400">
                Tactical Law On Demand
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-4"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-titanium-500">
              {message}
            </span>

            {/* Loading Progress Bar */}
            <div className="h-[1px] w-48 overflow-hidden rounded-full bg-titanium-800/30">
              <motion.div
                animate={{
                  left: ["-100%", "100%"]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="relative h-full w-full bg-action/50"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Subtle Footer */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 font-mono text-[8px] uppercase tracking-[0.2em] text-titanium-800">
        Secure Uplink Active
      </div>
    </div>
  );
}
