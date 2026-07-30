"use client";

import { useRef, useState, useTransition } from "react";
import { addBannerImage, removeBannerImage } from "../actions";

type BannerImg = { id: string; imageUrl: string };

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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const created = await addBannerImage(slot, formData);
        setImages((imgs) => [...imgs, created]);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleRemove(imageId: string) {
    setError("");
    startTransition(async () => {
      try {
        await removeBannerImage(imageId);
        setImages((imgs) => imgs.filter((i) => i.id !== imageId));
      } catch (err) {
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

      {images.length > 0 ? (
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
        <input
          type="file"
          name="imageFile"
          accept="image/jpeg,image/png,image/webp"
          className="w-full text-xs"
        />
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
