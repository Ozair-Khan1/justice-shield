"use client";

import React from "react";
import { Phone, Globe, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CallMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBrowserCall: () => void;
  phoneNumber?: string;
  userName: string;
}

export function CallMethodModal({
  isOpen,
  onClose,
  onBrowserCall,
  phoneNumber,
  userName,
}: CallMethodModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-titanium-950 border border-titanium-800 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
        >
          {/* Header */}
          <div className="p-6 border-b border-titanium-800 flex items-center justify-between bg-titanium-900/50">
            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-tight">Call {userName}</h3>
              <p className="text-xs text-titanium-500 mt-1 uppercase tracking-widest font-mono">Select Connection Method</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-titanium-800 rounded-full transition-colors text-titanium-500 hover:text-white"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Options */}
          <div className="p-6 space-y-4">
            {/* Browser Call Option */}
            <button
              onClick={() => {
                onBrowserCall();
                onClose();
              }}
              className="w-full group flex items-center gap-4 p-4 bg-action/10 hover:bg-action border border-action/20 hover:border-action rounded-lg transition-all duration-300"
            >
              <div className="size-12 rounded-full bg-action/20 group-hover:bg-white/20 flex items-center justify-center transition-colors">
                <Globe className="size-6 text-action group-hover:text-white" />
              </div>
              <div className="text-left">
                <span className="block text-sm font-black text-white uppercase tracking-wider group-hover:text-white">Call via Browser</span>
                <span className="block text-[10px] text-action group-hover:text-white/80 uppercase font-bold mt-0.5 tracking-tight">Secure High-Fidelity Connection</span>
              </div>
            </button>

            {/* Phone Call Option */}
            {phoneNumber ? (
              <a
                href={`tel:${phoneNumber}`}
                onClick={onClose}
                className="w-full group flex items-center gap-4 p-4 bg-titanium-900/50 hover:bg-titanium-800 border border-titanium-800 rounded-lg transition-all duration-300"
              >
                <div className="size-12 rounded-full bg-titanium-800 group-hover:bg-titanium-700 flex items-center justify-center transition-colors">
                  <Phone className="size-6 text-titanium-400 group-hover:text-white" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-black text-white uppercase tracking-wider">Call Phone Number</span>
                  <span className="block text-[10px] text-titanium-500 uppercase font-bold mt-0.5 tracking-tight font-mono">{phoneNumber}</span>
                </div>
              </a>
            ) : (
              <div className="w-full flex items-center gap-4 p-4 bg-titanium-950/50 border border-titanium-900 border-dashed rounded-lg opacity-50 grayscale">
                <div className="size-12 rounded-full bg-titanium-900 flex items-center justify-center">
                  <Phone className="size-6 text-titanium-700" />
                </div>
                <div className="text-left">
                  <span className="block text-sm font-black text-titanium-700 uppercase tracking-wider">Phone Unavailable</span>
                  <span className="block text-[10px] text-titanium-800 uppercase font-bold mt-0.5 tracking-tight">No number on file</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
