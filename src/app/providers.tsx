"use client";

import { useEffect } from "react";
import { SessionProvider } from "next-auth/react";
import { useCartStore } from "@/lib/cart-store";
import { CartDrawer } from "@/components/CartDrawer";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  return (
    <SessionProvider>
      {children}
      <CartDrawer />
    </SessionProvider>
  );
}
