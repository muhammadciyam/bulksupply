"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Package } from "lucide-react";
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
      <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
        {product.images.length > 0 ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`View photos of ${product.name}`}
            className="absolute inset-0 cursor-zoom-in"
          >
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
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
      <div className="p-2.5 flex flex-col grow gap-1.5">
        <p className="text-[11px] font-medium text-gray-800 leading-tight line-clamp-2 uppercase min-h-[2rem]">
          {product.name}
          <span className="text-gray-400 normal-case"> | {product.sku}</span>
        </p>
        <div className="flex items-baseline justify-end gap-1">
          <span className="text-[10px] text-gray-400">MVR</span>
          <span className="text-lg font-bold text-brand-green">{formatMVR(unit.price)}</span>
        </div>
        {product.units.length > 1 ? (
          <select
            value={unitIndex}
            onChange={(e) => setUnitIndex(Number(e.target.value))}
            className="text-[11px] border border-gray-200 rounded px-1.5 py-1 text-gray-600"
          >
            {product.units.map((u, i) => (
              <option key={u.label} value={i}>
                {u.label} · {u.packSize}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-[11px] text-gray-500">
            <div>{unit.label}</div>
            <div className="text-gray-400">{unit.packSize}</div>
          </div>
        )}
        <button
          onClick={handleAdd}
          className={`mt-1 self-end flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded transition-colors ${
            added ? "text-brand-green" : "text-gray-700 hover:text-brand-green"
          }`}
        >
          {added ? "Added" : "Add"}
          <ShoppingCart size={15} />
        </button>
      </div>
    </div>
  );
}
