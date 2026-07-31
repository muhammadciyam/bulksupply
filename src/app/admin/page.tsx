import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMVR, ORDER_STATUS_LABEL } from "@/lib/format";
import { isStaffRole } from "@/lib/roles";
import { expireOverduePayments } from "@/lib/auto-cancel";
import { Package, Boxes, AlertTriangle, Truck, Receipt, CheckCircle2 } from "lucide-react";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");

  await expireOverduePayments();

  if (session.user.role === "CASHIER") return <CashierDashboard />;
  if (session.user.role === "DELIVERY") return <DeliveryDashboard driverId={session.user.id} />;
  const { from, to } = await searchParams;
  return <AdminDashboardHome customFrom={from} customTo={to} />;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

async function getSalesForRange(start: Date, end: Date) {
  const where = { createdAt: { gte: start, lt: end }, status: { not: "CANCELLED" as const } };
  const [agg, orderCount] = await Promise.all([
    prisma.orderItem.aggregate({ _sum: { amount: true }, where: { order: where } }),
    prisma.order.count({ where }),
  ]);
  return { revenue: agg._sum.amount ?? 0, orderCount };
}

function SalesCard({ label, revenue, orderCount }: { label: string; revenue: number; orderCount: number }) {
  return (
    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-bold text-brand-green">MVR {formatMVR(revenue)}</p>
      <p className="text-xs text-gray-400">{orderCount} order{orderCount === 1 ? "" : "s"}</p>
    </div>
  );
}

