import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ accounts: [] });

  const accounts = await prisma.businessAccount.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const name = (body.name as string | undefined)?.trim();
  const location = (body.location as string | undefined)?.trim();
  if (!name || !location) {
    return NextResponse.json({ error: "Name and location are required" }, { status: 400 });
  }

  const account = await prisma.businessAccount.create({
    data: {
      name,
      location,
      ownerId: session.user.id,
    },
  });
  return NextResponse.json({ account });
}
