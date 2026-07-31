import type { OrderStatus } from "@prisma/client";

export type StaffRole = "ADMIN" | "CASHIER" | "DELIVERY";

export const STAFF_ROLES: StaffRole[] = ["ADMIN", "CASHIER", "DELIVERY"];

export function isStaffRole(role: string | undefined): role is StaffRole {
  return role === "ADMIN" || role === "CASHIER" || role === "DELIVERY";
}

export const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: "Admin",
  CASHIER: "Cashier",
  DELIVERY: "Godown / Delivery Staff",
};

// Which order statuses each staff role is allowed to set an order to.
// Admin can move an order to any stage. Cashier owns the office/paperwork
// stages, Godown & Delivery staff own the warehouse/dispatch stages.
// ORDER_INVOICED is deliberately excluded everywhere: it's only reachable
// via generateInvoice(), which requires a verified payment slip and creates
// the actual Invoice record — never a manual status click.
export const ORDER_STATUS_PERMISSIONS: Record<StaffRole, OrderStatus[]> = {
  ADMIN: [
    "RECEIVED",
    "ORDER_CONFIRMED",
    "PRICE_QUOTED",
    "PAYMENT_PROCESSING",
    "ON_DELIVERY",
    "COMPLETE",
    "CANCELLED",
  ],
  CASHIER: ["ORDER_CONFIRMED", "PRICE_QUOTED", "PAYMENT_PROCESSING", "CANCELLED"],
  DELIVERY: ["ON_DELIVERY", "COMPLETE"],
};

export function canSetOrderStatus(role: string | undefined, status: OrderStatus): boolean {
  if (!isStaffRole(role)) return false;
  return ORDER_STATUS_PERMISSIONS[role].includes(status);
}

// Admin and Cashier both manage the product catalog and stock levels;
// only Admin manages staff accounts and approves business accounts.
export function canManageCatalog(role: string | undefined): boolean {
  return role === "ADMIN" || role === "CASHIER";
}

// Admin and Cashier dispatch orders to a driver; Delivery staff receive assignments.
export function canAssignDelivery(role: string | undefined): boolean {
  return role === "ADMIN" || role === "CASHIER";
}

// Admin and Cashier both review uploaded payment slips; only Admin generates
// the resulting invoice (see generateInvoice in admin/actions.ts).
export function canVerifyPayment(role: string | undefined): boolean {
  return role === "ADMIN" || role === "CASHIER";
}

// Admin and Cashier can both record a supplier purchase invoice, but only
// Admin approving it actually applies the stock increase + cost price update.
export function canApprovePurchaseInvoice(role: string | undefined): boolean {
  return role === "ADMIN";
}

// Where a staff member lands after logging into the admin area.
// The dashboard is role-aware, so every staff role lands there.
export function defaultAdminRoute(role: string | undefined): string {
  if (isStaffRole(role)) return "/admin";
  return "/admin/login";
}
