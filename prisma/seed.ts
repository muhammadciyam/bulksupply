import { PrismaClient, Role, AccountStatus, StockStatus, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  "Dairy",
  "Tea",
  "Coffee & Instants",
  "Beverages",
  "Dates & Dried Fruits",
  "Grains Cereals & Spreads",
  "Confectionaries & Snacks",
  "Canned Foods",
  "Cooking & Baking",
  "Personal Care",
  "Sauces & Oils",
  "Wipes & Diapers",
  "Household & Others",
];

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const products: {
  sku: string;
  name: string;
  category: string;
  stockStatus: StockStatus;
  units: { label: string; packSize: string; price: number; isDefault?: boolean }[];
  qty: number;
  threshold: number;
}[] = [
  { sku: "PC-001", name: "Fresh Body Wash Blueberry 200ml", category: "Personal Care", stockStatus: StockStatus.LOW_STOCK, units: [{ label: "Dozen", packSize: "12 X 200ML", price: 250, isDefault: true }], qty: 6, threshold: 10 },
  { sku: "PC-002", name: "Fresh Body Wash Strawberry 200ml", category: "Personal Care", stockStatus: StockStatus.LOW_STOCK, units: [{ label: "Dozen", packSize: "12 X 200ML", price: 250, isDefault: true }], qty: 8, threshold: 10 },
  { sku: "WD-001", name: "Comfy Adult Diaper Leak-Guard Large", category: "Wipes & Diapers", stockStatus: StockStatus.NEW_STOCK, units: [{ label: "Carton", packSize: "1X8 PACKS", price: 940, isDefault: true }], qty: 45, threshold: 15 },
  { sku: "WD-002", name: "Comfy Adult Diaper Leak-Guard Medium", category: "Wipes & Diapers", stockStatus: StockStatus.NEW_STOCK, units: [{ label: "Carton", packSize: "1X8 PACKS", price: 940, isDefault: true }], qty: 38, threshold: 15 },
  { sku: "WD-003", name: "PureTouch Antibacterial Wipes Fragrance (80's)", category: "Wipes & Diapers", stockStatus: StockStatus.NEW_STOCK, units: [{ label: "Carton", packSize: "24 X 80'S", price: 690, isDefault: true }], qty: 52, threshold: 15 },
  { sku: "WD-004", name: "PureTouch Antibacterial Wipes Fragrance Free (80's)", category: "Wipes & Diapers", stockStatus: StockStatus.NEW_STOCK, units: [{ label: "Carton", packSize: "24 X 80'S", price: 690, isDefault: true }], qty: 40, threshold: 15 },
  { sku: "HH-001", name: "SoftClean Laundry Detergent 2ltr", category: "Household & Others", stockStatus: StockStatus.NEW_STOCK, units: [{ label: "Carton", packSize: "6 X 2 LTR", price: 710, isDefault: true }], qty: 30, threshold: 12 },
  { sku: "WD-005", name: "PureTouch Wet Wipes Cherry Blossom (80's)", category: "Wipes & Diapers", stockStatus: StockStatus.NEW_STOCK, units: [{ label: "Carton", packSize: "24 X 80'S", price: 650, isDefault: true }], qty: 60, threshold: 15 },
  { sku: "WD-006", name: "PureTouch Wet Wipes Fragrance Free (80's)", category: "Wipes & Diapers", stockStatus: StockStatus.NEW_STOCK, units: [{ label: "Carton", packSize: "24 X 80'S", price: 650, isDefault: true }], qty: 55, threshold: 15 },
  { sku: "WD-007", name: "PureTouch Wet Wipes Fresh (80's)", category: "Wipes & Diapers", stockStatus: StockStatus.NEW_STOCK, units: [{ label: "Carton", packSize: "24 X 80'S", price: 650, isDefault: true }], qty: 50, threshold: 15 },
  { sku: "PC-003", name: "SunSmile Grape Toothpaste 45g", category: "Personal Care", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Carton", packSize: "24 X 45G", price: 340, isDefault: true }], qty: 70, threshold: 15 },
  { sku: "PC-004", name: "SunSmile Melon Toothpaste 45g", category: "Personal Care", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Carton", packSize: "24 X 45G", price: 340, isDefault: true }], qty: 65, threshold: 15 },
  { sku: "DR-001", name: "Golden UHT Milk 200ml Chocolate", category: "Dairy", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Carton", packSize: "24 X 200ML", price: 290, isDefault: true }], qty: 80, threshold: 20 },
  { sku: "DR-002", name: "Golden UHT Milk 200ml Full Cream", category: "Dairy", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Carton", packSize: "24 X 200ML", price: 275, isDefault: true }], qty: 90, threshold: 20 },
  { sku: "DR-003", name: "Golden UHT Milk 1ltr Low Fat", category: "Dairy", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Carton", packSize: "12 X 1LTR", price: 480, isDefault: true }], qty: 40, threshold: 15 },
  { sku: "CF-001", name: "Highland Coffee Zero 2 in 1", category: "Coffee & Instants", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Packet", packSize: "20X30S X 12G", price: 140, isDefault: true }], qty: 100, threshold: 25 },
  { sku: "CF-002", name: "Highland Coffee 3 in 1 Salted Caramel", category: "Coffee & Instants", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Packet", packSize: "20X15S X 31.6G", price: 120, isDefault: true }], qty: 85, threshold: 20 },
  { sku: "TE-001", name: "Ceylon Premium Tea 50's", category: "Tea", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Carton", packSize: "1X50 BAGS", price: 210, isDefault: true }], qty: 60, threshold: 15 },
  { sku: "CN-001", name: "Farmhouse Chicken in Sunflower Oil 160g", category: "Canned Foods", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Carton", packSize: "1X24 CANS", price: 660, isDefault: true }], qty: 35, threshold: 15 },
  { sku: "SO-001", name: "Golden Oyster Sauce 320g", category: "Sauces & Oils", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Carton", packSize: "1X24 BTL", price: 510, isDefault: true }], qty: 28, threshold: 10 },
  { sku: "GC-001", name: "Nature's Best Cereal Less Sugar", category: "Grains Cereals & Spreads", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Packet", packSize: "24 X 18S X 25G", price: 120, isDefault: true }], qty: 45, threshold: 15 },
  { sku: "DD-001", name: "Wildflower Honey (Glass Bottle) 250g", category: "Dates & Dried Fruits", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Carton", packSize: "1X12 BTL", price: 720, isDefault: true }], qty: 20, threshold: 8 },
  { sku: "BV-001", name: "Blueberry Yogurt Drink 200ml", category: "Beverages", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Carton", packSize: "1X24 BTL", price: 220, isDefault: true }], qty: 50, threshold: 15 },
  { sku: "CS-001", name: "Classic Peanut Butter Sandwich Crackers", category: "Confectionaries & Snacks", stockStatus: StockStatus.IN_STOCK, units: [{ label: "Carton", packSize: "1X12 PKT", price: 180, isDefault: true }], qty: 55, threshold: 15 },
];

async function main() {
  console.log("Seeding Bulk Supply database...");

  const categoryMap = new Map<string, string>();
  for (let i = 0; i < categories.length; i++) {
    const name = categories[i];
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name), sortOrder: i },
    });
    categoryMap.set(name, cat.id);
  }

  for (const p of products) {
    const categoryId = categoryMap.get(p.category);
    if (!categoryId) continue;

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        sku: p.sku,
        name: p.name,
        slug: slugify(p.name) + "-" + p.sku.toLowerCase(),
        categoryId,
        stockStatus: p.stockStatus,
        units: {
          create: p.units,
        },
      },
    });

    await prisma.inventoryItem.upsert({
      where: { productId: product.id },
      update: { quantityOnHand: p.qty, lowStockThreshold: p.threshold },
      create: {
        productId: product.id,
        quantityOnHand: p.qty,
        lowStockThreshold: p.threshold,
      },
    });
  }

  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bulksupply.mv" },
    update: {},
    create: {
      firstName: "Bulk",
      lastName: "Admin",
      email: "admin@bulksupply.mv",
      phone: "7000000",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const cashierPasswordHash = await bcrypt.hash("Cashier@123", 10);
  await prisma.user.upsert({
    where: { email: "cashier@bulksupply.mv" },
    update: {},
    create: {
      firstName: "Cash",
      lastName: "Counter",
      email: "cashier@bulksupply.mv",
      phone: "7000001",
      passwordHash: cashierPasswordHash,
      role: Role.CASHIER,
    },
  });

  const deliveryPasswordHash = await bcrypt.hash("Delivery@123", 10);
  await prisma.user.upsert({
    where: { email: "delivery@bulksupply.mv" },
    update: {},
    create: {
      firstName: "Godown",
      lastName: "Staff",
      email: "delivery@bulksupply.mv",
      phone: "7000002",
      passwordHash: deliveryPasswordHash,
      role: Role.DELIVERY,
    },
  });

  const customerPasswordHash = await bcrypt.hash("Demo@123", 10);
  const customer = await prisma.user.upsert({
    where: { email: "demo.customer@example.com" },
    update: {},
    create: {
      firstName: "Demo",
      lastName: "Customer",
      email: "demo.customer@example.com",
      phone: "7799190",
      passwordHash: customerPasswordHash,
      role: Role.CUSTOMER,
    },
  });

  const accountsData = [
    { name: "Seven Mart", location: "Hulhumale", status: AccountStatus.APPROVED },
    { name: "Tiny Nemo", location: "Hulhumale", status: AccountStatus.CLOSED },
    { name: "City Wholesale", location: "Hulhumale", status: AccountStatus.CLOSED },
    { name: "Male City Store", location: "Male'", status: AccountStatus.PENDING },
  ];

  const createdAccounts = [];
  for (const a of accountsData) {
    const existing = await prisma.businessAccount.findFirst({
      where: { name: a.name, ownerId: customer.id },
    });
    if (existing) {
      createdAccounts.push(existing);
      continue;
    }
    const account = await prisma.businessAccount.create({
      data: { ...a, ownerId: customer.id },
    });
    createdAccounts.push(account);
  }

  const existingOrder = await prisma.order.findFirst({
    where: { orderNumber: "245849" },
  });

  if (!existingOrder) {
    const allProducts = await prisma.product.findMany({ include: { units: true } });
    const pick = (sku: string) => allProducts.find((pr) => pr.sku === sku)!;

    const orderItemsSpec = [
      { sku: "DR-001", qty: 1 },
      { sku: "DR-002", qty: 1 },
      { sku: "DR-003", qty: 1 },
      { sku: "CN-001", qty: 1 },
      { sku: "DD-001", qty: 1 },
      { sku: "BV-001", qty: 1 },
      { sku: "SO-001", qty: 1 },
      { sku: "GC-001", qty: 1 },
      { sku: "CF-001", qty: 2 },
      { sku: "TE-001", qty: 1 },
    ];

    const items = orderItemsSpec.map((spec) => {
      const product = pick(spec.sku);
      const unit = product.units[0];
      return {
        productId: product.id,
        unitLabel: unit.label,
        quantity: spec.qty,
        unitPrice: unit.price,
        amount: unit.price * spec.qty,
      };
    });
    const total = items.reduce((sum, it) => sum + it.amount, 0);

    const order = await prisma.order.create({
      data: {
        orderNumber: "245849",
        userId: customer.id,
        businessAccountId: createdAccounts[0].id,
        status: OrderStatus.ON_DELIVERY,
        deliveryMethod: "delivery",
        items: { create: items },
        invoice: { create: { referenceNo: "22189398", amount: total } },
        delivery: { create: { location: "Hulhumale" } },
        history: {
          create: [
            OrderStatus.RECEIVED,
            OrderStatus.ORDER_CONFIRMED,
            OrderStatus.PRICE_QUOTED,
            OrderStatus.PAYMENT_PROCESSING,
            OrderStatus.ORDER_INVOICED,
            OrderStatus.ON_DELIVERY,
          ].map((status) => ({ status })),
        },
      },
    });
    console.log("Created demo order", order.orderNumber, "total", total);
  }

  console.log("Seed complete.");
  console.log("Admin login:", admin.email, "/ Admin@123");
  console.log("Customer login:", customer.email, "or", customer.phone, "/ Demo@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
