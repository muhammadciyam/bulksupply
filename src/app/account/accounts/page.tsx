import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AccountHeader } from "@/components/AccountHeader";
import { AccountsList } from "./AccountsList";

export default async function AccountsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const accounts = await prisma.businessAccount.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16 md:pb-0">
      <AccountHeader />
      <main className="max-w-5xl mx-auto w-full px-4 py-8 flex-1">
        <AccountsList
          initialAccounts={accounts.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            location: a.location,
            status: a.status,
          }))}
        />
      </main>
    </div>
  );
}
