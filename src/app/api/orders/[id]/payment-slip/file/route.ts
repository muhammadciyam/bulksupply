import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canVerifyPayment } from "@/lib/roles";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { paymentSlip: true },
  });
  if (!order || !order.paymentSlip) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = order.userId === session.user.id;
  if (!isOwner && !canVerifyPayment(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await readFile(order.paymentSlip.filePath);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": order.paymentSlip.mimeType,
      "Content-Disposition": `inline; filename="${order.paymentSlip.fileName}"`,
    },
  });
}
