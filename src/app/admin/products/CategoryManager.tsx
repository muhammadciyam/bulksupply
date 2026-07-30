"use client";

import { useState, useTransition } from "react";
import { X, Plus } from "lucide-react";
import { createCategory, deleteCategory } from "../actions";

type Category = { id: string; name: string; productCount: number };

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) return;
    const formData = new FormData();
    formData.set("name", trimmed);
    startTransition(async () => {
      try {
        const created = await createCategory(formData);
        setCategories((c) => [...c, { id: created.id, name: created.name, productCount: 0 }]);
        setName("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleRemove(id: string) {
    setError("");
    startTransition(async () => {
      try {
        await deleteCategory(id);
        setCategories((c) => c.filter((cat) => cat.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Categories</h2>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full"
            >
              {c.name}
              <button
                type="button"
                onClick={() => handleRemove(c.id)}
                disabled={pending}
                title={c.productCount > 0 ? `${c.productCount} product(s) use this category` : "Remove category"}
                className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}
      <form onSubmit={handleAdd} className="flex gap-2 max-w-sm">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm bg-gray-50"
        />
        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-1 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold px-3 py-1.5 rounded disabled:opacity-60 shrink-0"
        >
          <Plus size={14} /> Add
        </button>
      </form>
      {error && <p className="text-xs text-brand-red">{error}</p>}
    </div>
  );
}
