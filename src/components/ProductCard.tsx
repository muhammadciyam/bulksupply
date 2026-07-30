"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Check, Package } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { formatMVR, STOCK_BADGE } from "@/lib/format";
import { ImageLightbox } from "./ImageLightbox";

export type ProductCardData = {
  id: string;
  name: string;
  sku: string;
  stockStatus: string;
  images: string[];
  units: { label: string; packSize: string; price: number }[];
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const [unitIndex, setUnitIndex] = useState(0);
  const addLine = useCartStore((s) => s.addLine);
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const unit = product.units[unitIndex] ?? product.units[0];
  const badge = STOCK_BADGE[product.stockStatus];

  if (!unit) return null;

  function handleAdd() {
    addLine({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      unitLabel: unit.label,
      packSize: unit.packSize,
      price: unit.price,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md flex flex-col overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-[4/5] bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.images.length > 0 ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`View photos of ${product.name}`}
            className="absolute inset-0 cursor-zoom-in outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-green"
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover scale-110 transition-transform duration-300 hover:scale-125"
              sizes="(max-width: 640px) 50vw, 20vw"
            />
          </button>
        ) : (
          <Package className="text-gray-300" size={48} strokeWidth={1.2} />
        )}
        {badge?.label && (
          <span
            className={`absolute top-0 left-0 text-[10px] font-bold px-2 py-1 ${badge.className}`}
          >
            {badge.label}
          </span>
        )}
      </div>
      {lightboxOpen && (
        <ImageLightbox images={product.images} alt={product.name} onClose={() => setLightboxOpen(false)} />
      )}
      <div className="p-2 flex flex-col grow gap-1">
        <div>
          <p className="text-[11px] font-semibold text-gray-800 leading-snug line-clamp-2 uppercase tracking-tight">
            {product.name}
          </p>
          <p className="text-[10px] text-gray-400">{product.sku}</p>
        </div>

        {product.units.length > 1 ? (
          <select
            value={unitIndex}
            onChange={(e) => setUnitIndex(Number(e.target.value))}
            className="text-[11px] border border-gray-200 rounded-full px-2 py-0.5 text-gray-600 bg-gray-50 w-fit max-w-full"
          >
            {product.units.map((u, i) => (
              <option key={u.label} value={i}>
                {u.label} · {u.packSize}
              </option>
            ))}
          </select>
        ) : (
          <span className="text-[10px] text-gray-500 bg-gray-100 rounded-full px-2 py-0.5 w-fit">
            {unit.label} · {unit.packSize}
          </span>
        )}

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] text-gray-400">MVR</span>
            <span className="text-base font-bold text-brand-green">{formatMVR(unit.price)}</span>
          </div>
          <button
            onClick={handleAdd}
            aria-label={added ? "Added to cart" : "Add to cart"}
            className={`flex items-center justify-center h-8 w-8 rounded-full transition-colors shrink-0 outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green ${
              added ? "bg-brand-green/15 text-brand-green" : "bg-brand-green text-white hover:bg-brand-green-dark"
            }`}
          >
            {added ? <Check size={15} /> : <ShoppingCart size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
