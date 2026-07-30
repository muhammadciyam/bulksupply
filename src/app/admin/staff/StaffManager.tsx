"use client";

import { useRef, useState, useTransition } from "react";
import { Trash2, UserPlus, RotateCcw } from "lucide-react";
import { createStaffUser, deactivateStaffUser, reactivateStaffUser } from "../actions";
import type { StaffRole } from "@/lib/roles";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: StaffRole;
  roleLabel: string;
  isActive: boolean;
};

const ROLE_BADGE: Record<StaffRole, string> = {
  ADMIN: "bg-brand-navy text-white",
  CASHIER: "bg-sky-100 text-sky-700",
  DELIVERY: "bg-amber-100 text-amber-700",
};

export function StaffManager({
  staff,
  currentUserId,
}: {
  staff: StaffMember[];
  currentUserId: string;
}) {
  const [members, setMembers] = useState(staff);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function handleCreate(formData: FormData) {
    setError("");
    startTransition(async () => {
      try {
        await createStaffUser(formData);
        formRef.current?.reset();
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  function handleDeactivate(id: string) {
    if (!confirm("Deactivate this staff member's access? They can be reactivated later.")) return;
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, isActive: false } : m)));
    startTransition(async () => {
      await deactivateStaffUser(id);
    });
  }

  function handleReactivate(id: string) {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, isActive: true } : m)));
    startTransition(async () => {
      await reactivateStaffUser(id);
    });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
              <th className="font-normal px-4 py-3">Name</th>
              <th className="font-normal px-4 py-3">Contact</th>
              <th className="font-normal px-4 py-3">Role</th>
              <th className="font-normal px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className={`border-b border-gray-50 ${m.isActive ? "" : "opacity-50"}`}>
                <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {m.email}
                  <br />
                  {m.phone}
                </td>
                <td className="px-4 py-3 space-x-1.5">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${ROLE_BADGE[m.role]}`}>
                    {m.roleLabel}
                  </span>
                  {!m.isActive && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-500">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {m.id !== currentUserId &&
                    (m.isActive ? (
                      <button
                        onClick={() => handleDeactivate(m.id)}
                        disabled={pending}
                        className="text-gray-300 hover:text-brand-red"
                        title="Deactivate"
                      >
                        <Trash2 size={15} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(m.id)}
                        disabled={pending}
                        className="text-gray-400 hover:text-brand-green"
                        title="Reactivate"
                      >
                        <RotateCcw size={15} />
                      </button>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        ref={formRef}
        action={handleCreate}
        className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
      >
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <UserPlus size={16} /> Add Staff Member
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            name="firstName"
            placeholder="First Name"
            required
            className="border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
          />
          <input
            name="lastName"
            placeholder="Last Name"
            required
            className="border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
          />
          <input
            name="phone"
            placeholder="Contact Number"
            required
            className="border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder="Temporary Password"
            required
            className="border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
          />
          <select
            name="role"
            defaultValue="CASHIER"
            className="border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
          >
            <option value="CASHIER">Cashier</option>
            <option value="DELIVERY">Godown / Delivery Staff</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {error && <p className="text-sm text-brand-red">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-5 py-2 rounded text-sm disabled:opacity-60"
        >
          {pending ? "Adding..." : "Add Staff Member"}
        </button>
      </form>
    </div>
  );
}
