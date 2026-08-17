"use client";

import { useRef, useState, useTransition } from "react";
import { addBannerImage, removeBannerImage } from "../actions";
import { isNextNavigationSignal } from "@/lib/is-redirect-error";
import { FileChooserInput } from "@/components/FileChooserInput";

type BannerImg = { id: string; imageUrl: string };
type PendingImg = { tempId: string; previewUrl: string };

export function BannerImageForm({
  slot,
  title,
  subtitle,
  initialImages,
}: {
  slot: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  initialImages: BannerImg[];
}) {
  const [images, setImages] = useState<BannerImg[]>(initialImages);
  const [pendingImages, setPendingImages] = useState<PendingImg[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [fileChooserKey, setFileChooserKey] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    const file = formData.get("imageFile");
    const url = String(formData.get("imageUrl") ?? "").trim();
    const previewUrl = file instanceof File && file.size > 0 ? URL.createObjectURL(file) : url;
    const tempId = `pending-${Date.now()}`;

    if (previewUrl) setPendingImages((imgs) => [...imgs, { tempId, previewUrl }]);
    formRef.current?.reset();
    setFileChooserKey((k) => k + 1);

    startTransition(async () => {
      try {
        const created = await addBannerImage(slot, formData);
        setImages((imgs) => [...imgs, created]);
      } catch (err) {
        if (isNextNavigationSignal(err)) throw err;
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setPendingImages((imgs) => imgs.filter((i) => i.tempId !== tempId));
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
    });
  }

  function handleRemove(imageId: string) {
    setError("");
    const prevImages = images;
    // Optimistic: hide immediately, restore it if the server call fails.
    setImages((imgs) => imgs.filter((i) => i.id !== imageId));
    startTransition(async () => {
      try {
        await removeBannerImage(imageId);
      } catch (err) {
        if (isNextNavigationSignal(err)) throw err;
        setImages(prevImages);
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-xs text-gray-400">{subtitle}</p>
      </div>

      {images.length > 0 || pendingImages.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative h-16 w-24 rounded overflow-hidden border border-gray-200 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imageUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                disabled={pending}
                aria-label="Remove image"
                className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-black/60 text-white text-xs leading-none flex items-center justify-center hover:bg-brand-red disabled:opacity-60"
              >
                ×
              </button>
            </div>
          ))}
          {pendingImages.map((p) => (
            <div key={p.tempId} className="relative h-16 w-24 rounded overflow-hidden border border-gray-200 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.previewUrl} alt="" className="h-full w-full object-cover opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No images yet — showing the default gradient.</p>
      )}
      {images.length > 1 && (
        <p className="text-[11px] text-gray-400">
          Multiple images: this banner will automatically cycle through all {images.length} of them.
        </p>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
        <FileChooserInput key={fileChooserKey} name="imageFile" accept="image/jpeg,image/png,image/webp" />
        <input
          type="url"
          name="imageUrl"
          placeholder="or paste an image URL"
          className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-gray-50 text-xs"
        />
        <button
          type="submit"
          disabled={pending}
          className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold px-4 py-1.5 rounded disabled:opacity-60"
        >
          {pending ? "Adding..." : "Add Image"}
        </button>
        {error && <p className="text-xs text-brand-red">{error}</p>}
      </form>
    </div>
  );
}
