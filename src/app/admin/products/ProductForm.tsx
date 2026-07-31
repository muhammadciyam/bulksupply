"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Trash2, X, Image as ImageIcon, Info, Tag, Boxes } from "lucide-react";
import { removeProductImage, addProductImagesToProduct } from "../actions";
import { isNextNavigationSignal } from "@/lib/is-redirect-error";
import { SubmitButton } from "@/components/SubmitButton";

const inputClass =
  "w-full border border-gray-300 rounded px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green";

type Category = { id: string; name: string; parentId: string | null };
type UnitRow = {
  id?: string;
  label: string;
  packSize: string;
  price: string;
  priceExGst?: string;
  gstApplicable?: boolean;
  costPrice?: string;
  costPriceIncGst?: string;
};

function emptyUnit(): UnitRow {
  return {
    label: "",
    packSize: "",
    price: "",
    priceExGst: "",
    gstApplicable: false,
    costPrice: "",
    costPriceIncGst: "",
  };
}

// Derives the GST-inclusive amount from an excl.-GST amount + the shop-wide
// GST percentage (set in Settings). A 0% rate is a valid rate (not "unset"),
// so this still computes (incl. = excl. when the rate is 0) — it only
// bails out when there's no excl.-GST amount to work from yet.
function calcIncGst(exGst: string, gstPercent: number): string {
  const ex = Number(exGst);
  if (!ex) return "";
  return (ex * (1 + gstPercent / 100)).toFixed(2);
}

type ImageRow = { id: string; imageUrl: string };
type PendingImage = { tempId: string; previewUrl: string };

