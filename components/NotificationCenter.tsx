"use client";

import { useState } from "react";
import { useNotifications } from "@/lib/NotificationProvider";
import { Bell, Check, Trash2, ExternalLink, Shield } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 text-titanium-400 hover:text-white transition-colors">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-action text-[10px] font-bold text-titanium-950">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] sm:w-[380px] p-0 bg-titanium-900 border-titanium-800 shadow-2xl z-[100]" align="end">
        <div className="flex items-center justify-between border-b border-titanium-800 px-4 py-3 bg-titanium-950/50">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-titanium-50">
              Notifications
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-action/10 px-2 py-0.5 font-mono text-[9px] font-bold text-action">
                {unreadCount} NEW
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => markAllAsRead()}
              className="p-1.5 text-titanium-500 hover:text-action transition-colors"
              title="Mark all as read"
            >
              <Check className="size-4" />
            </button>
            <button
              onClick={() => clearAll()}
              className="p-1.5 text-titanium-500 hover:text-red-400 transition-colors"
              title="Clear all"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-20 px-10 text-center">
              <div className="size-12 rounded-full bg-titanium-800/50 flex items-center justify-center mb-4">
                <Bell className="size-6 text-titanium-600" />
              </div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-titanium-500">
                No notifications yet
              </p>
              <p className="text-xs text-titanium-600 mt-1">
                Updates about your cases will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-titanium-800/50">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`relative flex flex-col gap-1.5 p-4 transition-colors hover:bg-titanium-800/30 ${
                    !notif.read ? "bg-action/5" : ""
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <NotificationIcon type={notif.type} />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-titanium-100">
                        {notif.title}
                      </span>
                    </div>
                    <span className="font-mono text-[9px] text-titanium-500 whitespace-nowrap">
                      {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-titanium-300 leading-snug">
                    {notif.message}
                  </p>
                  {notif.link && (
                    <Link
                      href={notif.link}
                      onClick={() => setIsOpen(false)}
                      className="mt-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-action hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      View Details
                    </Link>
                  )}
                  {!notif.read && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-action rounded-full shadow-[0_0_8px_rgba(212,175,55,0.4)]" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
           <div className="border-t border-titanium-800 p-2 bg-titanium-950/50">
             <Link 
               href="/app/history" 
               onClick={() => setIsOpen(false)}
               className="flex w-full items-center justify-center py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-titanium-500 hover:text-white transition-colors"
             >
               View Case History
             </Link>
           </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case "sos":
      return <div className="size-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />;
    case "civil":
      return <div className="size-2 rounded-full bg-action shadow-[0_0_8px_rgba(212,175,55,0.5)]" />;
    case "success":
      return <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />;
    case "error":
      return <div className="size-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />;
    default:
      return <div className="size-2 rounded-full bg-titanium-400" />;
  }
}
