import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMVR, ORDER_STATUS_LABEL } from "@/lib/format";
import { isStaffRole } from "@/lib/roles";
import { expireOverduePayments } from "@/lib/auto-cancel";

export default async function AdminOrdersPage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");

  await expireOverduePayments();

  const isDelivery = session.user.role === "DELIVERY";

  const orders = await prisma.order.findMany({
    where: isDelivery
      ? {
          OR: [
            { assignedToId: session.user.id },
            { assignedToId: null, status: "ON_DELIVERY" },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { user: true, items: true, businessAccount: true, assignedTo: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand-navy">
        {isDelivery ? "My Deliveries" : "Orders & Delivery"}
      </h1>
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="font-normal px-4 py-3">Order</th>
              <th className="font-normal px-4 py-3">Customer</th>
              <th className="font-normal px-4 py-3">Account</th>
              <th className="font-normal px-4 py-3">Date</th>
              <th className="font-normal px-4 py-3">Total</th>
              <th className="font-normal px-4 py-3">Status</th>
              <th className="font-normal px-4 py-3">Assigned To</th>
              <th className="font-normal px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">#{o.orderNumber}</td>
                <td className="px-4 py-3 text-gray-600">
                  {o.user.firstName} {o.user.lastName}
                </td>
                <td className="px-4 py-3 text-gray-600">{o.businessAccount?.name ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3 text-gray-600">
                  MVR {formatMVR(o.items.reduce((s, it) => s + it.amount, 0))}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium text-gray-700">
                    {ORDER_STATUS_LABEL[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {o.assignedTo ? `${o.assignedTo.firstName} ${o.assignedTo.lastName}` : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/orders/${o.id}`} className="text-brand-green text-xs font-medium">
                    Manage
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
