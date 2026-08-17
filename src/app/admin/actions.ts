"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedImage, saveImageFile, saveImageFromUrl, removeUploadedImage } from "@/lib/image-upload";
import { isThemeColor } from "@/lib/theme";
import { StockStatus, OrderStatus, Role, AccountStatus, Prisma } from "@prisma/client";
import {
  isStaffRole,
  canSetOrderStatus,
  canAssignDelivery,
  canManageCatalog,
  canVerifyPayment,
  canApprovePurchaseInvoice,
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

// The single, shop-wide GST rate — set once in Settings and applied
// everywhere GST calculations happen (product pricing, purchase invoices),
// rather than being typed in ad-hoc on every form.
export async function getGstPercent() {
  const settings = await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
  return settings.gstPercent;
}

// The shop's own identity — shown on the header of customer invoices. Kept
// separate from PurchaseInvoice.gstNumber, which records a *supplier's* GST
// number on incoming stock purchases, not the shop's own.
export async function getBusinessDetails() {
  const settings = await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
  return {
    businessName: settings.businessName,
    businessAddress: settings.businessAddress,
    businessPhone: settings.businessPhone,
    businessEmail: settings.businessEmail,
    businessGstNo: settings.businessGstNo,
  };
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Adds every newly selected file (multi-select) and/or pasted URL as new
// ProductImage rows — this only ever adds to a product's gallery, existing
// images are removed individually via removeProductImage. Returns the rows
// that were added so callers can reflect them immediately in the UI.
async function addProductImages(productId: string, formData: FormData) {
  const files = formData.getAll("imageFile").filter((f): f is File => f instanceof File && f.size > 0);
  const url = String(formData.get("imageUrl") ?? "").trim();
  const added: { id: string; imageUrl: string }[] = [];

  const last = await prisma.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: "desc" } });
  let nextOrder = (last?.sortOrder ?? -1) + 1;

  for (const file of files) {
    const row = await prisma.productImage.create({ data: { productId, imageUrl: "", sortOrder: nextOrder++ } });
    try {
      const imageUrl = await saveImageFile("products", row.id, file);
      const updated = await prisma.productImage.update({ where: { id: row.id }, data: { imageUrl } });
      added.push({ id: updated.id, imageUrl: updated.imageUrl });
    } catch (err) {
      await prisma.productImage.delete({ where: { id: row.id } }).catch(() => {});
      throw err;
    }
  }

  if (url) {
    const row = await prisma.productImage.create({ data: { productId, imageUrl: "", sortOrder: nextOrder++ } });
    try {
      const imageUrl = await saveImageFromUrl("products", row.id, url);
      const updated = await prisma.productImage.update({ where: { id: row.id }, data: { imageUrl } });
      added.push({ id: updated.id, imageUrl: updated.imageUrl });
    } catch (err) {
      await prisma.productImage.delete({ where: { id: row.id } }).catch(() => {});
      throw err;
    }
  }

  return added;
}

// Instant version used by the "Add" button in the product edit form — adds
// images to an existing product right away, independent of the surrounding
// form's Save button.
export async function addProductImagesToProduct(productId: string, formData: FormData) {
  await requireCatalogManager();
  const added = await addProductImages(productId, formData);
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
  updateTag("products");
  return added;
}

