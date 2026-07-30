"use client";

import { useEffect, useState } from "react";
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
  Menu,
  X,
  Building2,
  UserCog,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ROLE_LABELS, type StaffRole } from "@/lib/roles";

const NAV: { href: string; label: string; icon: typeof LayoutDashboard; roles: StaffRole[] }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "CASHIER", "DELIVERY"] },
  { href: "/admin/products", label: "Products", icon: Package, roles: ["ADMIN"] },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, roles: ["ADMIN"] },
  { href: "/admin/orders", label: "Orders & Delivery", icon: Truck, roles: ["ADMIN", "CASHIER", "DELIVERY"] },
  { href: "/admin/accounts", label: "Customer Accounts", icon: Building2, roles: ["ADMIN"] },
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex bg-gray-50">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-brand-navy text-white flex flex-col transform transition-transform duration-200 md:static md:z-auto md:w-60 md:translate-x-0 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <Logo className="[&_span]:text-white [&_span:first-child]:text-white [&_span:last-child]:text-emerald-300" />
          <button
            onClick={() => setDrawerOpen(false)}
            className="md:hidden text-white/70 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
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
          <Link
            href="/admin/account"
            className="flex items-center gap-2 px-1 py-2 text-xs text-white/60 hover:text-white"
          >
            <UserCog size={14} /> My Account
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
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden text-gray-500 hover:text-brand-green shrink-0"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <p className="text-sm text-gray-500 truncate">
              Bulk Supply Admin <span className="hidden sm:inline">· {ROLE_LABELS[role]}</span>
            </p>
          </div>
          <p className="text-sm font-medium text-gray-700 shrink-0 truncate max-w-[40%]">{userName}</p>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
