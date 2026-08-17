"use client";

import { useState, useTransition } from "react";
import { X, Plus, Pencil, Check } from "lucide-react";
import { createCategory, deleteCategory, updateCategory } from "../actions";
import { isNextNavigationSignal } from "@/lib/is-redirect-error";

type Category = { id: string; name: string; productCount: number; parentId: string | null };

function CategoryChip({
  category,
  pending,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onRemove,
}: {
  category: Category;
  pending: boolean;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (value: string) => void;
  onStartEdit: (category: Category) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemove: (id: string) => void;
}) {
  if (isEditing) {
    return (
      <span className="flex items-center gap-1 bg-gray-100 pl-2 pr-1 py-1 rounded-full">
        <input
          autoFocus
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSaveEdit();
            } else if (e.key === "Escape") {
              onCancelEdit();
            }
          }}
          className="w-32 text-xs bg-white border border-gray-300 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
        <button
          type="button"
          onClick={onSaveEdit}
          disabled={pending}
          title="Save"
          className="h-4 w-4 rounded-full flex items-center justify-center text-brand-green hover:bg-gray-300 disabled:opacity-50"
        >
          <Check size={12} />
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          disabled={pending}
          title="Cancel"
          className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
        >
          <X size={11} />
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium pl-2.5 pr-1.5 py-1 rounded-full">
      {category.name}
      <button
        type="button"
        onClick={() => onStartEdit(category)}
        disabled={pending}
        title="Rename category"
        className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
      >
        <Pencil size={10} />
      </button>
      <button
        type="button"
        onClick={() => onRemove(category.id)}
        disabled={pending}
        title={category.productCount > 0 ? `${category.productCount} product(s) use this category` : "Remove category"}
        className="h-4 w-4 rounded-full flex items-center justify-center hover:bg-gray-300 disabled:opacity-50"
      >
        <X size={11} />
      </button>
    </span>
  );
}

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const topLevel = categories.filter((c) => !c.parentId);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of categories) {
    if (!c.parentId) continue;
    childrenByParent.set(c.parentId, [...(childrenByParent.get(c.parentId) ?? []), c]);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) return;
    const formData = new FormData();
    formData.set("name", trimmed);
    if (parentId) formData.set("parentId", parentId);

    // Optimistic: show the new category right away with a temp id, swap it
    // for the real one on success, drop it again if the save fails.
    const tempId = `pending-${Date.now()}`;
    setCategories((c) => [...c, { id: tempId, name: trimmed, productCount: 0, parentId: parentId || null }]);
    setName("");

    startTransition(async () => {
      try {
        const created = await createCategory(formData);
        setCategories((c) =>
          c.map((cat) =>
            cat.id === tempId
              ? { id: created.id, name: created.name, productCount: 0, parentId: created.parentId }
              : cat
          )
        );
      } catch (err) {
        if (isNextNavigationSignal(err)) throw err;
        setCategories((c) => c.filter((cat) => cat.id !== tempId));
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleStartEdit(category: Category) {
    setError("");
    setEditingId(category.id);
    setEditValue(category.name);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  function handleSaveEdit() {
    const trimmed = editValue.trim();
    const id = editingId;
    if (!id || !trimmed) return;

    const prevCategories = categories;
    // Optimistic: rename immediately, revert if the save fails.
    setCategories((c) => c.map((cat) => (cat.id === id ? { ...cat, name: trimmed } : cat)));
    setEditingId(null);
    setEditValue("");

    const formData = new FormData();
    formData.set("name", trimmed);

    startTransition(async () => {
      try {
        await updateCategory(id, formData);
      } catch (err) {
        if (isNextNavigationSignal(err)) throw err;
        setCategories(prevCategories);
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleRemove(id: string) {
    setError("");
    const prevCategories = categories;
    // Optimistic: hide immediately, restore it if the server call fails
    // (e.g. because products or subcategories still use this category).
    setCategories((c) => c.filter((cat) => cat.id !== id));
    startTransition(async () => {
      try {
        await deleteCategory(id);
      } catch (err) {
        if (isNextNavigationSignal(err)) throw err;
        setCategories(prevCategories);
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <h2 className="text-sm font-semibold text-gray-700">Categories</h2>
      {topLevel.length > 0 && (
        <div className="space-y-2">
          {topLevel.map((c) => {
            const children = childrenByParent.get(c.id) ?? [];
            return (
              <div key={c.id} className="flex flex-wrap items-center gap-2">
                <CategoryChip
                  category={c}
                  pending={pending}
                  isEditing={editingId === c.id}
                  editValue={editValue}
                  onEditValueChange={setEditValue}
                  onStartEdit={handleStartEdit}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                  onRemove={handleRemove}
                />
                {children.length > 0 && (
                  <>
                    <span className="text-gray-300">→</span>
                    {children.map((sub) => (
                      <CategoryChip
                        key={sub.id}
                        category={sub}
                        pending={pending}
                        isEditing={editingId === sub.id}
                        editValue={editValue}
                        onEditValueChange={setEditValue}
                        onStartEdit={handleStartEdit}
                        onSaveEdit={handleSaveEdit}
                        onCancelEdit={handleCancelEdit}
                        onRemove={handleRemove}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
      <form onSubmit={handleAdd} className="flex gap-2 max-w-lg flex-wrap">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          className="flex-1 min-w-[160px] border border-gray-300 rounded px-3 py-1.5 text-sm bg-gray-50"
        />
        <select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          className="border border-gray-300 rounded px-2 py-1.5 text-sm bg-gray-50"
        >
          <option value="">Top-level category</option>
          {topLevel.map((c) => (
            <option key={c.id} value={c.id}>
              Subcategory of {c.name}
            </option>
          ))}
        </select>
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
