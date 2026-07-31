"use client";

import { useRef, useState, useTransition } from "react";
import { changeOwnPassword } from "../actions";
import { isNextNavigationSignal } from "@/lib/is-redirect-error";

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    setError("");
    setSuccess(false);
    const currentPassword = String(formData.get("currentPassword") ?? "");
    const newPassword = String(formData.get("newPassword") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    startTransition(async () => {
      try {
        await changeOwnPassword(currentPassword, newPassword);
        formRef.current?.reset();
        setSuccess(true);
      } catch (e) {
        if (isNextNavigationSignal(e)) throw e;
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      <input
        name="currentPassword"
        type="password"
        placeholder="Current Password"
        required
        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
      />
      <input
        name="newPassword"
        type="password"
        placeholder="New Password"
        required
        minLength={6}
        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
      />
      <input
        name="confirmPassword"
        type="password"
        placeholder="Confirm New Password"
        required
        minLength={6}
        className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
      />
      {error && <p className="text-sm text-brand-red">{error}</p>}
      {success && <p className="text-sm text-brand-green">Password updated.</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-5 py-2 rounded text-sm disabled:opacity-60"
      >
        {pending ? "Saving..." : "Update Password"}
      </button>
    </form>
  );
}
