"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BANNER_SLIDES } from "@/lib/banners";

// Each tile plays its own distinct animation while it's the active slide.
const ANIMATIONS = ["banner-anim-fade", "banner-anim-slide-up", "banner-anim-zoom", "banner-anim-slide-side"];

function BannerTile({
  slide,
  images,
  active,
  animation,
}: {
  slide: (typeof BANNER_SLIDES)[number];
  images: string[];
  active: boolean;
  animation: string;
}) {
  const [imgIndex, setImgIndex] = useState(0);

  // If this banner has multiple images, cycle through them on its own timer,
  // independent of which tile is currently "active" in the outer rotation.
  useEffect(() => {
    if (images.length < 2) return;
    const id = setInterval(() => {
      setImgIndex((i) => (i + 1) % images.length);
    }, 3000);
    return () => clearInterval(id);
  }, [images.length]);

  const image = images[imgIndex % (images.length || 1)];

  return (
    <div
      className={`relative h-32 md:h-44 rounded-lg overflow-hidden text-white p-4 flex flex-col justify-end transition-transform ${
        image ? "bg-gray-800" : `bg-gradient-to-br ${slide.from} ${slide.to}`
      } ${active ? `ring-2 ring-brand-green ${animation}` : ""}`}
    >
      {image && (
        <>
          <Image
            key={image}
            src={image}
            alt=""
            fill
            className="object-cover banner-anim-fade"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        </>
      )}
      <p className="relative text-sm md:text-base font-bold leading-tight">{slide.title}</p>
      <p className="relative text-xs md:text-sm opacity-90 leading-tight">{slide.subtitle}</p>
    </div>
  );
}

export function BannerCarousel({ imagesBySlot = [] }: { imagesBySlot?: string[][] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % BANNER_SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {BANNER_SLIDES.map((s, i) => (
        <BannerTile
          key={s.slot}
          slide={s}
          images={imagesBySlot[i] ?? []}
          active={i === index}
          animation={ANIMATIONS[i]}
        />
      ))}
      <div className="col-span-2 md:col-span-4 flex justify-center gap-1 -mt-1">
        <button
          aria-label="Previous"
          onClick={() => setIndex((i) => (i - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length)}
          className="p-1 text-gray-400 hover:text-brand-green"
        >
          <ChevronLeft size={16} />
        </button>
        {BANNER_SLIDES.map((s, i) => (
          <span
            key={s.slot}
            className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-brand-green" : "bg-gray-300"}`}
          />
        ))}
        <button
          aria-label="Next"
          onClick={() => setIndex((i) => (i + 1) % BANNER_SLIDES.length)}
          className="p-1 text-gray-400 hover:text-brand-green"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
