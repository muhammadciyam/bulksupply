"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

type UserData = { firstName: string; lastName: string; email: string; phone: string };

export function ProfileForm({ user }: { user: UserData }) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (form.newPassword && form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        currentPassword: form.currentPassword || undefined,
        newPassword: form.newPassword || undefined,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }
    setMessage("Profile updated successfully");
    setForm((f) => ({ ...f, currentPassword: "", newPassword: "", confirmPassword: "" }));
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    const res = await fetch("/api/me", { method: "DELETE" });
    if (res.ok) {
      signOut({ callbackUrl: "/" });
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="First Name" value={form.firstName} onChange={(v) => update("firstName", v)} />
        <Field label="Last Name" value={form.lastName} onChange={(v) => update("lastName", v)} />
        <Field label="Email" value={form.email} onChange={(v) => update("email", v)} type="email" />
        <Field label="Contact Number" value={form.phone} onChange={(v) => update("phone", v)} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={form.currentPassword}
              onChange={(e) => update("currentPassword", e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={form.newPassword}
              onChange={(e) => update("newPassword", e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
          <input
            type={showNew ? "text" : "password"}
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
          />
        </div>
        {error && <p className="sm:col-span-2 text-sm text-brand-red">{error}</p>}
        {message && <p className="sm:col-span-2 text-sm text-brand-green">{message}</p>}
        <div className="sm:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-6 py-2 rounded disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="bg-gray-100 rounded-md py-3 text-center">
        <button type="button" onClick={handleDelete} className="text-sm text-brand-red underline">
          Click here to Delete My Account
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
      />
    </div>
  );
}
