import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  name: string;
  sku: string;
  unitLabel: string;
  packSize: string;
  price: number;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  activeAccountId: string | null;
  drawerOpen: boolean;
  addLine: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  removeLine: (productId: string, unitLabel: string) => void;
  setQuantity: (productId: string, unitLabel: string, qty: number) => void;
  clear: () => void;
  setActiveAccount: (id: string | null) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  totalItems: () => number;
  totalAmount: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      activeAccountId: null,
      drawerOpen: false,
      addLine: (line, qty = 1) =>
        set((state) => {
          const existing = state.lines.find(
            (l) => l.productId === line.productId && l.unitLabel === line.unitLabel
          );
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l === existing ? { ...l, quantity: l.quantity + qty } : l
              ),
            };
          }
          return { lines: [...state.lines, { ...line, quantity: qty }] };
        }),
      removeLine: (productId, unitLabel) =>
        set((state) => ({
          lines: state.lines.filter(
            (l) => !(l.productId === productId && l.unitLabel === unitLabel)
          ),
        })),
      setQuantity: (productId, unitLabel, qty) =>
        set((state) => ({
          lines: state.lines
            .map((l) =>
              l.productId === productId && l.unitLabel === unitLabel
                ? { ...l, quantity: qty }
                : l
            )
            .filter((l) => l.quantity > 0),
        })),
      clear: () => set({ lines: [] }),
      setActiveAccount: (id) => set({ activeAccountId: id }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      totalItems: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
      totalAmount: () => get().lines.reduce((sum, l) => sum + l.quantity * l.price, 0),
    }),
    {
      name: "bulk-supply-cart",
      skipHydration: true,
      partialize: (state) => ({ lines: state.lines, activeAccountId: state.activeAccountId }),
    }
  )
);
