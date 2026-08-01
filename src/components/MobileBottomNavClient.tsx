"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, ClipboardList, ShoppingCart, UserCircle, LayoutGrid } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { AuthModal } from "./AuthModal";
import { CategoryDrawer } from "./CategoryDrawer";

type Category = { id: string; name: string; slug: string; parentId: string | null };

export function MobileBottomNavClient({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const { status } = useSession();
  const totalItems = useCartStore((s) => s.totalItems());
  const openCartDrawer = useCartStore((s) => s.openDrawer);
  const [authOpen, setAuthOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  if (pathname.startsWith("/admin")) return null;

  const isHome = pathname === "/";
  const isOrders = pathname.startsWith("/account/orders");
  const isAccount = pathname.startsWith("/account") && !isOrders;

  function requireAuth(e: React.MouseEvent) {
    if (status !== "authenticated") {
      e.preventDefault();
      setAuthOpen(true);
    }
  }

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 flex items-stretch">
        <Link
          href="/"
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
            isHome ? "text-brand-green" : "text-gray-500"
          }`}
        >
          <Home size={20} />
          Home
        </Link>
        <button
          onClick={() => setCategoriesOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
            categoriesOpen ? "text-brand-green" : "text-gray-500"
          }`}
        >
          <LayoutGrid size={20} />
          Category
        </button>
        <Link
          href="/account/orders"
          onClick={requireAuth}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
            isOrders ? "text-brand-green" : "text-gray-500"
          }`}
        >
          <ClipboardList size={20} />
          Orders
        </Link>
        <button
          onClick={openCartDrawer}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] text-gray-500 relative"
        >
          <span className="relative">
            <ShoppingCart size={20} />
            {totalItems > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-red text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </span>
          Cart
        </button>
        <Link
          href="/account/profile"
          onClick={requireAuth}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${
            isAccount ? "text-brand-green" : "text-gray-500"
          }`}
        >
          <UserCircle size={20} />
          Account
        </Link>
      </nav>
      <CategoryDrawer
        categories={categories}
        open={categoriesOpen}
        onClose={() => setCategoriesOpen(false)}
      />
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
