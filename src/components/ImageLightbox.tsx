"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function ImageLightbox({
  images,
  initialIndex = 0,
  alt,
  onClose,
}: {
  images: string[];
  initialIndex?: number;
  alt: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 text-white/80 hover:text-white"
      >
        <X size={28} />
      </button>

      <div
        className="relative w-full max-w-2xl h-[60vh] sm:h-[70vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image src={images[index]} alt={alt} fill className="object-contain" sizes="100vw" priority />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % images.length)}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-[90vw] overflow-x-auto px-2"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={img}
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative h-12 w-12 rounded overflow-hidden border-2 shrink-0 ${
                i === index ? "border-brand-green" : "border-transparent opacity-60"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="48px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
