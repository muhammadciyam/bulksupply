import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AccountHeader } from "@/components/AccountHeader";
import { OrdersView } from "./OrdersView";

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: { include: { product: true } },
      invoice: true,
      delivery: true,
      user: true,
    },
  });

  const serialized = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    deliveryMethod: o.deliveryMethod,
    customerReference: o.customerReference,
    createdAt: o.createdAt.toISOString(),
    createdBy: `${o.user.firstName} ${o.user.lastName}`,
    contactNumber: o.user.phone,
    items: o.items.map((it) => ({
      id: it.id,
      name: it.product.name,
      sku: it.product.sku,
      unitLabel: it.unitLabel,
      quantity: it.quantity,
      amount: it.amount,
    })),
    invoice: o.invoice
      ? { referenceNo: o.invoice.referenceNo, amount: o.invoice.amount }
      : null,
    delivery: o.delivery
      ? {
          location: o.delivery.location,
          addressDetails: o.delivery.addressDetails,
          addressLocation: o.delivery.addressLocation,
        }
      : null,
  }));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AccountHeader />
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
        <OrdersView orders={serialized} />
      </main>
    </div>
  );
}
