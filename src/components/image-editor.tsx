"use client";

import { ToolType } from "@/lib/constants";
import { useEditorStore } from "@/store/useEditorState";
import { CropRect, Point } from "@/types";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const MASK_WHITE_THRESHOLD = 10;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

const ImageEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const startPosRef = useRef<Point | null>(null);
  const isDrawingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom + Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef<Point>({ x: 0, y: 0 });
  const spaceHeldRef = useRef(false);

  // Crop local state (visual drag in progress)
  const [cropDragging, setCropDragging] = useState(false);
  const cropStartRef = useRef<Point | null>(null);

  const {
    image,
    selectedTool,
    brushSize,
    setMask,
    adjustments,
    textLayers,
    updateTextLayer,
    removeTextLayer,
    cropRect,
    setCropRect,
    setPickedColor,
    setSelectedTool,
    setPrompt,
    generateEdit,
    isLoading,
  } = useEditorStore();

  // ── Draw composite (image + overlay mask) ──────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx || !imgRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0);

    const overlay = overlayCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!overlay || !mask) return;

    const oc = overlay.getContext("2d");
    if (!oc) return;

    oc.clearRect(0, 0, overlay.width, overlay.height);
    oc.drawImage(mask, 0, 0);

    const imgData = oc.getImageData(0, 0, overlay.width, overlay.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > MASK_WHITE_THRESHOLD) {
        d[i] = 255; d[i + 1] = 0; d[i + 2] = 0; d[i + 3] = 100;
      } else {
        d[i + 3] = 0;
      }
    }
    oc.putImageData(imgData, 0, 0);
    ctx.drawImage(overlay, 0, 0);
  }, []);

  // ── Init on image change ───────────────────────────────────────────────
  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.src = image;
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      maskCanvasRef.current = document.createElement("canvas");
      maskCanvasRef.current.width = img.width;
      maskCanvasRef.current.height = img.height;
      const mctx = maskCanvasRef.current.getContext("2d")!;
      mctx.fillStyle = "black";
      mctx.fillRect(0, 0, img.width, img.height);

      overlayCanvasRef.current = document.createElement("canvas");
      overlayCanvasRef.current.width = img.width;
      overlayCanvasRef.current.height = img.height;

      draw();
      fitToContainer();
    };
  }, [image, draw]);

  // ── Fit zoom to container ──────────────────────────────────────────────
  const fitToContainer = useCallback(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !canvas.width) return;
    const scaleX = (container.clientWidth - 64) / canvas.width;
    const scaleY = (container.clientHeight - 64) / canvas.height;
    const fit = Math.min(scaleX, scaleY, 1);
    setZoom(fit);
    setPan({ x: 0, y: 0 });
  }, []);

  // ── CSS filter string for live adjustments preview ────────────────────
  const filterStr =
    adjustments.brightness !== 100 ||
    adjustments.contrast !== 100 ||
    adjustments.saturation !== 100
      ? `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`
      : undefined;

  // ── Pointer position in canvas coordinates ────────────────────────────
  const getPointerPos = (e: PointerEvent | MouseEvent): Point => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasRef.current.width / rect.width),
      y: (e.clientY - rect.top) * (canvasRef.current.height / rect.height),
    };
  };

  // ── Mask drawing ──────────────────────────────────────────────────────
  const updateMask = (start: Point, end: Point) => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext("2d")!;
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = selectedTool === ToolType.ERASER ? "black" : "white";
    ctx.fillStyle = selectedTool === ToolType.ERASER ? "black" : "white";
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  // ── Wheel zoom ────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
    },
    []
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // ── Keyboard: space for pan ────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); spaceHeldRef.current = true; } };
    const up = (e: KeyboardEvent) => { if (e.code === "Space") spaceHeldRef.current = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // ── Pointer Down ──────────────────────────────────────────────────────
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Pan: middle mouse or space+drag
    if (e.button === 1 || spaceHeldRef.current) {
      isPanningRef.current = true;
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (!canvasRef.current) return;

    const tool = selectedTool;

    if (tool === ToolType.MOVE) return;
    if (e.pointerType !== "mouse") return;

    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPointerPos(e);
    startPosRef.current = pos;

    // Color picker — sample on click
    if (tool === ToolType.COLOR_PICKER) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        const pixel = ctx.getImageData(Math.round(pos.x), Math.round(pos.y), 1, 1).data;
        const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
        setPickedColor(hex);
      }
      isDrawingRef.current = false;
      return;
    }

    // Smart remove — create circular mask and trigger AI
    if (tool === ToolType.SMART_REMOVE) {
      const mask = maskCanvasRef.current;
      if (!mask) return;
      const ctx = mask.getContext("2d")!;
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, mask.width, mask.height);
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize * 1.5, 0, Math.PI * 2);
      ctx.fill();
      const dataUrl = mask.toDataURL("image/png");
      setMask(dataUrl);
      setPrompt("Remove the selected object from the image and fill the area with a natural-looking background");
      setTimeout(() => generateEdit(), 50);
      isDrawingRef.current = false;
      return;
    }

    // Crop start
    if (tool === ToolType.CROP) {
      cropStartRef.current = pos;
      setCropRect(null);
      setCropDragging(true);
      return;
    }

    if (tool === ToolType.BRUSH || tool === ToolType.ERASER) {
      updateMask(pos, pos);
    }
  };

  // ── Pointer Move ──────────────────────────────────────────────────────
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    // Pan
    if (isPanningRef.current) {
      const dx = (e.clientX - lastPanPosRef.current.x) / zoom;
      const dy = (e.clientY - lastPanPosRef.current.y) / zoom;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDrawingRef.current || !canvasRef.current || !startPosRef.current) return;
    e.preventDefault();

    const pos = getPointerPos(e);

    if (selectedTool === ToolType.BRUSH || selectedTool === ToolType.ERASER) {
      updateMask(startPosRef.current, pos);
      startPosRef.current = pos;
      draw();
    } else if (selectedTool === ToolType.RECTANGLE) {
      draw();
      const ctx = canvasRef.current.getContext("2d")!;
      ctx.save();
      ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
      ctx.fillRect(startPosRef.current.x, startPosRef.current.y, pos.x - startPosRef.current.x, pos.y - startPosRef.current.y);
      ctx.restore();
    } else if (selectedTool === ToolType.CROP && cropDragging && cropStartRef.current) {
      const x = Math.min(pos.x, cropStartRef.current.x);
      const y = Math.min(pos.y, cropStartRef.current.y);
      const w = Math.abs(pos.x - cropStartRef.current.x);
      const h = Math.abs(pos.y - cropStartRef.current.y);
      setCropRect({ x, y, width: w, height: h });
    }
  };

  // ── Pointer Up ────────────────────────────────────────────────────────
  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    const tool = selectedTool;

    if (tool === ToolType.CROP) {
      setCropDragging(false);
      return;
    }

    if (tool === ToolType.RECTANGLE && isDrawingRef.current) {
      const endPos = getPointerPos(e);
      const startPos = startPosRef.current;
      if (startPos && maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext("2d")!;
        ctx.fillStyle = "white";
        const w = endPos.x - startPos.x;
        const h = endPos.y - startPos.y;
        if (Math.abs(w) > 0 && Math.abs(h) > 0) {
          ctx.fillRect(startPos.x, startPos.y, w, h);
        }
      }
    }

    isDrawingRef.current = false;
    if (maskCanvasRef.current) {
      setMask(maskCanvasRef.current.toDataURL("image/png"));
    }
  };

  // ── Cursor style ──────────────────────────────────────────────────────
  const getCursor = () => {
    if (spaceHeldRef.current || isPanningRef.current) return "grabbing";
    switch (selectedTool) {
      case ToolType.BRUSH: return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize}' height='${brushSize}'><circle cx='${brushSize / 2}' cy='${brushSize / 2}' r='${brushSize / 2 - 1}' fill='none' stroke='white' stroke-width='1.5'/></svg>") ${brushSize / 2} ${brushSize / 2}, crosshair`;
      case ToolType.ERASER: return "cell";
      case ToolType.CROP: return "crosshair";
      case ToolType.COLOR_PICKER: return "crosshair";
      case ToolType.SMART_REMOVE: return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize * 3}' height='${brushSize * 3}'><circle cx='${brushSize * 1.5}' cy='${brushSize * 1.5}' r='${brushSize * 1.5 - 1}' fill='rgba(255,0,0,0.2)' stroke='red' stroke-width='1.5'/></svg>") ${brushSize * 1.5} ${brushSize * 1.5}, crosshair`;
      case ToolType.TEXT: return "text";
      default: return "default";
    }
  };

  // ── Handle click on canvas wrapper for TEXT tool ──────────────────────
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedTool !== ToolType.TEXT) return;
    if (!canvasRef.current) return;
    const pos = getPointerPos(e as unknown as PointerEvent);
    const xPct = pos.x / canvasRef.current.width;
    const yPct = pos.y / canvasRef.current.height;
    useEditorStore.getState().addTextLayer("Text", xPct, yPct);
    setSelectedTool(ToolType.MOVE);
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden select-none">
      {/* Transform wrapper */}
      <div
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: "center center",
          cursor: getCursor(),
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <div className="relative">
          <canvas
            ref={canvasRef}
            style={{ filter: filterStr, display: "block", maxWidth: "none" }}
          />

          {/* Crop overlay */}
          {selectedTool === ToolType.CROP && cropRect && (
            <div
              className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none"
              style={{
                left: (cropRect.x / (canvasRef.current?.width || 1)) * 100 + "%",
                top: (cropRect.y / (canvasRef.current?.height || 1)) * 100 + "%",
                width: (cropRect.width / (canvasRef.current?.width || 1)) * 100 + "%",
                height: (cropRect.height / (canvasRef.current?.height || 1)) * 100 + "%",
              }}
            >
              {/* Grid lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white/30" />
                ))}
              </div>
              {/* Handles */}
              {[
                "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
                "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
                "top-0 right-0 translate-x-1/2 -translate-y-1/2",
                "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2",
                "top-1/2 right-0 translate-x-1/2 -translate-y-1/2",
                "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
                "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
                "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
              ].map((cls, i) => (
                <div
                  key={i}
                  className={`absolute w-3 h-3 bg-white rounded-sm border border-zinc-800 pointer-events-none ${cls}`}
                />
              ))}
            </div>
          )}

          {/* Text layers */}
          {textLayers.map((layer) => (
            <TextLayerNode
              key={layer.id}
              layer={layer}
              canvasWidth={canvasRef.current?.width ?? 800}
              canvasHeight={canvasRef.current?.height ?? 600}
              onUpdate={(u) => updateTextLayer(layer.id, u)}
              onRemove={() => removeTextLayer(layer.id)}
            />
          ))}
        </div>
      </div>

      {/* Zoom Controls — outside transform, always visible */}
      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-xl p-1 z-30">
        <Button
          variant="ghost" size="icon"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.1))}
          className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg"
        >
          <ZoomOut size={14} />
        </Button>
        <span className="text-xs text-zinc-400 w-10 text-center font-mono">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost" size="icon"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.1))}
          className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg"
        >
          <ZoomIn size={14} />
        </Button>
        <div className="w-px h-4 bg-zinc-800 mx-0.5" />
        <Button
          variant="ghost" size="icon"
          onClick={fitToContainer}
          title="Fit to screen"
          className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg"
        >
          <Maximize2 size={14} />
        </Button>
      </div>

      {/* Crop action bar */}
      {selectedTool === ToolType.CROP && cropRect && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl px-4 py-2 z-30">
          <span className="text-xs text-zinc-400">
            {Math.round(cropRect.width)} × {Math.round(cropRect.height)} px
          </span>
          <div className="w-px h-4 bg-zinc-700" />
          <button
            onClick={() => useEditorStore.getState().applyCrop()}
            className="text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded-lg transition-colors"
          >
            Apply Crop
          </button>
          <button
            onClick={() => { setCropRect(null); setSelectedTool(ToolType.MOVE); }}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm">
          <div className="text-zinc-400 text-sm animate-pulse">Processing…</div>
        </div>
      )}
    </div>
  );
};