export async function createProduct(formData: FormData) {
  await requireCatalogManager();
  const gstPercent = await getGstPercent();

  const name = String(formData.get("name") ?? "").trim();
  const sku = String(formData.get("sku") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const stockStatus = String(formData.get("stockStatus") ?? "IN_STOCK") as StockStatus;
  const unitLabels = formData.getAll("unitLabel") as string[];
  const unitPackSizes = formData.getAll("unitPackSize") as string[];
  const unitPrices = formData.getAll("unitPrice") as string[];
  const unitCostPrices = formData.getAll("unitCostPrice") as string[];
  const quantityOnHand = Number(formData.get("quantityOnHand") ?? 0);
  const lowStockThreshold = Number(formData.get("lowStockThreshold") ?? 10);

  if (!name || !sku || !categoryId) return;

  const units = unitLabels
    .map((label, i) => {
      const gstApplicable = formData.get(`unitGstApplicable_${i}`) === "on";
      const priceExGstRaw = String(formData.get(`unitPriceExGst_${i}`) ?? "").trim();
      const costPriceIncGstRaw = String(formData.get(`unitCostPriceIncGst_${i}`) ?? "").trim();
      return {
        label: label.trim(),
        packSize: unitPackSizes[i]?.trim() ?? "",
        price: Number(unitPrices[i] ?? 0),
        gstApplicable,
        priceExGst: gstApplicable && priceExGstRaw ? Number(priceExGstRaw) : null,
        // The rate always comes from the current shop-wide setting, never
        // from the client, so it can't drift from what Settings actually says.
        gstRate: gstApplicable ? gstPercent : null,
        costPrice: unitCostPrices[i]?.trim() ? Number(unitCostPrices[i]) : null,
        costPriceIncGst: gstApplicable && costPriceIncGstRaw ? Number(costPriceIncGstRaw) : null,
        isDefault: i === 0,
      };
    })
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
    await addProductImages(product.id, formData);
  } catch (err) {
    imageError = err instanceof Error ? err.message : "Could not save one or more product images";
  }

  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath("/");
  updateTag("products");
  redirect(
    `/admin/products/${product.id}${imageError ? `?imageError=${encodeURIComponent(imageError)}` : ""}`
  );
}

export async function updateProduct(productId: string, formData: FormData) {
  await requireCatalogManager();
  const gstPercent = await getGstPercent();

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
    await addProductImages(productId, formData);
  } catch (err) {
    imageError = err instanceof Error ? err.message : "Could not save one or more product images";
  }

  const unitIds = formData.getAll("unitId") as string[];
  const unitLabels = formData.getAll("unitLabel") as string[];
  const unitPackSizes = formData.getAll("unitPackSize") as string[];
  const unitPrices = formData.getAll("unitPrice") as string[];
  const unitCostPrices = formData.getAll("unitCostPrice") as string[];

  // Units removed client-side (the trash icon in ProductForm) simply aren't
  // present in the submission — delete anything not in the kept id set so
  // they don't survive as orphaned rows.
  const keptUnitIds = unitIds.filter(Boolean);
  if (keptUnitIds.length > 0) {
    await prisma.productUnit.deleteMany({ where: { productId, id: { notIn: keptUnitIds } } });
  } else {
    await prisma.productUnit.deleteMany({ where: { productId } });
  }

  for (let i = 0; i < unitLabels.length; i++) {
    const label = unitLabels[i]?.trim();
    if (!label) continue;
    const price = Number(unitPrices[i] ?? 0);
    const packSize = unitPackSizes[i]?.trim() ?? "";
    const costPrice = unitCostPrices[i]?.trim() ? Number(unitCostPrices[i]) : null;
    const gstApplicable = formData.get(`unitGstApplicable_${i}`) === "on";
    const priceExGstRaw = String(formData.get(`unitPriceExGst_${i}`) ?? "").trim();
    const priceExGst = gstApplicable && priceExGstRaw ? Number(priceExGstRaw) : null;
    // The rate always comes from the current shop-wide setting, never from
    // the client, so it can't drift from what Settings actually says.
    const gstRate = gstApplicable ? gstPercent : null;
    const costPriceIncGstRaw = String(formData.get(`unitCostPriceIncGst_${i}`) ?? "").trim();
    const costPriceIncGst = gstApplicable && costPriceIncGstRaw ? Number(costPriceIncGstRaw) : null;
    const id = unitIds[i];
    if (id) {
      await prisma.productUnit.update({
        where: { id },
        data: { label, packSize, price, costPrice, gstApplicable, priceExGst, gstRate, costPriceIncGst },
      });
    } else {
      await prisma.productUnit.create({
        data: { productId, label, packSize, price, costPrice, gstApplicable, priceExGst, gstRate, costPriceIncGst },
      });
    }
  }

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/");
  updateTag("products");
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
  updateTag("products");
  redirect("/admin/products");
}

