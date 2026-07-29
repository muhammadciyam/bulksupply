"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Truck,
  LogOut,
  ExternalLink,
  Users,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ROLE_LABELS, type StaffRole } from "@/lib/roles";

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; roles: StaffRole[] }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
  { href: "/admin/products", label: "Products", icon: Package, roles: ["ADMIN"] },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, roles: ["ADMIN"] },
  { href: "/admin/orders", label: "Orders & Delivery", icon: Truck, roles: ["ADMIN", "CASHIER", "DELIVERY"] },
  { href: "/admin/staff", label: "Staff", icon: Users, roles: ["ADMIN"] },
];

export function AdminShell({
  children,
  userName,
  role,
}: {
  children: React.ReactNode;
  userName: string;
  role: StaffRole;
}) {
  const pathname = usePathname();
  const items = NAV.filter((item) => item.roles.includes(role));

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 shrink-0 bg-brand-navy text-white flex flex-col">
        <div className="p-5 border-b border-white/10">
          <Logo className="[&_span]:text-white [&_span:first-child]:text-white [&_span:last-child]:text-emerald-300" />
        </div>
        <nav className="flex-1 py-4">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-5 py-2.5 text-sm ${
                  active ? "bg-white/10 text-white font-semibold border-r-2 border-brand-green" : "text-white/70 hover:bg-white/5"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 px-1 py-2 text-xs text-white/60 hover:text-white"
          >
            <ExternalLink size={14} /> View storefront
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="flex items-center gap-2 px-1 py-2 text-xs text-white/60 hover:text-white"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <p className="text-sm text-gray-500">Bulk Supply Admin · {ROLE_LABELS[role]}</p>
          <p className="text-sm font-medium text-gray-700">{userName}</p>
        </header>
        <main className="flex-1 p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
