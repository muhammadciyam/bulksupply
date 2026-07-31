"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

type Account = { id: string; name: string; type: string; location: string; status: string };

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "text-brand-green border-brand-green",
  PENDING: "text-amber-600 border-amber-500",
  CLOSED: "text-gray-400 border-gray-300",
};

export function AccountsList({ initialAccounts }: { initialAccounts: Account[] }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-brand-navy">My Accounts</h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1 text-brand-green text-sm font-semibold"
        >
          <Plus size={16} /> Add Account
        </button>
      </div>
      {error && <p className="text-sm text-brand-red mb-3">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((a) => (
          <div key={a.id} className="bg-gray-50 rounded-md p-4">
            <p className="font-semibold text-brand-navy">{a.name}</p>
            <span className="inline-block bg-gray-200 text-gray-600 text-[10px] font-medium px-2 py-0.5 rounded mt-1 uppercase">
              {a.type}
            </span>
            <p className="text-sm text-gray-500 mt-1">{a.location}</p>
            <span
              className={`inline-block border rounded px-2 py-0.5 text-[10px] mt-3 lowercase ${STATUS_STYLE[a.status] ?? ""}`}
            >
              {a.status.toLowerCase()}
            </span>
          </div>
        ))}
      </div>
      {open && (
        <AddAccountModal
          onClose={() => setOpen(false)}
          onCreated={(a) => setAccounts((prev) => [...prev, a])}
          onReplace={(tempId, a) =>
            setAccounts((prev) => prev.map((acc) => (acc.id === tempId ? a : acc)))
          }
          onRollback={(tempId, message) => {
            setAccounts((prev) => prev.filter((acc) => acc.id !== tempId));
            setError(message);
          }}
        />
      )}
    </div>
  );
}

function AddAccountModal({
  onClose,
  onCreated,
  onReplace,
  onRollback,
}: {
  onClose: () => void;
  onCreated: (a: Account) => void;
  onReplace: (tempId: string, a: Account) => void;
  onRollback: (tempId: string, message: string) => void;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    // Optimistic: add it (and close the modal) immediately with the known
    // server-side defaults, swap in the real record once the request
    // resolves, or roll it back (with an error shown on the accounts list,
    // since this modal will already be closed) if the request fails.
    const tempId = `pending-${Date.now()}`;
    onCreated({ id: tempId, name, type: "BUSINESS", location, status: "PENDING" });
    onClose();

    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location }),
    });
    const data = await res.json();
    if (!res.ok) {
      onRollback(tempId, data.error ?? "Something went wrong adding that account");
      return;
    }
    onReplace(tempId, {
      id: data.account.id,
      name: data.account.name,
      type: data.account.type,
      location: data.account.location,
      status: data.account.status,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm relative p-6">
        <button onClick={onClose} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
        <h2 className="font-bold text-brand-navy mb-4">Add Business Account</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            placeholder="Business Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
          />
          <input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold py-2 rounded disabled:opacity-60"
          >
            {saving ? "Adding..." : "Add Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