export async function removeProductImage(imageId: string) {
  await requireCatalogManager();
  const row = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!row) return;
  await removeUploadedImage(row.imageUrl);
  await prisma.productImage.delete({ where: { id: imageId } });
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${row.productId}`);
  revalidatePath("/");
  updateTag("products");
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

export async function setUnitCostPrice(unitId: string, costPrice: number | null) {
  await requireCatalogManager();
  await prisma.productUnit.update({
    where: { id: unitId },
    data: { costPrice },
  });
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await requireStaff();
  if (!canSetOrderStatus(session.user.role, status)) {
    throw new Error("You do not have permission to set this order status");
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) throw new Error("Order not found");
  if (order.status === "COMPLETE" || order.status === "CANCELLED") {
    throw new Error("This order is already finalized and its status can no longer be changed");
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

export async function updateGstPercent(gstPercent: number) {
  await requireAdmin();
  if (!Number.isFinite(gstPercent) || gstPercent < 0 || gstPercent > 100) {
    throw new Error("GST percentage must be a number between 0 and 100");
  }
  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", gstPercent },
    update: { gstPercent },
  });
  revalidatePath("/admin/settings");
  revalidatePath("/admin/products");
  revalidatePath("/admin/purchases");
}

export async function updateThemeColor(themeColor: string) {
  await requireAdmin();
  if (!isThemeColor(themeColor)) {
    throw new Error("Invalid theme color");
  }
  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", themeColor },
    update: { themeColor },
  });
  revalidatePath("/", "layout");
}

export async function updateBusinessDetails(formData: FormData) {
  await requireAdmin();
  const businessName = String(formData.get("businessName") ?? "").trim();
  const businessAddress = String(formData.get("businessAddress") ?? "").trim() || null;
  const businessPhone = String(formData.get("businessPhone") ?? "").trim() || null;
  const businessEmail = String(formData.get("businessEmail") ?? "").trim() || null;
  const businessGstNo = String(formData.get("businessGstNo") ?? "").trim() || null;

  if (!businessName) {
    throw new Error("Business name is required");
  }

  const data = { businessName, businessAddress, businessPhone, businessEmail, businessGstNo };
  await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...data },
    update: data,
  });
  revalidatePath("/admin/settings");
  revalidatePath("/account/orders");
}

export async function addBannerImage(slot: 1 | 2 | 3 | 4, formData: FormData) {
  await requireAdmin();
  if (slot < 1 || slot > 4) throw new Error("Invalid banner slot");

  const last = await prisma.bannerImage.findFirst({ where: { slot }, orderBy: { sortOrder: "desc" } });
  const row = await prisma.bannerImage.create({
    data: { slot, imageUrl: "", sortOrder: (last?.sortOrder ?? -1) + 1 },
  });

  try {
    const imageUrl = await saveUploadedImage("banners", row.id, formData);
    if (!imageUrl) throw new Error("Choose a file or paste an image URL");
    await prisma.bannerImage.update({ where: { id: row.id }, data: { imageUrl } });
    revalidatePath("/");
    revalidatePath("/admin/settings");
    updateTag("banners");
    return { id: row.id, imageUrl };
  } catch (err) {
    await prisma.bannerImage.delete({ where: { id: row.id } }).catch(() => {});
    throw err;
  }
}

export async function removeBannerImage(imageId: string) {
  await requireAdmin();
  const row = await prisma.bannerImage.findUnique({ where: { id: imageId } });
  if (!row) return;
  await removeUploadedImage(row.imageUrl);
  await prisma.bannerImage.delete({ where: { id: imageId } });
  revalidatePath("/");
  revalidatePath("/admin/settings");
  updateTag("banners");
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
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  if (!name) throw new Error("Category name is required");

  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) throw new Error("Parent category not found");
    if (parent.parentId) throw new Error("Subcategories can only be one level deep");
  }

  try {
    const category = await prisma.category.create({ data: { name, slug: slugify(name), parentId } });
    revalidatePath("/admin/products");
    revalidatePath("/");
    updateTag("categories");
    return category;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("A category with this name already exists");
    }
    throw err;
  }
}

export async function updateCategory(categoryId: string, formData: FormData) {
  await requireCatalogManager();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Category name is required");

  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name, slug: slugify(name) },
    });
    revalidatePath("/admin/products");
    revalidatePath("/");
    updateTag("categories");
    return category;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new Error("A category with this name already exists");
    }
    throw err;
  }
}

export async function deleteCategory(categoryId: string) {
  await requireCatalogManager();
  const [productCount, childCount] = await Promise.all([
    prisma.product.count({ where: { categoryId } }),
    prisma.category.count({ where: { parentId: categoryId } }),
  ]);
  if (productCount > 0) {
    throw new Error(`Cannot delete — ${productCount} product${productCount === 1 ? "" : "s"} still use this category`);
  }
  if (childCount > 0) {
    throw new Error(`Cannot delete — ${childCount} subcategor${childCount === 1 ? "y" : "ies"} still exist under this category`);
  }
  await prisma.category.delete({ where: { id: categoryId } });
  revalidatePath("/admin/products");
  revalidatePath("/");
  updateTag("categories");
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
  const user = await prisma.user.create({
    data: { firstName, lastName, email, phone, passwordHash, role },
  });

  revalidatePath("/admin/staff");
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phone: user.phone,
    role: user.role as StaffRole,
    roleLabel: ROLE_LABELS[user.role as StaffRole],
    isActive: user.isActive,
  };
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

export async function createPurchaseInvoice(formData: FormData) {
  const session = await requireCatalogManager();

  const shopName = String(formData.get("shopName") ?? "").trim();
  const gstNumber = String(formData.get("gstNumber") ?? "").trim() || null;
  const invoiceNumber = String(formData.get("invoiceNumber") ?? "").trim();
  const invoiceDateStr = String(formData.get("invoiceDate") ?? "");

  if (!shopName || !invoiceNumber || !invoiceDateStr) {
    throw new Error("Shop name, invoice number, and date are required");
  }
  const invoiceDate = new Date(invoiceDateStr);
  if (Number.isNaN(invoiceDate.getTime())) {
    throw new Error("Invalid invoice date");
  }

  const productIds = formData.getAll("itemProductId") as string[];
  const quantities = formData.getAll("itemQuantity") as string[];
  const costsExGst = formData.getAll("itemCostExGst") as string[];

  const items = productIds
    .map((productId, i) => {
      const quantity = Math.trunc(Number(quantities[i] ?? 0));
      const costPriceExGst = Number(costsExGst[i] ?? 0);
      const costIncGstRaw = String(formData.get(`itemCostIncGst_${i}`) ?? "").trim();
      const costPriceIncGst = costIncGstRaw ? Number(costIncGstRaw) : costPriceExGst;
      return { productId, quantity, costPriceExGst, costPriceIncGst, lineTotal: quantity * costPriceIncGst };
    })
    .filter((it) => it.productId && it.quantity > 0 && it.costPriceExGst >= 0 && it.costPriceIncGst >= 0);

  if (items.length === 0) {
    throw new Error("Add at least one line item with a product, quantity, and cost price");
  }

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.costPriceExGst, 0);
  const totalAmount = items.reduce((sum, it) => sum + it.lineTotal, 0);
  const gstTotal = totalAmount - subtotal;

  const role = session.user.role as StaffRole;
  const createdBy = `${session.user.name} (${ROLE_LABELS[role]})`;

  const invoice = await prisma.purchaseInvoice.create({
    data: {
      shopName,
      gstNumber,
      invoiceNumber,
      invoiceDate,
      subtotal,
      gstTotal,
      totalAmount,
      createdBy,
      items: { create: items },
    },
  });

  revalidatePath("/admin/purchases");
  redirect(`/admin/purchases/${invoice.id}`);
}

export async function approvePurchaseInvoice(invoiceId: string) {
  const session = await requireAdmin();
  if (!canApprovePurchaseInvoice(session.user.role)) {
    throw new Error("Only an admin can approve a purchase invoice");
  }

  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });
  if (!invoice) throw new Error("Purchase invoice not found");
  if (invoice.status !== "PENDING") {
    throw new Error("This invoice has already been processed");
  }

  const role = session.user.role as StaffRole;
  const approvedBy = `${session.user.name} (${ROLE_LABELS[role]})`;

  await prisma.$transaction(async (tx) => {
    for (const item of invoice.items) {
      const inventoryItem = await tx.inventoryItem.upsert({
        where: { productId: item.productId },
        create: { productId: item.productId, quantityOnHand: item.quantity },
        update: { quantityOnHand: { increment: item.quantity } },
      });
      await tx.inventoryAdjustment.create({
        data: {
          inventoryItemId: inventoryItem.id,
          change: item.quantity,
          reason: `Purchase invoice #${invoice.invoiceNumber} (${invoice.shopName}) approved`,
        },
      });

      // Roll the latest purchase cost into the product's default unit so
      // margins/inventory reports reflect the newest cost price.
      const defaultUnit = await tx.productUnit.findFirst({
        where: { productId: item.productId, isDefault: true },
      });
      if (defaultUnit) {
        const hasGst = item.costPriceIncGst > item.costPriceExGst;
        await tx.productUnit.update({
          where: { id: defaultUnit.id },
          data: {
            costPrice: item.costPriceExGst,
            costPriceIncGst: hasGst ? item.costPriceIncGst : null,
            gstApplicable: hasGst || defaultUnit.gstApplicable,
            gstRate: hasGst
              ? Math.round(((item.costPriceIncGst - item.costPriceExGst) / item.costPriceExGst) * 10000) / 100
              : defaultUnit.gstRate,
          },
        });
      }
    }

    await tx.purchaseInvoice.update({
      where: { id: invoiceId },
      data: { status: "APPROVED", approvedBy, approvedAt: new Date() },
    });
  });

  revalidatePath("/admin/purchases");
  revalidatePath(`/admin/purchases/${invoiceId}`);
  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
}

