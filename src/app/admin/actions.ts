"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveProductImage } from "@/lib/product-image";
import { StockStatus, OrderStatus, Role, AccountStatus } from "@prisma/client";
import {
  isStaffRole,
  canSetOrderStatus,
  canAssignDelivery,
  canManageCatalog,
  canVerifyPayment,
  ROLE_LABELS,
  type StaffRole,
} from "@/lib/roles";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }
  return session;
}

async function requireCatalogManager() {
  const session = await auth();
  if (!session?.user || !canManageCatalog(session.user.role)) {
    redirect("/admin/login");
  }
  return session;
}

async function requireStaff() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) {
    redirect("/admin/login");
  }
  return session;
}

async function requirePaymentVerifier() {
  const session = await auth();
  if (!session?.user || !canVerifyPayment(session.user.role)) {
    redirect("/admin/login");
  }
  return session;
}

async function getPaymentDeadlineDays() {
  const settings = await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
  return settings.paymentDeadlineDays;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProduct(formData: FormData) {
  await requireCatalogManager();

  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const stockStatus = String(formData.get("stockStatus") ?? "IN_STOCK") as StockStatus;
  const unitLabels = formData.getAll("unitLabel") as string[];
  const unitPackSizes = formData.getAll("unitPackSize") as string[];
  const unitPrices = formData.getAll("unitPrice") as string[];
  const quantityOnHand = Number(formData.get("quantityOnHand") ?? 0);
  const lowStockThreshold = Number(formData.get("lowStockThreshold") ?? 10);

  if (!name || !sku || !categoryId) return;

  const units = unitLabels
    .map((label, i) => ({
      label: label.trim(),
      packSize: unitPackSizes[i]?.trim() ?? "",
      price: Number(unitPrices[i] ?? 0),
      isDefault: i === 0,
    }))
    .filter((u) => u.label && u.price >= 0);

  const product = await prisma.product.create({
    data: {
      name,
      sku,
      slug: slugify(name) + "-" + sku.toLowerCase(),
      categoryId,
      description,
      stockStatus,
      units: { create: units },
      inventory: { create: { quantityOnHand, lowStockThreshold } },
    },
  });

  let imageError: string | null = null;
  try {
    const imageUrl = await saveProductImage(product.id, formData);
    if (imageUrl) {
      await prisma.product.update({ where: { id: product.id }, data: { imageUrl } });
    }
  } catch (err) {
    imageError = err instanceof Error ? err.message : "Could not save the product image";
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/");
  redirect(
    `/admin/products/${product.id}${imageError ? `?imageError=${encodeURIComponent(imageError)}` : ""}`
  );
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireCatalogManager();

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const stockStatus = String(formData.get("stockStatus") ?? "IN_STOCK") as StockStatus;

  await prisma.product.update({
    where: { id: productId },
    data: { name, categoryId, description, stockStatus },
  });

  let imageError: string | null = null;
  try {
    const current = await prisma.product.findUnique({ where: { id: productId }, select: { imageUrl: true } });
    const imageUrl = await saveProductImage(productId, formData, current?.imageUrl);
    if (imageUrl) {
      await prisma.product.update({ where: { id: productId }, data: { imageUrl } });
    }
  } catch (err) {
    imageError = err instanceof Error ? err.message : "Could not save the product image";
  }

  const unitIds = formData.getAll("unitId") as string[];
  const unitLabels = formData.getAll("unitLabel") as string[];
  const unitPackSizes = formData.getAll("unitPackSize") as string[];
  const unitPrices = formData.getAll("unitPrice") as string[];

  for (let i = 0; i < unitLabels.length; i++) {
    const label = unitLabels[i]?.trim();
    if (!label) continue;
    const price = Number(unitPrices[i] ?? 0);
    const packSize = unitPackSizes[i]?.trim() ?? "";
    const id = unitIds[i];
    if (id) {
      await prisma.productUnit.update({
        where: { id },
        data: { label, packSize, price },
      });
    } else {
      await prisma.productUnit.create({
        data: { productId, label, packSize, price },
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
  if (imageError) {
    redirect(`/admin/products/${productId}?imageError=${encodeURIComponent(imageError)}`);
  }
}

export async function deleteProduct(productId: string) {
  await requireCatalogManager();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function adjustInventory(inventoryItemId: string, change: number, reason: string) {
  await requireCatalogManager();
  const item = await prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } });
  if (!item) return;

  const newQty = Math.max(0, item.quantityOnHand + change);

  await prisma.inventoryItem.update({
    where: { id: inventoryItemId },
    data: {
      quantityOnHand: newQty,
      adjustments: { create: { change, reason: reason || "Manual adjustment" } },
    },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/");
}

export async function setInventoryThreshold(inventoryItemId: string, threshold: number) {
  await requireCatalogManager();
  await prisma.inventoryItem.update({
    where: { id: inventoryItemId },
    data: { lowStockThreshold: threshold },
  });
  revalidatePath("/admin/inventory");
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await requireStaff();
  if (!canSetOrderStatus(session.user.role, status)) {
    throw new Error("You do not have permission to set this order status");
  }
  const role = session.user.role as StaffRole;
  const changedBy = `${session.user.name} (${ROLE_LABELS[role]})`;

  let paymentDeadline: Date | undefined;
  if (status === "PAYMENT_PROCESSING") {
    const days = await getPaymentDeadlineDays();
    paymentDeadline = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      ...(paymentDeadline ? { paymentDeadline } : {}),
      history: { create: { status, changedBy } },
    },
  });

  if (status === "COMPLETE") {
    await prisma.deliveryInfo.updateMany({
      where: { orderId },
      data: { deliveredAt: new Date() },
    });
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function assignDelivery(orderId: string, staffId: string | null) {
  const session = await requireStaff();
  if (!canAssignDelivery(session.user.role)) {
    throw new Error("You do not have permission to assign deliveries");
  }
  if (staffId) {
    const staff = await prisma.user.findUnique({ where: { id: staffId } });
    if (!staff || staff.role !== "DELIVERY" || !staff.isActive) {
      throw new Error("Invalid delivery staff member");
    }
  }
  await prisma.order.update({
    where: { id: orderId },
    data: { assignedToId: staffId },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function verifyPaymentSlip(orderId: string) {
  const session = await requirePaymentVerifier();
  const role = session.user.role as StaffRole;
  const verifiedBy = `${session.user.name} (${ROLE_LABELS[role]})`;

  const slip = await prisma.paymentSlip.findUnique({ where: { orderId } });
  if (!slip) throw new Error("No payment slip has been uploaded for this order");

  await prisma.paymentSlip.update({
    where: { orderId },
    data: { status: "VERIFIED", verifiedAt: new Date(), verifiedBy, rejectionReason: null },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function rejectPaymentSlip(orderId: string, reason: string) {
  await requirePaymentVerifier();
  if (!reason.trim()) throw new Error("A rejection reason is required");

  const slip = await prisma.paymentSlip.findUnique({ where: { orderId } });
  if (!slip) throw new Error("No payment slip has been uploaded for this order");

  await prisma.paymentSlip.update({
    where: { orderId },
    data: { status: "REJECTED", rejectionReason: reason.trim(), verifiedAt: null, verifiedBy: null },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function generateInvoice(orderId: string) {
  const session = await requireAdmin();
  const role = session.user.role as StaffRole;
  const changedBy = `${session.user.name} (${ROLE_LABELS[role]})`;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, paymentSlip: true, invoice: true },
  });
  if (!order) throw new Error("Order not found");
  if (order.invoice) throw new Error("An invoice has already been generated for this order");
  if (order.paymentSlip?.status !== "VERIFIED") {
    throw new Error("Payment must be verified before an invoice can be generated");
  }

  const amount = order.items.reduce((sum, it) => sum + it.amount, 0);
  const referenceNo = String(10000000 + Math.floor(Math.random() * 89999999));

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "ORDER_INVOICED",
      invoice: { create: { referenceNo, amount } },
      history: { create: { status: "ORDER_INVOICED", changedBy } },
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/account/orders");
}

export async function updateAppSettings(paymentDeadlineDays: number) {
  await requireAdmin();
  if (!Number.isInteger(paymentDeadlineDays) || paymentDeadlineDays < 1) {
    throw new Error("Deadline must be a whole number of days, at least 1");
  }
  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", paymentDeadlineDays },
    update: { paymentDeadlineDays },
  });
  revalidatePath("/admin/settings");
}

export async function upsertDelivery(orderId: string, formData: FormData) {
  await requireStaff();
  const location = String(formData.get("location") ?? "").trim();
  const addressDetails = String(formData.get("addressDetails") ?? "").trim() || null;
  const addressLocation = String(formData.get("addressLocation") ?? "").trim() || null;
  const deliveryMethod = String(formData.get("deliveryMethod") ?? "delivery");
  const customerReference = String(formData.get("customerReference") ?? "").trim() || null;

  await prisma.order.update({
    where: { id: orderId },
    data: {
      deliveryMethod,
      customerReference,
      delivery: {
        upsert: {
          create: { location, addressDetails, addressLocation },
          update: { location, addressDetails, addressLocation },
        },
      },
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function createCategory(formData: FormData) {
  await requireCatalogManager();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await prisma.category.create({ data: { name, slug: slugify(name) } });
  revalidatePath("/admin/products");
  revalidatePath("/");
}

export async function createStaffUser(formData: FormData) {
  await requireAdmin();

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "CASHIER") as Role;

  if (!firstName || !lastName || !email || !phone || password.length < 6) {
    throw new Error("All fields are required and password must be at least 6 characters");
  }
  if (role !== "CASHIER" && role !== "DELIVERY" && role !== "ADMIN") {
    throw new Error("Invalid role");
  }

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    throw new Error("An account with this email or phone already exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { firstName, lastName, email, phone, passwordHash, role },
  });

  revalidatePath("/admin/staff");
}

export async function deactivateStaffUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  revalidatePath("/admin/staff");
}

export async function reactivateStaffUser(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { isActive: true } });
  revalidatePath("/admin/staff");
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const session = await requireStaff();
  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters");
  }
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) throw new Error("Account not found");

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw new Error("Current password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
}

export async function updateBusinessAccountStatus(accountId: string, status: AccountStatus) {
  await requireAdmin();
  await prisma.businessAccount.update({
    where: { id: accountId },
    data: { status },
  });
  revalidatePath("/admin/accounts");
}
