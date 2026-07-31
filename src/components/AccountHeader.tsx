"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, Store, UserCircle, LogOut, LayoutDashboard } from "lucide-react";
import { Logo } from "./Logo";
import { useCartStore } from "@/lib/cart-store";
import { isStaffRole, ROLE_LABELS, type StaffRole } from "@/lib/roles";

type Account = { id: string; name: string; status: string };

export function AccountHeader() {
  const { data: session, status } = useSession();
  const staffRole = isStaffRole(session?.user?.role) ? (session!.user!.role as StaffRole) : null;
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const totalItems = useCartStore((s) => s.totalItems());
  const activeAccountId = useCartStore((s) => s.activeAccountId);
  const setActiveAccount = useCartStore((s) => s.setActiveAccount);
  const openCartDrawer = useCartStore((s) => s.openDrawer);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/accounts")
        .then((r) => r.json())
        .then((d) => {
          setAccounts(d.accounts ?? []);
          if (!activeAccountId && d.accounts?.length) setActiveAccount(d.accounts[0].id);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
        <Logo />
        <Link
          href="/"
          className="bg-brand-green hover:bg-brand-green-dark text-white text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md whitespace-nowrap shrink-0"
        >
          <span className="sm:hidden">Shop</span>
          <span className="hidden sm:inline">Continue Shopping</span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto relative" ref={menuRef}>
          {activeAccount && (
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="hidden sm:flex items-center gap-1.5 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-brand-green transition-colors max-w-[160px]"
            >
              <Store size={16} className="shrink-0" />
              <span className="truncate">{activeAccount.name.toUpperCase()}</span>
            </button>
          )}

          <button
            onClick={openCartDrawer}
            className="relative flex items-center justify-center h-9 w-9 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ShoppingCart size={19} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center justify-center h-9 w-9 rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <UserCircle size={20} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-2 text-sm z-20">
                {staffRole && (
                  <>
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 px-4 py-2 text-brand-green font-semibold hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      <LayoutDashboard size={14} /> {ROLE_LABELS[staffRole]} Panel
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                  </>
                )}
                <Link href="/account/profile" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                <Link href="/account/orders" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  My Orders
                </Link>
                <Link href="/account/accounts" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  My Accounts
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="w-full flex items-center gap-2 px-4 py-2 text-brand-red hover:bg-gray-50"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
