"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ShoppingCart, Store, ChevronDown, LogOut } from "lucide-react";
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
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-4">
        <Logo />
        <Link
          href="/"
          className="bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold px-4 py-2 rounded-md"
        >
          Continue Shopping
        </Link>
        <div className="flex items-center gap-3 ml-auto">
          {activeAccount && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-1.5 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-brand-green"
              >
                <Store size={16} />
                <span className="hidden sm:inline">{activeAccount.name.toUpperCase()}</span>
                <ChevronDown size={14} />
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
          <Link
            href="/cart"
            className="relative flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:text-brand-green"
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
