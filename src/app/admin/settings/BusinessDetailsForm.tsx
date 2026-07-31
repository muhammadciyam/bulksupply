"use client";

import { useState, useTransition } from "react";
import { updateBusinessDetails } from "../actions";
import { isNextNavigationSignal } from "@/lib/is-redirect-error";

type Details = {
  businessName: string;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessGstNo: string | null;
};

export function BusinessDetailsForm({ initial }: { initial: Details }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateBusinessDetails(formData);
        setSuccess(true);
      } catch (e) {
        if (isNextNavigationSignal(e)) throw e;
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  const inputClass = "w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Business Name</label>
          <input name="businessName" required defaultValue={initial.businessName} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            GST / Registration No. <span className="text-gray-400">(optional)</span>
          </label>
          <input name="businessGstNo" defaultValue={initial.businessGstNo ?? ""} className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-500 mb-1">
            Address <span className="text-gray-400">(optional)</span>
          </label>
          <input name="businessAddress" defaultValue={initial.businessAddress ?? ""} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Phone <span className="text-gray-400">(optional)</span>
          </label>
          <input name="businessPhone" defaultValue={initial.businessPhone ?? ""} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Email <span className="text-gray-400">(optional)</span>
          </label>
          <input type="email" name="businessEmail" defaultValue={initial.businessEmail ?? ""} className={inputClass} />
        </div>
      </div>
      {error && <p className="text-sm text-brand-red">{error}</p>}
      {success && <p className="text-sm text-brand-green">Settings saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-5 py-2 rounded text-sm disabled:opacity-60"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
