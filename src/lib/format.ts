export function formatMVR(amount: number) {
  return amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export const ORDER_STEPS = [
  { key: "RECEIVED", label: "Received" },
  { key: "ORDER_CONFIRMED", label: "Order Confirmed" },
  { key: "PRICE_QUOTED", label: "Price Quoted" },
  { key: "PAYMENT_PROCESSING", label: "Payment Processing" },
  { key: "ORDER_INVOICED", label: "Order Invoiced" },
  { key: "ON_DELIVERY", label: "On Delivery" },
  { key: "COMPLETE", label: "Complete" },
] as const;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  RECEIVED: "Received",
  ORDER_CONFIRMED: "Order Confirmed",
  PRICE_QUOTED: "Price Quoted",
  PAYMENT_PROCESSING: "Payment Processing",
  ORDER_INVOICED: "Order Invoiced",
  ON_DELIVERY: "Delivery In Progress",
  COMPLETE: "Completed",
  CANCELLED: "Cancelled",
};

export const STOCK_BADGE: Record<string, { label: string; className: string }> = {
  LOW_STOCK: { label: "Low Stock", className: "bg-brand-red text-white" },
  NEW_STOCK: { label: "New Stock", className: "bg-brand-blue text-white" },
  OUT_OF_STOCK: { label: "Out of Stock", className: "bg-gray-500 text-white" },
  IN_STOCK: { label: "", className: "" },
};

export function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}