// ── Text Layer Node ────────────────────────────────────────────────────────
function TextLayerNode({
  layer,
  canvasWidth,
  canvasHeight,
  onUpdate,
  onRemove,
}: {
  layer: import("@/types").TextLayer;
  canvasWidth: number;
  canvasHeight: number;
  onUpdate: (u: Partial<import("@/types").TextLayer>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<Point>({ x: 0, y: 0 });
  const layerStartRef = useRef<Point>({ x: 0, y: 0 });

  const px = layer.x * canvasWidth;
  const py = layer.y * canvasHeight;

  const handleDragStart = (e: React.PointerEvent) => {
    if (editing) return;
    e.stopPropagation();
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    layerStartRef.current = { x: layer.x, y: layer.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - dragStartRef.current.x) / (rect.width / canvasWidth);
    const dy = (e.clientY - dragStartRef.current.y) / (rect.height / canvasHeight);
    onUpdate({
      x: Math.max(0, Math.min(1, layerStartRef.current.x + dx / canvasWidth)),
      y: Math.max(0, Math.min(1, layerStartRef.current.y + dy / canvasHeight)),
    });
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingRef.current = false;
  };

  return (
    <div
      className="absolute group"
      style={{ left: px, top: py, transform: "translate(-50%, -50%)" }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
    >
      <div className="relative">
        {editing ? (
          <input
            autoFocus
            value={layer.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => { if (e.key === "Enter") setEditing(false); }}
            className="bg-transparent border-b border-white/50 outline-none text-center"
            style={{
              fontSize: layer.fontSize,
              color: layer.color,
              fontFamily: layer.fontFamily,
              minWidth: 80,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="cursor-move whitespace-nowrap"
            style={{
              fontSize: layer.fontSize,
              color: layer.color,
              fontFamily: layer.fontFamily,
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              userSelect: "none",
            }}
            onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
          >
            {layer.text}
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="absolute -top-3 -right-3 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default ImageEditor;