async function AdminDashboardHome({ customFrom, customTo }: { customFrom?: string; customTo?: string }) {
  const [productCount, inventoryItems, orders, activeOrders] = await Promise.all([
    prisma.product.count(),
    prisma.inventoryItem.findMany({ include: { product: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: true },
    }),
    prisma.order.count({ where: { status: { notIn: ["COMPLETE", "CANCELLED"] } } }),
  ]);

  const lowStock = inventoryItems.filter((i) => i.quantityOnHand <= i.lowStockThreshold);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(todayStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);

  const daysSinceMonday = (todayStart.getDay() + 6) % 7;
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - daysSinceMonday);

  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

  const [today, week, month, lifetimeRevenue] = await Promise.all([
    getSalesForRange(todayStart, rangeEnd),
    getSalesForRange(weekStart, rangeEnd),
    getSalesForRange(monthStart, rangeEnd),
    prisma.orderItem.aggregate({ _sum: { amount: true }, where: { order: { status: { not: "CANCELLED" } } } }),
  ]);

  let custom: { revenue: number; orderCount: number } | null = null;
  if (customFrom && customTo && DATE_ONLY.test(customFrom) && DATE_ONLY.test(customTo)) {
    const from = new Date(`${customFrom}T00:00:00`);
    const to = new Date(`${customTo}T00:00:00`);
    to.setDate(to.getDate() + 1);
    if (from < to) custom = await getSalesForRange(from, to);
  }

  const cards = [
    { label: "Products", value: productCount, icon: Package, color: "bg-blue-50 text-brand-green" },
    { label: "Low Stock Items", value: lowStock.length, icon: AlertTriangle, color: "bg-red-50 text-brand-red" },
    { label: "Active Orders", value: activeOrders, icon: Truck, color: "bg-sky-50 text-sky-600" },
    { label: "Inventory SKUs", value: inventoryItems.length, icon: Boxes, color: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-brand-navy">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4">
            <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${c.color}`}>
              <c.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-brand-navy text-sm">Sales</h2>
          <form action="/admin" className="flex items-end flex-wrap gap-2">
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">From</label>
              <input
                type="date"
                name="from"
                defaultValue={customFrom}
                max={new Date().toISOString().slice(0, 10)}
                className="border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">To</label>
              <input
                type="date"
                name="to"
                defaultValue={customTo}
                max={new Date().toISOString().slice(0, 10)}
                className="border border-gray-300 rounded px-2.5 py-1.5 text-xs bg-gray-50"
              />
            </div>
            <button
              type="submit"
              className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold px-3 py-1.5 rounded"
            >
              Show
            </button>
            {(customFrom || customTo) && (
              <Link href="/admin" className="text-xs text-gray-400 hover:text-brand-red px-1 py-1.5">
                Clear
              </Link>
            )}
          </form>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SalesCard label="Today" revenue={today.revenue} orderCount={today.orderCount} />
          <SalesCard label="This Week" revenue={week.revenue} orderCount={week.orderCount} />
          <SalesCard label="This Month" revenue={month.revenue} orderCount={month.orderCount} />
        </div>

        {custom && (
          <SalesCard label={`${customFrom} to ${customTo}`} revenue={custom.revenue} orderCount={custom.orderCount} />
        )}

        <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
          Lifetime total: MVR {formatMVR(lifetimeRevenue._sum.amount ?? 0)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-brand-navy text-sm">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-brand-green font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0 hover:text-brand-green"
              >
                <span>
                  #{o.orderNumber} · {o.user.firstName} {o.user.lastName}
                </span>
                <span className="text-xs text-gray-400">{ORDER_STATUS_LABEL[o.status]}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-brand-navy text-sm">Low Stock Alerts</h2>
            <Link href="/admin/inventory" className="text-xs text-brand-green font-medium">
              Manage inventory
            </Link>
          </div>
          <div className="space-y-2">
            {lowStock.length === 0 && <p className="text-xs text-gray-400">All stock levels are healthy.</p>}
            {lowStock.map((i) => (
              <div key={i.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
                <span>{i.product.name}</span>
                <span className="text-xs text-brand-red font-medium">
                  {i.quantityOnHand} left (min {i.lowStockThreshold})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

async function CashierDashboard() {
  const [awaitingConfirmation, awaitingQuote, awaitingPayment, awaitingInvoice, queue] = await Promise.all([
    prisma.order.count({ where: { status: "RECEIVED" } }),
    prisma.order.count({ where: { status: "ORDER_CONFIRMED" } }),
    prisma.order.count({ where: { status: "PRICE_QUOTED" } }),
    prisma.order.count({ where: { status: "PAYMENT_PROCESSING" } }),
    prisma.order.findMany({
      where: { status: { in: ["RECEIVED", "ORDER_CONFIRMED", "PRICE_QUOTED", "PAYMENT_PROCESSING"] } },
      orderBy: { createdAt: "asc" },
      take: 10,
      include: { user: true },
    }),
  ]);

  const cards = [
    { label: "Awaiting Confirmation", value: awaitingConfirmation, icon: Receipt, color: "bg-sky-50 text-sky-600" },
    { label: "Awaiting Price Quote", value: awaitingQuote, icon: Receipt, color: "bg-amber-50 text-amber-600" },
    { label: "Awaiting Payment", value: awaitingPayment, icon: Receipt, color: "bg-blue-50 text-brand-green" },
    { label: "Awaiting Invoice", value: awaitingInvoice, icon: Receipt, color: "bg-red-50 text-brand-red" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-brand-navy">Cashier Queue</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4">
            <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${c.color}`}>
              <c.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-brand-navy text-sm">Needs Attention</h2>
          <Link href="/admin/orders" className="text-xs text-brand-green font-medium">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {queue.length === 0 && <p className="text-xs text-gray-400">Nothing waiting on you right now.</p>}
          {queue.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0 hover:text-brand-green"
            >
              <span>
                #{o.orderNumber} · {o.user.firstName} {o.user.lastName}
              </span>
              <span className="text-xs text-gray-400">{ORDER_STATUS_LABEL[o.status]}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

async function DeliveryDashboard({ driverId }: { driverId: string }) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [myActive, unassigned, completedToday, myQueue] = await Promise.all([
    prisma.order.count({ where: { assignedToId: driverId, status: "ON_DELIVERY" } }),
    prisma.order.count({ where: { assignedToId: null, status: "ON_DELIVERY" } }),
    prisma.order.count({
      where: { assignedToId: driverId, status: "COMPLETE", updatedAt: { gte: todayStart } },
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { assignedToId: driverId, status: "ON_DELIVERY" },
          { assignedToId: null, status: "ON_DELIVERY" },
        ],
      },
      orderBy: { updatedAt: "asc" },
      take: 10,
      include: { user: true, delivery: true },
    }),
  ]);

  const cards = [
    { label: "My Active Deliveries", value: myActive, icon: Truck, color: "bg-sky-50 text-sky-600" },
    { label: "Unassigned & Ready", value: unassigned, icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
    { label: "Completed Today", value: completedToday, icon: CheckCircle2, color: "bg-blue-50 text-brand-green" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-brand-navy">Delivery Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-lg p-5 flex items-center gap-4">
            <div className={`h-11 w-11 rounded-lg flex items-center justify-center ${c.color}`}>
              <c.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-brand-navy">{c.value}</p>
              <p className="text-xs text-gray-500">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-brand-navy text-sm">On The Road</h2>
          <Link href="/admin/orders" className="text-xs text-brand-green font-medium">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {myQueue.length === 0 && <p className="text-xs text-gray-400">No deliveries waiting right now.</p>}
          {myQueue.map((o) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0 hover:text-brand-green"
            >
              <span>
                #{o.orderNumber} · {o.user.firstName} {o.user.lastName}
              </span>
              <span className="text-xs text-gray-400">{o.delivery?.location ?? "No location set"}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
