import type { ReactNode } from "react";
import { auth } from "@/auth";
import { isStaffRole } from "@/lib/roles";
import { AdminShell } from "./AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session?.user || !isStaffRole(session.user.role)) {
    return <>{children}</>;
  }

  return (
    <AdminShell userName={session.user.name ?? "Staff"} role={session.user.role}>
      {children}
    </AdminShell>
  );
}
