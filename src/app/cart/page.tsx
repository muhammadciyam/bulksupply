"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Trash2, Minus, Plus } from "lucide-react";
import { Header } from "@/components/Header";
import { AuthModal } from "@/components/AuthModal";
import { useCartStore } from "@/lib/cart-store";
import { formatMVR } from "@/lib/format";

export default function CartPage() {
  const { status } = useSession();
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeLine = useCartStore((s) => s.removeLine);
  const clear = useCartStore((s) => s.clear);
  const activeAccountId = useCartStore((s) => s.activeAccountId);
  const [authOpen, setAuthOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState<string | null>(null);

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);

  async function handleCheckout() {
    if (status !== "authenticated") {
      setAuthOpen(true);
      return;
    }
    setPlacing(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines, businessAccountId: activeAccountId }),
    });
    const data = await res.json();
    setPlacing(false);
    if (res.ok) {
      clear();
      setPlaced(data.orderNumber);
      setTimeout(() => router.push("/account/orders"), 1500);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="max-w-4xl mx-auto w-full px-4 py-8 flex-1">
        <h1 className="text-xl font-bold text-brand-navy mb-6">Your Cart</h1>

        {placed ? (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
            <p className="text-brand-green font-semibold text-lg">Order #{placed} placed!</p>
            <p className="text-gray-500 text-sm mt-1">Redirecting to your orders...</p>
          </div>
        ) : lines.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-400">
            Your cart is empty.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {lines.map((l) => (
              <div key={l.productId + l.unitLabel} className="flex items-center gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{l.name}</p>
                  <p className="text-xs text-gray-400">
                    {l.sku} · {l.unitLabel} · {l.packSize}
                  </p>
                </div>
                <div className="flex items-center border border-gray-200 rounded-md">
                  <button
                    onClick={() => setQuantity(l.productId, l.unitLabel, l.quantity - 1)}
                    className="p-1.5 text-gray-500 hover:text-brand-green"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm">{l.quantity}</span>
                  <button
                    onClick={() => setQuantity(l.productId, l.unitLabel, l.quantity + 1)}
                    className="p-1.5 text-gray-500 hover:text-brand-green"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="w-24 text-right font-semibold text-brand-green text-sm">
                  MVR {formatMVR(l.price * l.quantity)}
                </p>
                <button
                  onClick={() => removeLine(l.productId, l.unitLabel)}
                  className="text-gray-300 hover:text-brand-red"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="p-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-lg font-bold text-brand-navy">MVR {formatMVR(total)}</span>
            </div>
            <div className="p-4">
              <button
                onClick={handleCheckout}
                disabled={placing}
                className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-3 rounded-md disabled:opacity-60"
              >
                {placing ? "Placing order..." : "Place Order"}
              </button>
            </div>
          </div>
        )}
      </main>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