type Props = {
  categories: Category[];
  action: (formData: FormData) => void;
  submitLabel: string;
  productId?: string;
  gstPercent: number;
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
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const images = [...initialImages, ...addedImages].filter((img) => !removedIds.has(img.id));

  function handleRemove(id: string) {
    setError("");
    // Optimistic: hide immediately, restore it if the server call fails.
    setRemovedIds((ids) => new Set(ids).add(id));
    startTransition(async () => {
      try {
        await removeProductImage(id);
      } catch (err) {
        if (isNextNavigationSignal(err)) throw err;
        setRemovedIds((ids) => {
          const next = new Set(ids);
          next.delete(id);
          return next;
        });
        setError(err instanceof Error ? err.message : "Could not remove that image");
      }
    });
  }

  function handleAdd() {
    if (!productId) return;
    setError("");

    const files = Array.from(fileInputRef.current?.files ?? []);
    const url = urlInputRef.current?.value.trim();
    if (!files.length && !url) {
      setError("Choose a file or paste an image URL first");
      return;
    }

    const formData = new FormData();
    for (const file of files) formData.append("imageFile", file);
    if (url) formData.append("imageUrl", url);

    // Optimistic: show a preview tile immediately (local blob preview for
    // files, the pasted URL itself for the URL case), swapped for the real
    // stored image — or removed — once the server responds.
    const staged: PendingImage[] = [
      ...files.map((f, i) => ({ tempId: `pending-${Date.now()}-${i}`, previewUrl: URL.createObjectURL(f) })),
      ...(url ? [{ tempId: `pending-${Date.now()}-url`, previewUrl: url }] : []),
    ];
    setPendingImages((prev) => [...prev, ...staged]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (urlInputRef.current) urlInputRef.current.value = "";
    setPendingCount(0);

    startTransition(async () => {
      try {
        const added = await addProductImagesToProduct(productId, formData);
        setAddedImages((prev) => [...prev, ...added]);
      } catch (err) {
        if (isNextNavigationSignal(err)) throw err;
        setError(err instanceof Error ? err.message : "Could not add that image");
      } finally {
        setPendingImages((prev) => prev.filter((p) => !staged.some((s) => s.tempId === p.tempId)));
        for (const s of staged) URL.revokeObjectURL(s.previewUrl);
      }
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
      <div className="flex items-center gap-2 text-brand-navy">
        <ImageIcon size={16} />
        <h3 className="text-sm font-semibold">Product Images</h3>
      </div>
      {images.length > 0 || pendingImages.length > 0 ? (
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
          {pendingImages.map((p) => (
            <div key={p.tempId} className="relative h-20 w-20 rounded-md overflow-hidden border border-gray-200 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt="" className="h-full w-full object-cover opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
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
            <SubmitButton
              pendingLabel="Saving..."
              className="border border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded hover:bg-gray-50 disabled:opacity-60"
            >
              Save
            </SubmitButton>
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
  gstPercent,
  initial,
  showInventoryFields = false,
  showSku = false,
}: Props) {
  const [units, setUnits] = useState<UnitRow[]>(
    initial?.units?.length ? initial.units : [{ ...emptyUnit(), label: "Carton" }]
  );

  function updateUnit(i: number, patch: Partial<UnitRow>) {
    setUnits((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  // Ticking GST on needs to immediately compute the incl.-GST fields from
  // whatever excl.-GST values are already there (e.g. Cost Price, typed
  // before GST was ticked) — otherwise those fields are stuck blank, since
  // they're locked/read-only and can't be typed into directly.
  function handleGstToggle(i: number, checked: boolean) {
    setUnits((prev) =>
      prev.map((row, idx) => {
        if (idx !== i) return row;
        if (!checked) return { ...row, gstApplicable: false };
        const next = { ...row, gstApplicable: true };
        const nextCostIncGst = calcIncGst(row.costPrice ?? "", gstPercent);
        const nextPrice = calcIncGst(row.priceExGst ?? "", gstPercent);
        if (nextCostIncGst) next.costPriceIncGst = nextCostIncGst;
        if (nextPrice) next.price = nextPrice;
        return next;
      })
    );
  }

  function handlePriceExGstChange(i: number, value: string) {
    setUnits((prev) =>
      prev.map((row, idx) => {
        if (idx !== i) return row;
        const next = { ...row, priceExGst: value };
        const nextPrice = calcIncGst(value, gstPercent);
        if (nextPrice) next.price = nextPrice;
        return next;
      })
    );
  }

  function handleCostExGstChange(i: number, value: string) {
    setUnits((prev) =>
      prev.map((row, idx) => {
        if (idx !== i) return row;
        const next = { ...row, costPrice: value };
        const nextCostIncGst = calcIncGst(value, gstPercent);
        if (nextCostIncGst) next.costPriceIncGst = nextCostIncGst;
        return next;
      })
    );
  }

  return (
    <form action={action} className="space-y-6 max-w-4xl" encType="multipart/form-data">
      <ProductImages initialImages={initial?.images ?? []} productId={productId} />

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-2 text-brand-navy">
          <Info size={16} />
          <h3 className="text-sm font-semibold">Basic Information</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input name="name" defaultValue={initial?.name} required className={inputClass} />
          </div>
          {showSku && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input name="sku" defaultValue={initial?.sku} required className={inputClass} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="categoryId" defaultValue={initial?.categoryId} required className={inputClass}>
              {categories
                .filter((c) => !c.parentId)
                .flatMap((c) => [
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>,
                  ...categories
                    .filter((sub) => sub.parentId === c.id)
                    .map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {"    "}
                        {sub.name}
                      </option>
                    )),
                ])}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Badge</label>
            <select
              name="stockStatus"
              defaultValue={initial?.stockStatus ?? "IN_STOCK"}
              className={inputClass}
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
          <textarea name="description" defaultValue={initial?.description} rows={3} className={inputClass} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-navy">
            <Tag size={16} />
            <h3 className="text-sm font-semibold">Pricing Units</h3>
          </div>
          <button
            type="button"
            onClick={() => setUnits((u) => [...u, emptyUnit()])}
            className="flex items-center gap-1 text-brand-green text-xs font-semibold hover:text-brand-green-dark"
          >
            <Plus size={14} /> Add Unit
          </button>
        </div>
        <p className="text-[11px] text-gray-400 -mt-1">
          GST rate is {gstPercent}%, set shop-wide in{" "}
          <a href="/admin/settings" className="text-brand-green hover:underline">
            Settings
          </a>
          .
        </p>
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm min-w-[880px] border-collapse">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                <th className="font-normal pb-2 pr-2">Label</th>
                <th className="font-normal pb-2 pr-2">Pack Size</th>
                <th className="font-normal pb-2 pr-2 w-16 text-center">GST</th>
                <th className="font-normal pb-2 pr-2 w-36">Cost Price</th>
                <th className="font-normal pb-2 pr-2 w-36">Selling Price</th>
                <th className="font-normal pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {units.map((u, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-2 pr-2 align-top">
                    {u.id && <input type="hidden" name="unitId" value={u.id} />}
                    <input
                      name="unitLabel"
                      placeholder="e.g. Carton"
                      defaultValue={u.label}
                      required
                      className={inputClass}
                    />
                  </td>
                  <td className="py-2 pr-2 align-top">
                    <input
                      name="unitPackSize"
                      placeholder="e.g. 24 X 200ML"
                      defaultValue={u.packSize}
                      className={inputClass}
                    />
                  </td>
                  <td className="py-2 pr-2 align-top text-center pt-4">
                    <div className="flex flex-col items-center gap-1">
                      <input
                        type="checkbox"
                        name={`unitGstApplicable_${i}`}
                        checked={u.gstApplicable ?? false}
                        onChange={(e) => handleGstToggle(i, e.target.checked)}
                        className="h-4 w-4 accent-brand-green"
                      />
                      {u.gstApplicable && (
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{gstPercent}%</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-2 align-top">
                    {u.gstApplicable ? (
                      <div className="space-y-1">
                        <input
                          name="unitCostPrice"
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="Excl. GST"
                          value={u.costPrice ?? ""}
                          onChange={(e) => handleCostExGstChange(i, e.target.value)}
                          className={inputClass}
                        />
                        <input
                          name={`unitCostPriceIncGst_${i}`}
                          type="number"
                          step="0.01"
                          min={0}
                          readOnly
                          title="Computed from Cost Price (excl. GST) and the GST rate in Settings"
                          placeholder="Incl. GST"
                          value={u.costPriceIncGst ?? ""}
                          className={`${inputClass} bg-gray-100 text-gray-600 cursor-not-allowed`}
                        />
                      </div>
                    ) : (
                      <input
                        name="unitCostPrice"
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        value={u.costPrice ?? ""}
                        onChange={(e) => updateUnit(i, { costPrice: e.target.value })}
                        className={inputClass}
                      />
                    )}
                  </td>
                  <td className="py-2 pr-2 align-top">
                    {u.gstApplicable ? (
                      <div className="space-y-1">
                        <input
                          name={`unitPriceExGst_${i}`}
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="Excl. GST"
                          value={u.priceExGst ?? ""}
                          onChange={(e) => handlePriceExGstChange(i, e.target.value)}
                          className={inputClass}
                        />
                        <input
                          name="unitPrice"
                          type="number"
                          step="0.01"
                          min={0}
                          placeholder="Incl. GST"
                          value={u.price}
                          onChange={(e) => updateUnit(i, { price: e.target.value })}
                          required
                          className={inputClass}
                        />
                      </div>
                    ) : (
                      <input
                        name="unitPrice"
                        type="number"
                        step="0.01"
                        min={0}
                        placeholder="0.00"
                        value={u.price}
                        onChange={(e) => updateUnit(i, { price: e.target.value })}
                        required
                        className={inputClass}
                      />
                    )}
                  </td>
                  <td className="py-2 pt-4 align-top text-right">
                    <button
                      type="button"
                      onClick={() => setUnits((prev) => prev.filter((_, idx) => idx !== i))}
                      disabled={units.length === 1}
                      title="Remove unit"
                      className="text-gray-300 hover:text-brand-red disabled:opacity-30 disabled:hover:text-gray-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInventoryFields && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 text-brand-navy">
            <Boxes size={16} />
            <h3 className="text-sm font-semibold">Inventory</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Opening Stock Quantity</label>
            <input
              name="quantityOnHand"
              type="number"
              defaultValue={initial?.quantityOnHand ?? 0}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
            <input
              name="lowStockThreshold"
              type="number"
              defaultValue={initial?.lowStockThreshold ?? 10}
              className={inputClass}
            />
          </div>
          </div>
        </div>
      )}

      <SubmitButton
        pendingLabel="Saving..."
        className="bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-6 py-2.5 rounded disabled:opacity-60"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
