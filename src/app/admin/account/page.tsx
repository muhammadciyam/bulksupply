import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/roles";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function AdminAccountPage() {
  const session = await auth();
  if (!session?.user || !isStaffRole(session.user.role)) redirect("/admin/login");

  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-xl font-bold text-brand-navy">My Account</h1>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <p className="text-sm text-gray-600 mb-1">{session.user.name}</p>
        <p className="text-xs text-gray-400 mb-4">{session.user.email}</p>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Change Password</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
