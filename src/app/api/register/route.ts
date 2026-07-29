import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const firstName = (body.firstName as string | undefined)?.trim();
  const lastName = (body.lastName as string | undefined)?.trim();
  const email = (body.email as string | undefined)?.trim().toLowerCase();
  const phone = (body.phone as string | undefined)?.trim();
  const password = body.password as string | undefined;

  if (!firstName || !lastName || !email || !phone || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email or phone already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { firstName, lastName, email, phone, passwordHash },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}
