import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatMVR, ORDER_STATUS_LABEL } from "@/lib/format";
import { isStaffRole } from "@/lib/roles";
import { Package, Boxes, AlertTriangle, Truck } from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");
  if (session.user.role !== "ADMIN") redirect("/admin/orders");

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
  const totalRevenue = await prisma.orderItem.aggregate({ _sum: { amount: true } });

  const cards = [
    { label: "Products", value: productCount, icon: Package, color: "bg-emerald-50 text-brand-green" },
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

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-sm text-gray-500">Total revenue (all orders)</p>
        <p className="text-2xl font-bold text-brand-green">
          MVR {formatMVR(totalRevenue._sum.amount ?? 0)}
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