export async function rejectPurchaseInvoice(invoiceId: string, reason: string) {
  const session = await requireAdmin();
  if (!canApprovePurchaseInvoice(session.user.role)) {
    throw new Error("Only an admin can reject a purchase invoice");
  }
  if (!reason.trim()) throw new Error("A rejection reason is required");

  const invoice = await prisma.purchaseInvoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) throw new Error("Purchase invoice not found");
  if (invoice.status !== "PENDING") {
    throw new Error("This invoice has already been processed");
  }

  const role = session.user.role as StaffRole;
  await prisma.purchaseInvoice.update({
    where: { id: invoiceId },
    data: {
      status: "REJECTED",
      rejectionReason: reason.trim(),
      approvedBy: `${session.user.name} (${ROLE_LABELS[role]})`,
      approvedAt: new Date(),
    },
  });

  revalidatePath("/admin/purchases");
  revalidatePath(`/admin/purchases/${invoiceId}`);
}

export async function deletePurchaseInvoice(invoiceId: string) {
  await requireCatalogManager();
  const invoice = await prisma.purchaseInvoice.findUnique({ where: { id: invoiceId } });
  if (!invoice) return;
  if (invoice.status !== "PENDING") {
    throw new Error("Only a pending invoice can be deleted");
  }
  await prisma.purchaseInvoice.delete({ where: { id: invoiceId } });
  revalidatePath("/admin/purchases");
  redirect("/admin/purchases");
}
