'use client';

import { ToolType } from '@/lib/constants';
import { useEditorStore } from '@/store/useEditorState';
import { Point } from '@/types';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MASK_WHITE_THRESHOLD = 10;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

const ImageEditor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const penCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const startPosRef = useRef<Point | null>(null);
  const isDrawingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom + Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [canvasDimensions, setCanvasDimensions] = useState<{
    w: number;
    h: number;
  } | null>(null);
  const isPanningRef = useRef(false);
  const lastPanPosRef = useRef<Point>({ x: 0, y: 0 });
  const spaceHeldRef = useRef(false);
  // State mirrors of the above refs — needed so getCursor() rerenders correctly
  const [isPanning, setIsPanning] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);

  // Crop local state
  const [cropDragging, setCropDragging] = useState(false);
  const cropStartRef = useRef<Point | null>(null);
  const cropHandleRef = useRef<string | null>(null);
  const [cropAspect, setCropAspect] = useState<
    'free' | '1:1' | '4:3' | '16:9' | '3:2' | '9:16'
  >('free');

  const ASPECT_RATIOS: Record<string, number | null> = {
    free: null,
    '1:1': 1,
    '4:3': 4 / 3,
    '16:9': 16 / 9,
    '3:2': 3 / 2,
    '9:16': 9 / 16,
  };

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
    penColor,
    commitCanvas,
  } = useEditorStore();

  // ── Draw composite (image + overlay mask) ──────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx || !imgRef.current) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0);

    // Draw pen strokes on top of image (before mask overlay)
    if (penCanvasRef.current) {
      ctx.drawImage(penCanvasRef.current, 0, 0);
    }

    const overlay = overlayCanvasRef.current;
    const mask = maskCanvasRef.current;
    if (!overlay || !mask) return;

    const oc = overlay.getContext('2d');
    if (!oc) return;

    oc.clearRect(0, 0, overlay.width, overlay.height);
    oc.drawImage(mask, 0, 0);

    const imgData = oc.getImageData(0, 0, overlay.width, overlay.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > MASK_WHITE_THRESHOLD) {
        d[i] = 255;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = 100;
      } else {
        d[i + 3] = 0;
      }
    }
    oc.putImageData(imgData, 0, 0);
    ctx.drawImage(overlay, 0, 0);
  }, []);

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
  }, [setZoom, setPan]);

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

      maskCanvasRef.current = document.createElement('canvas');
      maskCanvasRef.current.width = img.naturalWidth;
      maskCanvasRef.current.height = img.naturalHeight;
      const mctx = maskCanvasRef.current.getContext('2d')!;
      mctx.fillStyle = 'black';
      mctx.fillRect(0, 0, img.naturalWidth, img.naturalHeight);

      overlayCanvasRef.current = document.createElement('canvas');
      overlayCanvasRef.current.width = img.naturalWidth;
      overlayCanvasRef.current.height = img.naturalHeight;

      penCanvasRef.current = document.createElement('canvas');
      penCanvasRef.current.width = img.naturalWidth;
      penCanvasRef.current.height = img.naturalHeight;

      setCanvasDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      draw();
      fitToContainer();
    };
  }, [image, draw, fitToContainer]);

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
    const ctx = mask.getContext('2d')!;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = selectedTool === ToolType.ERASER ? 'black' : 'white';
    ctx.fillStyle = selectedTool === ToolType.ERASER ? 'black' : 'white';
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  // ── Wheel zoom ────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta)));
  }, [setZoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Keyboard: space for pan ────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
        return;
      e.preventDefault();
      spaceHeldRef.current = true;
      setSpaceHeld(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceHeldRef.current = false;
        setSpaceHeld(false);
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // ── Crop handle pointer down ──────────────────────────────────────────
  const handleCropHandleDown = (handle: string) => (e: React.PointerEvent) => {
    e.stopPropagation();
    cropHandleRef.current = handle;
    isDrawingRef.current = true;
    startPosRef.current = getPointerPos(e as unknown as PointerEvent);
  };

  // ── Pointer Down ──────────────────────────────────────────────────────
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    // Pan: middle mouse or space+drag
    if (e.button === 1 || spaceHeldRef.current) {
      isPanningRef.current = true;
      setIsPanning(true);
      lastPanPosRef.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (!canvasRef.current) return;

    const tool = selectedTool;

    if (tool === ToolType.MOVE) return;
    if (e.pointerType !== 'mouse') return;

    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPointerPos(e);
    startPosRef.current = pos;

    // Color picker — sample on click
    if (tool === ToolType.COLOR_PICKER) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        const pixel = ctx.getImageData(
          Math.round(pos.x),
          Math.round(pos.y),
          1,
          1,
        ).data;
        const hex = `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`;
        setPickedColor(hex);
      }
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

    if (
      tool === ToolType.BRUSH ||
      tool === ToolType.ERASER ||
      tool === ToolType.SMART_REMOVE
    ) {
      updateMask(pos, pos);
    }

    // Pen: start stroke on penCanvas
    if (tool === ToolType.PEN && penCanvasRef.current) {
      const pc = penCanvasRef.current.getContext('2d')!;
      pc.lineWidth = brushSize;
      pc.lineCap = 'round';
      pc.lineJoin = 'round';
      pc.strokeStyle = penColor;
      pc.beginPath();
      pc.moveTo(pos.x, pos.y);
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

    if (!isDrawingRef.current || !canvasRef.current || !startPosRef.current)
      return;
    e.preventDefault();

    const pos = getPointerPos(e);

    if (selectedTool === ToolType.PEN && penCanvasRef.current) {
      const pc = penCanvasRef.current.getContext('2d')!;
      pc.lineTo(pos.x, pos.y);
      pc.stroke();
      pc.beginPath();
      pc.moveTo(pos.x, pos.y);
      startPosRef.current = pos;
      draw();
    } else if (
      selectedTool === ToolType.BRUSH ||
      selectedTool === ToolType.ERASER ||
      selectedTool === ToolType.SMART_REMOVE
    ) {
      updateMask(startPosRef.current, pos);
      startPosRef.current = pos;
      draw();
    } else if (selectedTool === ToolType.RECTANGLE) {
      draw();
      const ctx = canvasRef.current.getContext('2d')!;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
      ctx.fillRect(
        startPosRef.current.x,
        startPosRef.current.y,
        pos.x - startPosRef.current.x,
        pos.y - startPosRef.current.y,
      );
      ctx.restore();
    } else if (selectedTool === ToolType.CROP) {
      if (cropHandleRef.current && cropRect) {
        const handle = cropHandleRef.current;
        const x1 = cropRect.x,
          y1 = cropRect.y;
        const x2 = x1 + cropRect.width,
          y2 = y1 + cropRect.height;
        let nx = x1,
          ny = y1,
          nw = cropRect.width,
          nh = cropRect.height;
        if (handle === 'tl') {
          nx = pos.x;
          ny = pos.y;
          nw = x2 - pos.x;
          nh = y2 - pos.y;
        } else if (handle === 'tc') {
          ny = pos.y;
          nh = y2 - pos.y;
        } else if (handle === 'tr') {
          ny = pos.y;
          nw = pos.x - x1;
          nh = y2 - pos.y;
        } else if (handle === 'ml') {
          nx = pos.x;
          nw = x2 - pos.x;
        } else if (handle === 'mr') {
          nw = pos.x - x1;
        } else if (handle === 'bl') {
          nx = pos.x;
          nw = x2 - pos.x;
          nh = pos.y - y1;
        } else if (handle === 'bc') {
          nh = pos.y - y1;
        } else if (handle === 'br') {
          nw = pos.x - x1;
          nh = pos.y - y1;
        } else if (handle === 'move' && startPosRef.current) {
          nx = x1 + (pos.x - startPosRef.current.x);
          ny = y1 + (pos.y - startPosRef.current.y);
          startPosRef.current = pos;
        }
        if (handle !== 'move') {
          const ratio = ASPECT_RATIOS[cropAspect];
          if (ratio) {
            if (handle === 'tc' || handle === 'bc') nw = nh * ratio;
            else nh = nw / ratio;
          }
        }
        if (nw > 5 && nh > 5)
          setCropRect({ x: nx, y: ny, width: nw, height: nh });
      } else if (cropDragging && cropStartRef.current) {
        const x = Math.min(pos.x, cropStartRef.current.x);
        const y = Math.min(pos.y, cropStartRef.current.y);
        const w = Math.abs(pos.x - cropStartRef.current.x);
        let h = Math.abs(pos.y - cropStartRef.current.y);
        const ratio = ASPECT_RATIOS[cropAspect];
        if (ratio) h = w / ratio;
        setCropRect({ x, y, width: w, height: h });
      }
    }
  };

  // ── Pointer Up ────────────────────────────────────────────────────────
  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      setIsPanning(false);
      return;
    }

    const tool = selectedTool;

    // Pen: bake strokes into the image
    if (tool === ToolType.PEN) {
      const penCanvas = penCanvasRef.current;
      if (!penCanvas || !canvasRef.current || !imgRef.current) return;
      isDrawingRef.current = false;

      const offscreen = document.createElement('canvas');
      offscreen.width = imgRef.current.naturalWidth;
      offscreen.height = imgRef.current.naturalHeight;
      const oc = offscreen.getContext('2d')!;
      oc.drawImage(imgRef.current, 0, 0);
      oc.drawImage(penCanvas, 0, 0);
      const dataUrl = offscreen.toDataURL('image/png');
      commitCanvas(dataUrl);

      // Clear pen canvas
      const pc = penCanvas.getContext('2d')!;
      pc.clearRect(0, 0, penCanvas.width, penCanvas.height);
      return;
    }

    if (tool === ToolType.CROP) {
      setCropDragging(false);
      cropHandleRef.current = null;
      return;
    }

    if (tool === ToolType.RECTANGLE && isDrawingRef.current) {
      const endPos = getPointerPos(e);
      const startPos = startPosRef.current;
      if (startPos && maskCanvasRef.current) {
        const ctx = maskCanvasRef.current.getContext('2d')!;
        ctx.fillStyle = 'white';
        const w = endPos.x - startPos.x;
        const h = endPos.y - startPos.y;
        if (Math.abs(w) > 0 && Math.abs(h) > 0) {
          ctx.fillRect(startPos.x, startPos.y, w, h);
        }
      }
    }

    isDrawingRef.current = false;
    if (maskCanvasRef.current) {
      setMask(maskCanvasRef.current.toDataURL('image/png'));
    }
  };

  // ── Cursor style ──────────────────────────────────────────────────────
  const getCursor = () => {
    if (spaceHeld || isPanning) return 'grabbing';
    switch (selectedTool) {
      case ToolType.BRUSH:
        return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize}' height='${brushSize}'><circle cx='${brushSize / 2}' cy='${brushSize / 2}' r='${brushSize / 2 - 1}' fill='none' stroke='white' stroke-width='1.5'/></svg>") ${brushSize / 2} ${brushSize / 2}, crosshair`;
      case ToolType.ERASER:
        return 'cell';
      case ToolType.CROP:
        return 'crosshair';
      case ToolType.COLOR_PICKER:
        return 'crosshair';
      case ToolType.SMART_REMOVE:
        return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize}' height='${brushSize}'><circle cx='${brushSize / 2}' cy='${brushSize / 2}' r='${brushSize / 2 - 1}' fill='rgba(251,146,60,0.25)' stroke='rgb(251,146,60)' stroke-width='1.5'/></svg>") ${brushSize / 2} ${brushSize / 2}, crosshair`;
      case ToolType.TEXT:
        return 'text';
      case ToolType.PEN:
        return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='${brushSize}' height='${brushSize}'><circle cx='${brushSize / 2}' cy='${brushSize / 2}' r='${brushSize / 2 - 1}' fill='none' stroke='white' stroke-width='1.5'/></svg>") ${brushSize / 2} ${brushSize / 2}, crosshair`;
      default:
        return 'default';
    }
  };

  // ── Handle click on canvas wrapper for TEXT tool ──────────────────────
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // We now add text exclusively via the sidebar UI
    if (selectedTool === ToolType.TEXT) {
      setSelectedTool(ToolType.MOVE);
    }
  };

  // ── Smart Remove helpers ──────────────────────────────────────────────
  const handleSmartRemove = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    setMask(mask.toDataURL('image/png'));
    setPrompt(
      'Remove the selected object from the image completely and fill the area with a seamless, natural-looking background that matches the surroundings',
    );
    setTimeout(() => {
      generateEdit();
      // Clear mask canvas after triggering
      const ctx = mask.getContext('2d')!;
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, mask.width, mask.height);
    }, 50);
  };

  const clearSmartRemoveMask = () => {
    const mask = maskCanvasRef.current;
    if (!mask) return;
    const ctx = mask.getContext('2d')!;
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, mask.width, mask.height);
    setMask(mask.toDataURL('image/png'));
    draw();
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className='w-full h-full relative overflow-hidden select-none'
    >
      {/* Transform wrapper */}
      <div
        style={{
          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: 'center center',
          cursor: getCursor(),
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      >
        <div className='relative'>
          <canvas
            ref={canvasRef}
            style={{ filter: filterStr, display: 'block', maxWidth: 'none' }}
          />

          {/* Crop overlay */}
          {selectedTool === ToolType.CROP && cropRect && (
            <div
              className='absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]'
              style={{
                left: (cropRect.x / (canvasDimensions?.w || 1)) * 100 + '%',
                top: (cropRect.y / (canvasDimensions?.h || 1)) * 100 + '%',
                width:
                  (cropRect.width / (canvasDimensions?.w || 1)) * 100 + '%',
                height:
                  (cropRect.height / (canvasDimensions?.h || 1)) * 100 + '%',
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Move overlay */}
              <div
                className='absolute inset-0 z-10'
                style={{ cursor: 'move' }}
                onPointerDown={handleCropHandleDown('move')}
              />
              {/* Grid lines */}
              <div className='absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none'>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className='border border-white/30' />
                ))}
              </div>
              {/* Handles */}
              {[
                {
                  cls: 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
                  handle: 'tl',
                  cursor: 'nw-resize',
                },
                {
                  cls: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
                  handle: 'tc',
                  cursor: 'n-resize',
                },
                {
                  cls: 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
                  handle: 'tr',
                  cursor: 'ne-resize',
                },
                {
                  cls: 'top-1/2 left-0 -translate-x-1/2 -translate-y-1/2',
                  handle: 'ml',
                  cursor: 'w-resize',
                },
                {
                  cls: 'top-1/2 right-0 translate-x-1/2 -translate-y-1/2',
                  handle: 'mr',
                  cursor: 'e-resize',
                },
                {
                  cls: 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
                  handle: 'bl',
                  cursor: 'sw-resize',
                },
                {
                  cls: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
                  handle: 'bc',
                  cursor: 's-resize',
                },
                {
                  cls: 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
                  handle: 'br',
                  cursor: 'se-resize',
                },
              ].map(({ cls, handle, cursor }) => (
                <div
                  key={handle}
                  className={`absolute w-3 h-3 bg-white rounded-sm border border-zinc-800 z-20 ${cls}`}
                  style={{ cursor }}
                  onPointerDown={handleCropHandleDown(handle)}
                />
              ))}
            </div>
          )}

          {/* Text layers */}
          {textLayers.map((layer) => (
            <TextLayerNode
              key={layer.id}
              layer={layer}
              canvasWidth={canvasDimensions?.w ?? 800}
              canvasHeight={canvasDimensions?.h ?? 600}
              onUpdate={(u) => updateTextLayer(layer.id, u)}
              onRemove={() => removeTextLayer(layer.id)}
            />
          ))}
        </div>
      </div>

      {/* Image Info Bar — bottom left */}
      {canvasDimensions && (
        <div className='absolute bottom-4 left-4 flex items-center gap-2 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-xl px-3 py-1.5 z-30 text-[10px] text-zinc-500 font-mono select-none'>
          <span>
            {canvasDimensions.w} × {canvasDimensions.h}
          </span>
          <div className='w-px h-3 bg-zinc-700' />
          <span>{Math.round(zoom * 100)}%</span>
        </div>
      )}

      {/* Zoom Controls — outside transform, always visible */}
      <div className='absolute bottom-4 right-4 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-sm border border-zinc-800 rounded-xl p-1 z-30'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.1))}
          className='h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg'
        >
          <ZoomOut size={14} />
        </Button>
        <span className='text-xs text-zinc-400 w-10 text-center font-mono'>
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.1))}
          className='h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg'
        >
          <ZoomIn size={14} />
        </Button>
        <div className='w-px h-4 bg-zinc-800 mx-0.5' />
        <Button
          variant='ghost'
          size='icon'
          onClick={fitToContainer}
          title='Fit to screen'
          className='h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg'
        >
          <Maximize2 size={14} />
        </Button>
      </div>

      {/* Crop action bar */}
      {selectedTool === ToolType.CROP && cropRect && (
        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl px-3 py-2 z-30 flex-wrap justify-center'>
          {/* Aspect ratio presets */}
          <div className='flex items-center gap-0.5'>
            {(['free', '1:1', '4:3', '16:9', '3:2', '9:16'] as const).map(
              (a) => (
                <button
                  key={a}
                  onClick={() => setCropAspect(a)}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors font-medium ${
                    cropAspect === a
                      ? 'bg-purple-600 text-white'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  {a}
                </button>
              ),
            )}
          </div>
          <div className='w-px h-4 bg-zinc-700' />
          <span className='text-xs text-zinc-400 font-mono tabular-nums'>
            {Math.round(cropRect.width)} × {Math.round(cropRect.height)}
          </span>
          <div className='w-px h-4 bg-zinc-700' />
          <button
            onClick={() => useEditorStore.getState().applyCrop()}
            className='text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded-lg transition-colors'
          >
            Apply
          </button>
          <button
            onClick={() => {
              setCropRect(null);
              setSelectedTool(ToolType.MOVE);
            }}
            className='text-xs text-zinc-400 hover:text-zinc-200 transition-colors'
          >
            Cancel
          </button>
        </div>
      )}

      {/* Smart Remove action bar */}
      {selectedTool === ToolType.SMART_REMOVE && (
        <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-xl px-4 py-2 z-30'>
          <div className='flex items-center gap-1.5'>
            <div className='w-2 h-2 rounded-full bg-orange-400 animate-pulse' />
            <span className='text-xs text-zinc-400'>
              Paint over the object to remove
            </span>
          </div>
          <div className='w-px h-4 bg-zinc-700' />
          <button
            onClick={handleSmartRemove}
            disabled={isLoading}
            className='text-xs font-medium text-white bg-orange-600 hover:bg-orange-500 disabled:opacity-50 px-3 py-1 rounded-lg transition-colors'
          >
            Remove Object
          </button>
          <button
            onClick={clearSmartRemoveMask}
            className='text-xs text-zinc-400 hover:text-zinc-200 transition-colors'
          >
            Clear
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className='absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm'>
          <div className='text-zinc-400 text-sm animate-pulse'>Processing…</div>
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
  layer: import('@/types').TextLayer;
  canvasWidth: number;
  canvasHeight: number;
  onUpdate: (u: Partial<import('@/types').TextLayer>) => void;
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
    const rect = (
      e.currentTarget as HTMLElement
    ).parentElement?.getBoundingClientRect();
    if (!rect) return;
    const dx =
      (e.clientX - dragStartRef.current.x) / (rect.width / canvasWidth);
    const dy =
      (e.clientY - dragStartRef.current.y) / (rect.height / canvasHeight);
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
      className='absolute group'
      style={{ left: px, top: py, transform: 'translate(-50%, -50%)' }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
    >
      <div className='relative'>
        {editing ? (
          <input
            autoFocus
            value={layer.text}
            onChange={(e) => onUpdate({ text: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditing(false);
            }}
            className='bg-transparent border-b border-white/50 outline-none text-center'
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
            className='cursor-move whitespace-nowrap'
            style={{
              fontSize: layer.fontSize,
              color: layer.color,
              fontFamily: layer.fontFamily,
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              userSelect: 'none',
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
          >
            {layer.text}
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className='absolute -top-3 -right-3 w-5 h-5 bg-red-500 hover:bg-red-400 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default ImageEditor;
