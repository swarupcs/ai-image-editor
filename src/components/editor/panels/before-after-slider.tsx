"use client";

import { useRef, useState, useCallback } from "react";
import { useEditorStore } from "@/store/useEditorState";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BeforeAfterSlider() {
  const { image, originalImage, toggleBeforeAfter } = useEditorStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPos, setSliderPos] = useState(50); // percentage
  const isDragging = useRef(false);

  const updateSlider = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updateSlider(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updateSlider(e.clientX);
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  if (!image || !originalImage) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-zinc-300">
            Before / After Comparison
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleBeforeAfter}
            className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Slider container */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl border border-zinc-800 select-none cursor-col-resize"
          style={{ aspectRatio: "auto", maxHeight: "calc(90vh - 80px)" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* After (full width) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt="After"
            className="w-full h-full object-contain block"
            draggable={false}
          />

          {/* Before (clipped to left portion) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={originalImage}
              alt="Before"
              className="h-full object-contain block"
              style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: "none" }}
              draggable={false}
            />
          </div>

          {/* Divider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          />

          {/* Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="flex gap-0.5">
              <div className="w-0.5 h-4 bg-zinc-400 rounded-full" />
              <div className="w-0.5 h-4 bg-zinc-400 rounded-full" />
            </div>
          </div>

          {/* Labels */}
          <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded text-xs text-zinc-300 font-medium pointer-events-none">
            Before
          </div>
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 rounded text-xs text-zinc-300 font-medium pointer-events-none">
            After
          </div>
        </div>
      </div>
    </div>
  );
}
