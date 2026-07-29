"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Search, Gift, ShoppingCart, User, Store, ChevronDown, LogOut } from "lucide-react";
import { Logo } from "./Logo";
import { AuthModal } from "./AuthModal";
import { useCartStore } from "@/lib/cart-store";

type Account = { id: string; name: string; status: string };

export function Header() {
  const { status } = useSession();
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [query, setQuery] = useState("");
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
          if (!activeAccountId && d.accounts?.length) {
            setActiveAccount(d.accounts[0].id);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(query ? `/?q=${encodeURIComponent(query)}` : "/");
  }

  return (
    <>
      <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2 sm:gap-4">
          <Logo />
          <form onSubmit={handleSearch} className="flex-1 hidden md:flex">
            <div className="w-full flex items-center bg-gray-100 rounded-md px-3 py-2 gap-2">
              <Search size={16} className="text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search your products from here"
                className="bg-transparent outline-none text-sm w-full"
              />
            </div>
          </form>
          <div className="flex items-center gap-1.5 sm:gap-3 ml-auto">
            <button
              className="hidden lg:flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:text-brand-green"
              title="Rewards"
            >
              <Gift size={18} />
            </button>

            {status === "authenticated" && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="hidden md:flex items-center gap-1.5 border border-gray-200 rounded-md px-3 py-1.5 text-sm font-semibold text-gray-700 hover:border-brand-green max-w-[160px] lg:max-w-none"
                >
                  <Store size={16} className="shrink-0" />
                  <span className="truncate">{activeAccount ? activeAccount.name.toUpperCase() : "ACCOUNT"}</span>
                  <ChevronDown size={14} className="shrink-0" />
                </button>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="md:hidden flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 text-gray-500"
                >
                  <User size={18} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-2 text-sm">
                    <Link href="/account/profile" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      Profile
                    </Link>
                    <Link href="/account/orders" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      My Orders
                    </Link>
                    <Link href="/account/accounts" className="block px-4 py-2 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                      My Accounts
                    </Link>
                    {accounts.length > 0 && (
                      <>
                        <div className="border-t border-gray-100 my-1" />
                        <p className="px-4 pt-1 pb-1 text-xs text-gray-400">Select an account</p>
                        {accounts.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => {
                              setActiveAccount(a.id);
                              setMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-1.5 hover:bg-gray-50 text-left"
                          >
                            <span
                              className={`h-3.5 w-3.5 rounded-full border-2 shrink-0 ${
                                activeAccount && a.id === activeAccount.id
                                  ? "border-brand-green bg-brand-green"
                                  : "border-gray-300"
                              }`}
                            />
                            <span className="truncate">{a.name}</span>
                          </button>
                        ))}
                      </>
                    )}
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
              className="relative flex items-center justify-center h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:text-brand-green shrink-0"
            >
              <ShoppingCart size={18} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {status !== "authenticated" && (
              <button
                onClick={() => setAuthOpen(true)}
                className="bg-brand-green hover:bg-brand-green-dark text-white text-xs sm:text-sm font-semibold px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md whitespace-nowrap shrink-0"
              >
                <span className="sm:hidden">Login</span>
                <span className="hidden sm:inline">Login / Register</span>
              </button>
            )}
          </div>
        </div>
        <form onSubmit={handleSearch} className="md:hidden px-3 pb-2.5">
          <div className="w-full flex items-center bg-gray-100 rounded-md px-3 py-2 gap-2">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your products from here"
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
        </form>
      </header>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
