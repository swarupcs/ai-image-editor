"use client";

import { useState } from "react";
import { useEditorStore } from "@/store/useEditorState";
import { X, Download, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type Format = "png" | "jpeg" | "webp";

const FORMAT_OPTIONS: { value: Format; label: string; desc: string }[] = [
  { value: "png", label: "PNG", desc: "Lossless, best quality" },
  { value: "jpeg", label: "JPEG", desc: "Smaller size, lossy" },
  { value: "webp", label: "WebP", desc: "Modern format, great compression" },
];

const SCALE_OPTIONS = [
  { value: 0.5, label: "0.5×" },
  { value: 1, label: "1×" },
  { value: 2, label: "2×" },
  { value: 3, label: "3×" },
];

interface ExportPanelProps {
  onClose: () => void;
}

export function ExportPanel({ onClose }: ExportPanelProps) {
  const { image } = useEditorStore();
  const [format, setFormat] = useState<Format>("png");
  const [quality, setQuality] = useState(92);
  const [scale, setScale] = useState(1);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!image) return;
    setExporting(true);

    try {
      const img = new window.Image();
      img.src = image;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const mimeType = format === "png" ? "image/png" : format === "jpeg" ? "image/jpeg" : "image/webp";
      const qualityValue = format === "png" ? undefined : quality / 100;

      const dataUrl = canvas.toDataURL(mimeType, qualityValue);
      const link = document.createElement("a");
      link.download = `imgstudio-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <ImageIcon size={15} className="text-purple-400" />
            <span className="text-sm font-semibold text-zinc-100">Export Options</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X size={14} />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {/* Format */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">Format</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={cn(
                    "p-2.5 rounded-lg border text-left transition-all",
                    format === f.value
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                      : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  <div className="text-xs font-bold">{f.label}</div>
                  <div className="text-[10px] mt-0.5 leading-tight opacity-70">{f.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quality (not for PNG) */}
          {format !== "png" && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">Quality</Label>
                <span className="text-xs font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                  {quality}%
                </span>
              </div>
              <Slider
                value={[quality]}
                min={10}
                max={100}
                step={1}
                onValueChange={([v]) => setQuality(v)}
                className="py-1 [&>.relative>.absolute]:bg-purple-500 **:[[role=slider]]:border-purple-500 **:[[role=slider]]:bg-zinc-950"
              />
            </div>
          )}

          {/* Scale */}
          <div className="space-y-2">
            <Label className="text-xs text-zinc-400 uppercase tracking-wider">Scale</Label>
            <div className="grid grid-cols-4 gap-1.5">
              {SCALE_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setScale(s.value)}
                  className={cn(
                    "py-2 rounded-lg border text-xs font-medium transition-all",
                    scale === s.value
                      ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                      : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <Button
            onClick={handleExport}
            disabled={!image || exporting}
            className="w-full h-9 bg-linear-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-medium text-sm border-0"
          >
            <Download size={14} className="mr-2" />
            {exporting ? "Exporting…" : "Download"}
          </Button>
        </div>
      </div>
    </div>
  );
}
