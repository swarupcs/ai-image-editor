"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  History,
  Redo,
  Undo,
  Upload,
  X,
  Layers,
  Save,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/store/useEditorState";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Navbar({
  fileInputRef,
}: {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const {
    image,
    undo,
    redo,
    historyIndex,
    history,
    showHistory,
    toggleHistory,
    credits,
    fetchCredits,
    saveCurrentImage,
  } = useEditorStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = `imggen-${Date.now()}.png`;
    link.href = image as string;
    link.click();
  };

  const handleSave = async () => {
    if (!image || saving) return;
    setSaving(true);
    try {
      await saveCurrentImage();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <header className="h-14 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50 flex items-center justify-between px-4 shrink-0 z-50">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <Link
          className="flex items-center gap-2.5 font-bold text-lg hover:opacity-90 transition-opacity"
          href="/"
        >
          <div className="relative h-9 w-9 overflow-hidden rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500/10 to-violet-600/10 border border-purple-500/20">
            <Image
              src="/logo.png"
              alt="ImgGen Logo"
              fill
              className="object-cover p-0.5"
              priority
            />
          </div>
          <span className="text-zinc-100 hidden md:block tracking-tight text-base">
            Img<span className="text-purple-400">Gen</span>
          </span>
        </Link>
      </div>

      {/* Center: Undo/Redo */}
      <div className="flex items-center gap-1">
        <TooltipProvider delayDuration={300}>
          <div className="flex items-center bg-zinc-900/50 rounded-lg p-0.5 border border-zinc-800/50">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-md"
                >
                  <Undo size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Undo</TooltipContent>
            </Tooltip>

            <div className="h-4 w-px bg-zinc-800 mx-0.5" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-md"
                >
                  <Redo size={15} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Redo</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <TooltipProvider delayDuration={300}>
          {/* Credits badge */}
          {credits !== null && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={cn(
                    "hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-medium",
                    credits > 5
                      ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                      : "bg-red-500/10 border-red-500/20 text-red-400"
                  )}
                >
                  <Zap size={12} />
                  {credits}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {credits} generation credit{credits !== 1 ? "s" : ""} remaining
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="ghost"
                size="sm"
                className="h-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 px-2.5 md:px-3"
              >
                <Upload size={14} className="md:mr-1.5" />
                <span className="hidden md:inline text-xs">Upload</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs md:hidden">
              Upload
            </TooltipContent>
          </Tooltip>

          {/* Save to gallery */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleSave}
                disabled={!image || saving}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-2.5 md:px-3 text-xs",
                  saved
                    ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80"
                )}
              >
                {saved ? (
                  <CheckCircle2 size={14} className="md:mr-1.5" />
                ) : (
                  <Save size={14} className="md:mr-1.5" />
                )}
                <span className="hidden md:inline">
                  {saving ? "Saving…" : saved ? "Saved" : "Save"}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs md:hidden">
              Save to Gallery
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleDownload}
                disabled={!image}
                size="sm"
                className="h-8 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-medium px-2.5 md:px-3 rounded-lg border-0 text-xs"
              >
                <Download size={14} className="md:mr-1.5" />
                <span className="hidden md:inline">Export</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs md:hidden">
              Export
            </TooltipContent>
          </Tooltip>

          {/* History Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <div className="h-5 w-px bg-zinc-800 mx-1" />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleHistory}
                  className={cn(
                    "h-8 w-8 rounded-lg transition-all duration-200",
                    showHistory
                      ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                      : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80"
                  )}
                >
                  {showHistory ? <X size={15} /> : <Layers size={15} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {showHistory ? "Close History" : "Open History"}
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </header>
  );
}
