"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { X, ShoppingCart, Minus, Plus, Trash2, Package } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatMVR } from "@/lib/format";
import { AuthModal } from "./AuthModal";

type Account = { id: string; name: string };

export function CartDrawer() {
  const { status } = useSession();
  const router = useRouter();
  const drawerOpen = useCartStore((s) => s.drawerOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clear = useCartStore((s) => s.clear);
  const activeAccountId = useCartStore((s) => s.activeAccountId);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [authOpen, setAuthOpen] = useState(false);
  const [placing, setPlacing] = useState(false);

  const totalItems = lines.reduce((sum, l) => sum + l.quantity, 0);
  const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.price, 0);
  const activeAccount = accounts.find((a) => a.id === activeAccountId) ?? accounts[0];

  useEffect(() => {
    if (status === "authenticated" && drawerOpen) {
      fetch("/api/accounts")
        .then((r) => r.json())
        .then((d) => setAccounts(d.accounts ?? []));
    }
  }, [status, drawerOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeDrawer]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  async function handleCheckout() {
    if (status !== "authenticated") {
      const isMobile = window.matchMedia("(max-width: 767px)").matches;
      if (isMobile) {
        closeDrawer();
        router.push("/login?redirect=/cart");
      } else {
        setAuthOpen(true);
      }
      return;
    }
    setPlacing(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, businessAccountId: activeAccountId }),
    });
    setPlacing(false);
    if (res.ok) {
      clear();
      closeDrawer();
      router.push("/account/orders");
    }
  }

  if (!drawerOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={closeDrawer} />
      <div className="fixed inset-y-0 right-0 z-[70] w-full sm:w-[420px] bg-white shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2 text-brand-green font-semibold">
            <ShoppingCart size={20} />
            <span>{totalItems} {totalItems === 1 ? "Item" : "Items"}</span>
          </div>
          <button
            onClick={closeDrawer}
            className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100"
            aria-label="Close cart"
          >
            <X size={18} />
          </button>
        </div>

        {activeAccount && (
          <div className="bg-gray-100 text-center text-xs font-semibold text-gray-600 tracking-wide py-2">
            {activeAccount.name.toUpperCase()}
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {lines.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              No products found
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {lines.map((l) => (
                <div key={l.productId + l.unitLabel} className="flex items-start gap-3 px-5 py-4">
                  <div className="h-12 w-12 rounded bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                    <Package size={20} className="text-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{l.name}</p>
                    <p className="text-xs text-gray-400">
                      {l.unitLabel} · {l.packSize}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200 rounded-md">
                        <button
                          onClick={() => setQuantity(l.productId, l.unitLabel, l.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-brand-green"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-xs">{l.quantity}</span>
                        <button
                          onClick={() => setQuantity(l.productId, l.unitLabel, l.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-brand-green"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-brand-green">
                        MVR {formatMVR(l.price * l.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeLine(l.productId, l.unitLabel)}
                    className="text-gray-300 hover:text-brand-red shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-lg font-bold text-brand-navy">MVR {formatMVR(totalAmount)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={placing}
              className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-3 rounded-md disabled:opacity-60"
            >
              {placing ? "Placing order..." : "Checkout"}
            </button>
          </div>
        )}
      </div>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </>
  );
}
