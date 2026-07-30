import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "./SettingsForm";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") redirect("/admin/login");

  const settings = await prisma.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-bold text-brand-navy">Settings</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Payment Deadline</h2>
        <p className="text-xs text-gray-500 mb-4">
          Orders left in &quot;Payment Processing&quot; with no payment slip uploaded are
          automatically cancelled after this many days.
        </p>
        <SettingsForm initialDays={settings.paymentDeadlineDays} />
      </div>
    </div>
  );
}
