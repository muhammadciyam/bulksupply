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
export const ORDER_STATUS_PERMISSIONS: Record<StaffRole, OrderStatus[]> = {
  ADMIN: [
    "RECEIVED",
    "ORDER_CONFIRMED",
    "PRICE_QUOTED",
    "PAYMENT_PROCESSING",
    "ORDER_INVOICED",
    "ON_DELIVERY",
    "COMPLETE",
    "CANCELLED",
  ],
  CASHIER: ["ORDER_CONFIRMED", "PRICE_QUOTED", "PAYMENT_PROCESSING", "ORDER_INVOICED", "CANCELLED"],
  DELIVERY: ["ON_DELIVERY", "COMPLETE"],
};

export function canSetOrderStatus(role: string | undefined, status: OrderStatus): boolean {
  if (!isStaffRole(role)) return false;
  return ORDER_STATUS_PERMISSIONS[role].includes(status);
}

export function canManageCatalog(role: string | undefined): boolean {
  return role === "ADMIN";
}

// Admin and Cashier dispatch orders to a driver; Delivery staff receive assignments.
export function canAssignDelivery(role: string | undefined): boolean {
  return role === "ADMIN" || role === "CASHIER";
}

// Where a staff member lands after logging into the admin area.
// The dashboard is role-aware, so every staff role lands there.
export function defaultAdminRoute(role: string | undefined): string {
  if (isStaffRole(role)) return "/admin";
  return "/admin/login";
}
