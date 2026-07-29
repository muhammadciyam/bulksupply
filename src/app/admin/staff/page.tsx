import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ROLE_LABELS, type StaffRole } from "@/lib/roles";
import { StaffManager } from "./StaffManager";

export default async function StaffPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin/login");

  const staff = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "CASHIER", "DELIVERY"] } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand-navy">Staff</h1>
      <p className="text-sm text-gray-500 -mt-2">
        Cashiers handle Order Confirmed → Order Invoiced. Godown &amp; Delivery staff handle On
        Delivery → Complete.
      </p>
      <StaffManager
        currentUserId={session.user.id}
        staff={staff.map((s) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`,
          email: s.email,
          phone: s.phone,
          role: s.role as StaffRole,
          roleLabel: ROLE_LABELS[s.role as StaffRole],
        }))}
      />
    </div>
  );
}
