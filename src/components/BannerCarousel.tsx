"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "New Season Deals",
    subtitle: "Stock up early and save on bulk orders",
    from: "from-emerald-600",
    to: "to-emerald-800",
  },
  {
    title: "Fresh Stock Arrivals",
    subtitle: "Dairy, beverages & household essentials",
    from: "from-sky-600",
    to: "to-sky-800",
  },
  {
    title: "Personal Care Restock",
    subtitle: "Wipes, diapers & toiletries now available",
    from: "from-rose-600",
    to: "to-rose-800",
  },
  {
    title: "Pantry & Grocery",
    subtitle: "Canned foods, sauces and cooking essentials",
    from: "from-amber-600",
    to: "to-amber-800",
  },
];

export function BannerCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {slides.map((s, i) => (
        <div
          key={s.title}
          className={`relative h-32 md:h-44 rounded-lg overflow-hidden bg-gradient-to-br ${s.from} ${s.to} text-white p-4 flex flex-col justify-end transition-transform ${
            i === index ? "ring-2 ring-brand-green" : ""
          }`}
        >
          <p className="text-sm md:text-base font-bold leading-tight">{s.title}</p>
          <p className="text-xs md:text-sm opacity-90 leading-tight">{s.subtitle}</p>
        </div>
      ))}
      <div className="col-span-2 md:col-span-4 flex justify-center gap-1 -mt-1">
        <button
          aria-label="Previous"
          onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)}
          className="p-1 text-gray-400 hover:text-brand-green"
        >
          <ChevronLeft size={16} />
        </button>
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-brand-green" : "bg-gray-300"}`}
          />
        ))}
        <button
          aria-label="Next"
          onClick={() => setIndex((i) => (i + 1) % slides.length)}
          className="p-1 text-gray-400 hover:text-brand-green"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
