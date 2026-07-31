import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const lines = body.lines as {
    productId: string;
    unitLabel: string;
    quantity: number;
    price: number;
  }[];
  const businessAccountId = body.businessAccountId as string | null | undefined;
  const customerReference = body.customerReference as string | undefined;

  if (!lines || lines.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const orderNumber = String(200000 + Math.floor(Math.random() * 90000));

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId: session.user.id,
      businessAccountId: businessAccountId || null,
      customerReference: customerReference || null,
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          unitLabel: l.unitLabel,
          quantity: l.quantity,
          unitPrice: l.price,
          amount: l.price * l.quantity,
        })),
      },
      history: { create: [{ status: "RECEIVED" }] },
    },
  });

  return NextResponse.json({ orderNumber: order.orderNumber });
}
