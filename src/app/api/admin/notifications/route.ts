import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canVerifyPayment } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  if (!session?.user || !canVerifyPayment(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where: { read: false } }),
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { order: { select: { id: true, orderNumber: true } } },
    }),
  ]);

  return NextResponse.json({
    unreadCount,
    notifications: notifications.map((n) => ({
      id: n.id,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      orderId: n.order?.id ?? null,
      orderNumber: n.order?.orderNumber ?? null,
    })),
  });
}
