"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { removeProductImage, addProductImagesToProduct } from "../actions";

type Category = { id: string; name: string };
type UnitRow = { id?: string; label: string; packSize: string; price: string };
type ImageRow = { id: string; imageUrl: string };

type Props = {
  categories: Category[];
  action: (formData: FormData) => void;
  submitLabel: string;
  productId?: string;
  initial?: {
    name: string;
    sku?: string;
    categoryId: string;
    description: string;
    stockStatus: string;
    units: UnitRow[];
    quantityOnHand?: number;
    lowStockThreshold?: number;
    images?: ImageRow[];
  };
  showInventoryFields?: boolean;
  showSku?: boolean;
};

function ProductImages({ initialImages, productId }: { initialImages: ImageRow[]; productId?: string }) {
  // `initialImages` is re-fetched by the server after every save (new images
  // included), so it — not local state — stays the source of truth here.
  // Removals and instant adds (when editing an existing product) need client
  // state too, since they take effect immediately without waiting for the
  // surrounding form to be submitted.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [addedImages, setAddedImages] = useState<ImageRow[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const images = [...initialImages, ...addedImages].filter((img) => !removedIds.has(img.id));

  function handleRemove(id: string) {
    setError("");
    startTransition(async () => {
      try {
        await removeProductImage(id);
        setRemovedIds((ids) => new Set(ids).add(id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleAdd() {
    if (!productId) return;
    setError("");

    const files = fileInputRef.current?.files;
    const url = urlInputRef.current?.value.trim();
    if (!files?.length && !url) {
      setError("Choose a file or paste an image URL first");
      return;
    }

    const formData = new FormData();
    for (const file of Array.from(files ?? [])) formData.append("imageFile", file);
    if (url) formData.append("imageUrl", url);

    startTransition(async () => {
      try {
        const added = await addProductImagesToProduct(productId, formData);
        setAddedImages((prev) => [...prev, ...added]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (urlInputRef.current) urlInputRef.current.value = "";
        setPendingCount(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">Product Images</h3>
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative h-20 w-20 rounded-md overflow-hidden border border-gray-200 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                disabled={busy}
                aria-label="Remove image"
                className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-brand-red disabled:opacity-50"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No images yet.</p>
      )}
      {error && <p className="text-xs text-brand-red">{error}</p>}

      <div className="space-y-2 pt-1">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Add photos from your computer</label>
          <input
            ref={fileInputRef}
            type="file"
            name="imageFile"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setPendingCount(e.target.files?.length ?? 0)}
            className="w-full text-xs"
          />
          {pendingCount > 0 && (
            <p className="text-[11px] text-gray-400 mt-1">
              {pendingCount} file{pendingCount === 1 ? "" : "s"} selected
              {!productId && " — added when you save"}.
            </p>
          )}
        </div>
        <p className="text-[11px] text-gray-400">or paste an image URL below to fetch it automatically</p>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Image URL</label>
          <input
            ref={urlInputRef}
            type="url"
            name="imageUrl"
            placeholder="https://example.com/product.jpg"
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 text-sm"
          />
        </div>

        {productId && (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAdd}
              disabled={busy}
              className="bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold px-4 py-2 rounded disabled:opacity-60"
            >
              {busy ? "Adding..." : "Add"}
            </button>
            <button
              type="submit"
              className="border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded hover:bg-gray-50"
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ProductForm({
  categories,
  action,
  submitLabel,
  productId,
  initial,
  showInventoryFields = false,
  showSku = false,
}: Props) {
  const [units, setUnits] = useState<UnitRow[]>(
    initial?.units?.length ? initial.units : [{ label: "Carton", packSize: "", price: "" }]
  );

  return (
    <form action={action} className="space-y-6 max-w-2xl" encType="multipart/form-data">
      <ProductImages initialImages={initial?.images ?? []} productId={productId} />

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              name="name"
              defaultValue={initial?.name}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
            />
          </div>
          {showSku && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                name="sku"
                defaultValue={initial?.sku}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              name="categoryId"
              defaultValue={initial?.categoryId}
              required
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Badge</label>
            <select
              name="stockStatus"
              defaultValue={initial?.stockStatus ?? "IN_STOCK"}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
            >
              <option value="IN_STOCK">In Stock</option>
              <option value="NEW_STOCK">New Stock</option>
              <option value="LOW_STOCK">Low Stock</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            defaultValue={initial?.description}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Pricing Units</h3>
          <button
            type="button"
            onClick={() => setUnits((u) => [...u, { label: "", packSize: "", price: "" }])}
            className="flex items-center gap-1 text-brand-green text-xs font-semibold"
          >
            <Plus size={14} /> Add Unit
          </button>
        </div>
        {units.map((u, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
            {u.id && <input type="hidden" name="unitId" value={u.id} />}
            <input
              name="unitLabel"
              placeholder="Label e.g. Carton"
              defaultValue={u.label}
              required
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-gray-50"
            />
            <input
              name="unitPackSize"
              placeholder="Pack size e.g. 24 X 200ML"
              defaultValue={u.packSize}
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-gray-50"
            />
            <input
              name="unitPrice"
              type="number"
              step="0.01"
              placeholder="Price"
              defaultValue={u.price}
              required
              className="border border-gray-300 rounded px-2.5 py-1.5 text-sm bg-gray-50"
            />
            <button
              type="button"
              onClick={() => setUnits((prev) => prev.filter((_, idx) => idx !== i))}
              className="text-gray-300 hover:text-brand-red"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {showInventoryFields && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock Quantity</label>
            <input
              name="quantityOnHand"
              type="number"
              defaultValue={initial?.quantityOnHand ?? 0}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
            <input
              name="lowStockThreshold"
              type="number"
              defaultValue={initial?.lowStockThreshold ?? 10}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-6 py-2.5 rounded"
      >
        {submitLabel}
      </button>
    </form>
  );
}
