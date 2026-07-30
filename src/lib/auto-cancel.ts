import { prisma } from "@/lib/prisma";

// Lazily evaluated: this app has no background job runner, so overdue
// orders are cancelled the next time anyone loads an orders list rather
// than at the exact deadline instant. Called from the admin/customer
// orders pages and the admin dashboard.
export async function expireOverduePayments() {
  const overdue = await prisma.order.findMany({
    where: {
      status: "PAYMENT_PROCESSING",
      paymentDeadline: { lt: new Date() },
      paymentSlip: null,
    },
    select: { id: true },
  });

  if (overdue.length === 0) return;

  await prisma.$transaction(
    overdue.flatMap((o) => [
      prisma.order.update({ where: { id: o.id }, data: { status: "CANCELLED" } }),
      prisma.orderStatusHistory.create({
        data: {
          orderId: o.id,
          status: "CANCELLED",
          changedBy: "System (auto-cancel — no payment slip uploaded in time)",
        },
      }),
    ])
  );
}
