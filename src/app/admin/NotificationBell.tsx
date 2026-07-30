"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  orderId: string | null;
  orderNumber: string | null;
};

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch("/api/admin/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setUnreadCount(data.unreadCount ?? 0);
    setNotifications(data.notifications ?? []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount + poll is intentional
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleClick(n: Notification) {
    if (!n.read) {
      await fetch(`/api/admin/notifications/${n.id}/read`, { method: "POST" });
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.orderId) router.push(`/admin/orders/${n.orderId}`);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-brand-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg py-2 text-sm z-30 max-h-96 overflow-y-auto">
          <p className="px-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Notifications
          </p>
          {notifications.length === 0 && (
            <p className="px-4 py-4 text-sm text-gray-400">No notifications yet.</p>
          )}
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 ${
                n.read ? "" : "bg-emerald-50/50"
              }`}
            >
              <p className="text-gray-800">{n.message}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {new Date(n.createdAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
