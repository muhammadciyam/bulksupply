"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StockStatus, OrderStatus, Role } from "@prisma/client";
import { isStaffRole, canSetOrderStatus } from "@/lib/roles";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
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

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

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

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const stockStatus = String(formData.get("stockStatus") ?? "IN_STOCK") as StockStatus;

  await prisma.product.update({
    where: { id: productId },
    data: { name, categoryId, description, stockStatus },
  });

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
}

export async function deleteProduct(productId: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function adjustInventory(inventoryItemId: string, change: number, reason: string) {
  await requireAdmin();
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
  await requireAdmin();
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
  await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      history: { create: { status } },
    },
  });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
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

  const invoiceAmount = formData.get("invoiceAmount");
  const invoiceRef = formData.get("invoiceRef");
  if (invoiceAmount && invoiceRef) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        invoice: {
          upsert: {
            create: { referenceNo: String(invoiceRef), amount: Number(invoiceAmount) },
            update: { referenceNo: String(invoiceRef), amount: Number(invoiceAmount) },
          },
        },
      },
    });
  }

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/account/orders");
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
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
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/staff");
}
