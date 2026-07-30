"use client";

import { useRef, useState, useTransition } from "react";
import { updateBannerImage, removeBannerImage } from "../actions";

export function BannerImageForm({
  slot,
  title,
  subtitle,
  initialImageUrl,
}: {
  slot: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  initialImageUrl?: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(initialImageUrl ?? null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const url = await updateBannerImage(slot, formData);
        setPreview(url);
        setSuccess(true);
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleRemove() {
    setError("");
    setSuccess(false);
    startTransition(async () => {
      try {
        await removeBannerImage(slot);
        setPreview(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-14 w-24 rounded overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-[9px] text-gray-400 text-center px-1">Default gradient</span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{title}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-2">
        <input
          type="file"
          name="imageFile"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setPreview(URL.createObjectURL(file));
          }}
          className="w-full text-xs"
        />
        <input
          type="url"
          name="imageUrl"
          placeholder="or paste an image URL"
          onChange={(e) => {
            if (e.target.value) setPreview(e.target.value);
          }}
          className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-gray-50 text-xs"
        />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="bg-brand-green hover:bg-brand-green-dark text-white text-xs font-semibold px-4 py-1.5 rounded disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save"}
          </button>
          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={pending}
              className="text-xs text-brand-red font-medium disabled:opacity-60"
            >
              Remove
            </button>
          )}
        </div>
        {error && <p className="text-xs text-brand-red">{error}</p>}
        {success && <p className="text-xs text-brand-green">Saved.</p>}
      </form>
    </div>
  );
}
