import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatMVR, ORDER_STATUS_LABEL } from "@/lib/format";
import { upsertDelivery, assignDelivery } from "../../actions";
import { StatusControls } from "./StatusControls";
import { AssignDriver } from "./AssignDriver";
import { isStaffRole, canAssignDelivery, ORDER_STATUS_PERMISSIONS, type StaffRole } from "@/lib/roles";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");
  const role = session.user.role as StaffRole;

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      businessAccount: true,
      items: { include: { product: true } },
      invoice: true,
      delivery: true,
      assignedTo: true,
      history: { orderBy: { changedAt: "asc" } },
    },
  });
  if (!order) notFound();

  const total = order.items.reduce((s, it) => s + it.amount, 0);
  const upsertDeliveryWithId = upsertDelivery.bind(null, order.id);

  const driverOptions = canAssignDelivery(role)
    ? await prisma.user.findMany({
        where: { role: "DELIVERY", isActive: true },
        orderBy: { firstName: "asc" },
      })
    : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-brand-navy">Order #{order.orderNumber}</h1>
        <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-400 text-xs">Customer</p>
          <p className="text-gray-800">
            {order.user.firstName} {order.user.lastName}
          </p>
          <p className="text-gray-500 text-xs">{order.user.phone}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Business Account</p>
          <p className="text-gray-800">{order.businessAccount?.name ?? "-"}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Total</p>
          <p className="text-brand-green font-bold">MVR {formatMVR(total)}</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Order Status</h2>
        <StatusControls
          orderId={order.id}
          currentStatus={order.status}
          allowedStatuses={ORDER_STATUS_PERMISSIONS[role]}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Assigned Driver</h2>
        {canAssignDelivery(role) ? (
          <AssignDriver
            orderId={order.id}
            currentDriverId={order.assignedToId}
            drivers={driverOptions.map((d) => ({ id: d.id, name: `${d.firstName} ${d.lastName}` }))}
            onAssign={assignDelivery}
          />
        ) : (
          <p className="text-sm text-gray-600">
            {order.assignedTo ? `${order.assignedTo.firstName} ${order.assignedTo.lastName}` : "Not yet assigned"}
          </p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Items</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="font-normal pb-2">Item</th>
              <th className="font-normal pb-2 text-right">Qty</th>
              <th className="font-normal pb-2 text-right">Unit</th>
              <th className="font-normal pb-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-b border-gray-50">
                <td className="py-2 text-gray-800">{it.product.name}</td>
                <td className="py-2 text-right">{it.quantity}</td>
                <td className="py-2 text-right">{it.unitLabel}</td>
                <td className="py-2 text-right">{formatMVR(it.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={upsertDeliveryWithId} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Delivery &amp; Invoice</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Delivery Method</label>
            <select
              name="deliveryMethod"
              defaultValue={order.deliveryMethod}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
            >
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Customer Reference</label>
            <input
              name="customerReference"
              defaultValue={order.customerReference ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Delivery Location</label>
            <input
              name="location"
              defaultValue={order.delivery?.location ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Address Details</label>
            <input
              name="addressDetails"
              defaultValue={order.delivery?.addressDetails ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Address Location (map link)</label>
            <input
              name="addressLocation"
              defaultValue={order.delivery?.addressLocation ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Invoice Reference No.</label>
            <input
              name="invoiceRef"
              defaultValue={order.invoice?.referenceNo ?? ""}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Invoice Amount</label>
            <input
              name="invoiceAmount"
              type="number"
              step="0.01"
              defaultValue={order.invoice?.amount ?? total}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-6 py-2 rounded text-sm"
        >
          Save Delivery &amp; Invoice
        </button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Status History</h2>
        <div className="space-y-2">
          {order.history.map((h) => (
            <div key={h.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0">
              <span className="text-gray-800">{ORDER_STATUS_LABEL[h.status]}</span>
              <span className="text-xs text-gray-400">
                {h.changedBy ?? "System"} · {formatDate(h.changedAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
