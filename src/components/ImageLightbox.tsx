"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.5;

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

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
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const pinchRef = useRef<number | null>(null);
  const draggedRef = useRef(false);

  const resetZoom = useCallback(() => {
    setScale(1);
    setPos({ x: 0, y: 0 });
  }, []);

  const goTo = useCallback(
    (next: number) => {
      setIndex(next);
      resetZoom();
    },
    [resetZoom],
  );

  function zoomBy(delta: number) {
    setScale((s) => {
      const next = clampScale(s + delta);
      if (next === MIN_SCALE) setPos({ x: 0, y: 0 });
      return next;
    });
  }

  function toggleZoom() {
    if (scale > MIN_SCALE) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goTo((index - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") goTo((index + 1) % images.length);
      if (e.key === "+" || e.key === "=") zoomBy(ZOOM_STEP);
      if (e.key === "-" || e.key === "_") zoomBy(-ZOOM_STEP);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [images.length, index, onClose, goTo]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP);
  }

  function onMouseDown(e: React.MouseEvent) {
    if (scale <= MIN_SCALE) return;
    dragRef.current = { x: e.clientX, y: e.clientY };
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.x) / scale;
    const dy = (e.clientY - dragRef.current.y) / scale;
    dragRef.current = { x: e.clientX, y: e.clientY };
    draggedRef.current = true;
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  }

  function endDrag() {
    dragRef.current = null;
  }

  function touchDistance(touches: React.TouchList) {
    const [a, b] = [touches[0], touches[1]];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchRef.current = touchDistance(e.touches);
    } else if (e.touches.length === 1 && scale > MIN_SCALE) {
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current != null) {
      e.preventDefault();
      const dist = touchDistance(e.touches);
      const delta = (dist - pinchRef.current) / 100;
      pinchRef.current = dist;
      zoomBy(delta);
    } else if (e.touches.length === 1 && dragRef.current) {
      const t = e.touches[0];
      const dx = (t.clientX - dragRef.current.x) / scale;
      const dy = (t.clientY - dragRef.current.y) / scale;
      dragRef.current = { x: t.clientX, y: t.clientY };
      draggedRef.current = true;
      setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
    }
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (e.touches.length < 2) pinchRef.current = null;
    if (e.touches.length === 0) dragRef.current = null;
  }

  function onImageClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
      >
        <X size={28} />
      </button>

      <div
        className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-full bg-black/50 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => zoomBy(-ZOOM_STEP)}
          disabled={scale <= MIN_SCALE}
          aria-label="Zoom out"
          className="h-9 w-9 rounded-full text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ZoomOut size={18} />
        </button>
        <span className="min-w-[3rem] text-center text-xs text-white/90 select-none">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => zoomBy(ZOOM_STEP)}
          disabled={scale >= MAX_SCALE}
          aria-label="Zoom in"
          className="h-9 w-9 rounded-full text-white flex items-center justify-center hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      <div
        className="relative w-full max-w-2xl h-[60vh] sm:h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="relative h-full w-full"
          style={{
            transform: `scale(${scale}) translate(${pos.x}px, ${pos.y}px)`,
            transition: dragRef.current ? "none" : "transform 0.15s ease-out",
            cursor: scale > MIN_SCALE ? "grab" : "zoom-in",
          }}
          onDoubleClick={toggleZoom}
          onClick={onImageClick}
        >
          <Image src={images[index]} alt={alt} fill className="object-contain pointer-events-none" sizes="100vw" priority />
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={() => goTo((index - 1 + images.length) % images.length)}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              onClick={() => goTo((index + 1) % images.length)}
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
              onClick={() => goTo(i)}
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
