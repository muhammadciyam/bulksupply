import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AccountsAdminTable } from "./AccountsAdminTable";

export default async function AdminCustomerAccountsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin/login");

  const accounts = await prisma.businessAccount.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: true },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-brand-navy">Customer Accounts</h1>
      <p className="text-sm text-gray-500 -mt-2">
        Business accounts customers add from My Accounts. New accounts start Pending until you
        approve them.
      </p>
      <AccountsAdminTable
        accounts={accounts.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          location: a.location,
          status: a.status,
          ownerName: `${a.owner.firstName} ${a.owner.lastName}`,
          ownerEmail: a.owner.email,
          ownerPhone: a.owner.phone,
        }))}
      />
    </div>
  );
}
