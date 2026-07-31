import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_SLIP_BUCKET, uploadToBucket, removeFromBucket } from "@/lib/supabase-storage";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { paymentSlip: true } });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (order.status !== "PAYMENT_PROCESSING") {
    return NextResponse.json(
      { error: "This order is not currently awaiting payment" },
      { status: 400 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File must be 5MB or smaller" }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "Only JPG, PNG, or PDF files are allowed" }, { status: 400 });
  }

  const filePath = `${order.id}.${ext}`;

  if (order.paymentSlip && order.paymentSlip.filePath !== filePath) {
    await removeFromBucket(PAYMENT_SLIP_BUCKET, order.paymentSlip.filePath);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await uploadToBucket(PAYMENT_SLIP_BUCKET, filePath, buffer, file.type);

  await prisma.paymentSlip.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      filePath,
      fileName: file.name,
      mimeType: file.type,
    },
    update: {
      filePath,
      fileName: file.name,
      mimeType: file.type,
      status: "PENDING",
      uploadedAt: new Date(),
      verifiedAt: null,
      verifiedBy: null,
      rejectionReason: null,
    },
  });

  await prisma.notification.create({
    data: {
      type: "PAYMENT_SLIP_UPLOADED",
      message: `Payment slip uploaded for order #${order.orderNumber}`,
      orderId: order.id,
    },
  });

  revalidatePath("/account/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/orders");

  return NextResponse.json({ ok: true });
}
