import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PAYMENT_SLIP_BUCKET, uploadToBucket, removeFromBucket } from "@/lib/supabase-storage";
import { canVerifyPayment, ROLE_LABELS, type StaffRole } from "@/lib/roles";

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
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = order.userId === session.user.id;
  const isStaffUploader = canVerifyPayment(session.user.role);
  if (!isOwner && !isStaffUploader) {
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

  // Staff uploading on the customer's behalf (e.g. a counter payment, or a
  // receipt confirmed through the shop's own bank statement) IS the
  // verification — there's no one else left to review it, so this skips
  // straight to VERIFIED instead of leaving it PENDING like a customer's
  // own self-upload does.
  const now = new Date();
  const slipStatus = isStaffUploader
    ? {
        status: "VERIFIED" as const,
        verifiedAt: now,
        verifiedBy: `${session.user.name} (${ROLE_LABELS[session.user.role as StaffRole]})`,
        rejectionReason: null,
      }
    : { status: "PENDING" as const, verifiedAt: null, verifiedBy: null, rejectionReason: null };

  await prisma.paymentSlip.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      filePath,
      fileName: file.name,
      mimeType: file.type,
      ...slipStatus,
    },
    update: {
      filePath,
      fileName: file.name,
      mimeType: file.type,
      uploadedAt: now,
      ...slipStatus,
    },
  });

  await prisma.notification.create({
    data: {
      type: "PAYMENT_SLIP_UPLOADED",
      message: isStaffUploader
        ? `Payment slip uploaded and verified by staff for order #${order.orderNumber}`
        : `Payment slip uploaded for order #${order.orderNumber}`,
      orderId: order.id,
    },
  });

  revalidatePath("/account/orders");
  revalidatePath(`/admin/orders/${order.id}`);
  revalidatePath("/admin/orders");

  return NextResponse.json({ ok: true });
}
