"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, Store, ChevronDown, LogOut, UserCircle, ClipboardList, Users } from "lucide-react";
import { Logo } from "./Logo";
import { useCartStore } from "@/lib/cart-store";

type Account = { id: string; name: string; status: string };

export function AccountHeader() {
  const { status } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const totalItems = useCartStore((s) => s.totalItems());
  const activeAccountId = useCartStore((s) => s.activeAccountId);
  const setActiveAccount = useCartStore((s) => s.setActiveAccount);

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
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
        <Logo />
        <Link
          href="/"
          className="bg-brand-green hover:bg-brand-green-dark text-white text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md whitespace-nowrap shrink-0"
        >
          <span className="sm:hidden">Shop</span>
          <span className="hidden sm:inline">Continue Shopping</span>
        </Link>
        <div className="flex items-center gap-1 sm:gap-2 ml-auto">
          {activeAccount && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 border border-gray-200 rounded-full pl-2 sm:pl-3 pr-2 sm:pr-2.5 py-1.5 text-sm font-semibold text-gray-700 hover:border-brand-green hover:text-brand-green transition-colors max-w-[110px] sm:max-w-[180px]"
              >
                <Store size={16} className="shrink-0" />
                <span className="hidden sm:inline truncate">{activeAccount.name.toUpperCase()}</span>
                <ChevronDown size={14} className="shrink-0" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-2 text-sm z-20">
                  <Link href="/account/profile" className="block px-4 py-2 hover:bg-gray-50">
                    Profile
                  </Link>
                  <Link href="/account/orders" className="block px-4 py-2 hover:bg-gray-50">
                    My Orders
                  </Link>
                  <Link href="/account/accounts" className="block px-4 py-2 hover:bg-gray-50">
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
          )}
          <div className="hidden lg:block h-6 w-px bg-gray-200 mx-1" />
          <div className="hidden lg:flex items-center gap-0.5">
            <Link
              href="/account/profile"
              title="Profile"
              className="flex items-center justify-center h-9 w-9 rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-green transition-colors"
            >
              <UserCircle size={18} />
            </Link>
            <Link
              href="/account/orders"
              title="My Orders"
              className="flex items-center justify-center h-9 w-9 rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-green transition-colors"
            >
              <ClipboardList size={18} />
            </Link>
            <Link
              href="/account/accounts"
              title="My Accounts"
              className="flex items-center justify-center h-9 w-9 rounded-full text-gray-400 hover:bg-gray-100 hover:text-brand-green transition-colors"
            >
              <Users size={18} />
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Logout"
              className="flex items-center justify-center h-9 w-9 rounded-full text-gray-400 hover:bg-red-50 hover:text-brand-red transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
          <div className="hidden lg:block h-6 w-px bg-gray-200 mx-1" />
          <Link
            href="/cart"
            className="relative flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 text-gray-600 hover:bg-brand-green/10 hover:text-brand-green transition-colors"
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
