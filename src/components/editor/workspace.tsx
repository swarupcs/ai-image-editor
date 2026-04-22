"use client";

import { Navbar } from "@/components/editor/navbar/editor-navbar";
import { Button } from "@/components/ui/button";
import { LeftSidebar } from "@/components/editor/sidebars/left-sidebar";
import ImageGenerationLoading from "@/components/image-generation";
import { AIPromptInput } from "@/components/editor/panels/prompt-input";
import { RightSidebar } from "@/components/editor/sidebars/right-sidebar";
import { useCallback, useRef, useState } from "react";
import { useEditorStore } from "@/store/useEditorState";
import ImageEditor from "@/components/editor/canvas/image-editor";
import { BeforeAfterSlider } from "@/components/editor/panels/before-after-slider";
import { PromptTemplates } from "@/components/editor/panels/prompt-templates";
import { VariationsOverlay } from "@/components/editor/panels/variations-overlay";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
  ImagePlus,
  Upload,
  Sparkles,
  Wand2,
  Palette,
  Zap,
  Loader2,
  Square,
} from "lucide-react";

export default function EditorWorkspace() {
  useKeyboardShortcuts();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    image,
    setImage,
    showHistory,
    showBeforeAfter,
    isLoading,
    prompt,
    setPrompt,
    generateFromPrompt,
    credits,
  } = useEditorStore();
  const [isDragging, setIsDragging] = useState(false);
  const [tab, setTab] = useState<"upload" | "generate" | "blank">("upload");
  const [generateError, setGenerateError] = useState("");

  // Blank canvas state
  const BLANK_SIZES = [
    { label: "512 × 512", w: 512, h: 512 },
    { label: "768 × 768", w: 768, h: 768 },
    { label: "1024 × 1024", w: 1024, h: 1024 },
    { label: "1280 × 720", w: 1280, h: 720 },
    { label: "1920 × 1080", w: 1920, h: 1080 },
  ];
  const [blankSize, setBlankSize] = useState(BLANK_SIZES[0]);
  const [blankBg, setBlankBg] = useState("#ffffff");

  const handleCreateBlank = () => {
    const canvas = document.createElement("canvas");
    canvas.width = blankSize.w;
    canvas.height = blankSize.h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = blankBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setImage(canvas.toDataURL("image/png"));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => setImage(reader.result as string);
        reader.readAsDataURL(file);
      }
    },
    [setImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleGenerate = async () => {
    setGenerateError("");
    try {
      await generateFromPrompt();
    } catch (err: unknown) {
      setGenerateError(
        err instanceof Error ? err.message : "Failed to generate"
      );
    }
  };

  return (
    <>
      <div className="w-full h-dvh flex flex-col overflow-hidden bg-zinc-950">
        <input
          ref={fileInputRef}
          onChange={handleImageUpload}
          type="file"
          accept="image/*"
          className="hidden"
        />

        <Navbar fileInputRef={fileInputRef} />
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* LEFT COLUMN */}
          <LeftSidebar />

          {/* MIDDLE COLUMN */}
          <main className="flex-1 flex flex-col min-w-0 relative">
            {/* CANVAS AREA */}
            <div
              className="flex-1 relative overflow-hidden w-full h-full"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {/* BACKGROUND PATTERN */}
              <div className="absolute inset-0 bg-zinc-950">
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, #a855f7 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-transparent" />
              </div>

              {/* DRAG OVERLAY */}
              {isDragging && (
                <div className="absolute inset-0 z-50 bg-purple-500/10 backdrop-blur-sm border-2 border-dashed border-purple-500/50 flex items-center justify-center rounded-lg m-4 transition-all">
                  <div className="text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mx-auto">
                      <Upload className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-purple-300 font-medium">
                      Drop your image here
                    </p>
                  </div>
                </div>
              )}

              {/* MAIN EDITOR SCREEN */}
              <div className="w-full h-full flex items-center justify-center p-6 md:p-10">
                {!image ? (
                  <div className="text-center space-y-6 max-w-md z-10 w-full">

                    {/* Tab switcher */}
                    <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-xl p-1 gap-1">
                      <button
                        onClick={() => setTab("upload")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                          tab === "upload"
                            ? "bg-zinc-800 text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <ImagePlus size={14} />
                        Upload
                      </button>
                      <button
                        onClick={() => setTab("generate")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                          tab === "generate"
                            ? "bg-zinc-800 text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <Sparkles size={14} />
                        Generate
                      </button>
                      <button
                        onClick={() => setTab("blank")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                          tab === "blank"
                            ? "bg-zinc-800 text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <Square size={14} />
                        Blank
                      </button>
                    </div>

                    {tab === "upload" ? (
                      <div className="space-y-4">
                        <p className="text-zinc-500 text-sm leading-relaxed">
                          Upload an image to start editing with powerful AI
                          tools. Inpaint, apply filters, expand, and transform.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {[
                            { icon: Wand2, text: "Inpainting" },
                            { icon: Palette, text: "AI Filters" },
                            { icon: Sparkles, text: "Expansion" },
                          ].map((f) => (
                            <div
                              key={f.text}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400"
                            >
                              <f.icon size={12} className="text-purple-400" />
                              {f.text}
                            </div>
                          ))}
                        </div>
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full h-12 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 border-0"
                        >
                          <ImagePlus size={18} className="mr-2" />
                          Select Image
                        </Button>
                        <p className="text-zinc-600 text-xs">
                          or drag and drop an image anywhere
                        </p>
                      </div>
                    ) : tab === "generate" ? (
                      <div className="space-y-4 text-left">
                        <p className="text-zinc-500 text-sm text-center leading-relaxed">
                          Describe the image you want to create and let AI
                          generate it for you.
                        </p>
                        <textarea
                          placeholder="A cinematic portrait of an astronaut in a neon-lit Tokyo alleyway, rain-soaked streets reflecting pink and blue lights, ultra-realistic..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          rows={4}
                          className="w-full resize-none bg-zinc-900/50 border border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
                        />
                        {generateError && (
                          <p className="text-red-400 text-xs">{generateError}</p>
                        )}
                        {credits !== null && credits <= 0 && (
                          <p className="text-red-400 text-xs flex items-center gap-1.5">
                            <Zap size={12} />
                            No credits remaining
                          </p>
                        )}
                        <Button
                          onClick={handleGenerate}
                          disabled={
                            isLoading ||
                            !prompt.trim() ||
                            (credits !== null && credits <= 0)
                          }
                          className="w-full h-12 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 border-0 disabled:opacity-50 disabled:scale-100"
                        >
                          {isLoading ? (
                            <Loader2 size={18} className="mr-2 animate-spin" />
                          ) : (
                            <Sparkles size={18} className="mr-2" />
                          )}
                          {isLoading ? "Generating…" : "Generate Image"}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-zinc-500 text-sm text-center leading-relaxed">
                          Start with a blank canvas and paint or apply AI edits.
                        </p>
                        {/* Size presets */}
                        <div className="grid grid-cols-2 gap-1.5">
                          {BLANK_SIZES.map((s) => (
                            <button
                              key={s.label}
                              onClick={() => setBlankSize(s)}
                              className={`py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                                blankSize.label === s.label
                                  ? "bg-purple-500/15 border-purple-500/40 text-purple-300"
                                  : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                        {/* Background color */}
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-500 text-xs flex-1">Background</span>
                          <div className="flex items-center gap-2">
                            {["#ffffff", "#000000", "#1a1a2e", "#f8f0e3"].map((c) => (
                              <button
                                key={c}
                                onClick={() => setBlankBg(c)}
                                className={`w-6 h-6 rounded-md border-2 transition-all ${
                                  blankBg === c ? "border-purple-400 scale-110" : "border-zinc-700"
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                            <label className="relative w-6 h-6 rounded-md border-2 border-zinc-700 overflow-hidden cursor-pointer hover:border-zinc-500 transition-all">
                              <input
                                type="color"
                                value={blankBg}
                                onChange={(e) => setBlankBg(e.target.value)}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                              />
                              <div
                                className="w-full h-full"
                                style={{ backgroundColor: blankBg }}
                              />
                            </label>
                          </div>
                        </div>
                        <Button
                          onClick={handleCreateBlank}
                          className="w-full h-12 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/25 border-0"
                        >
                          <Square size={18} className="mr-2" />
                          Create Canvas
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <ImageEditor />
                  </div>
                )}
              </div>

              {isLoading && <ImageGenerationLoading />}
              <VariationsOverlay />
            </div>

            {/* PROMPT INPUT AREA */}
            <div className="shrink-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 px-4 pt-3 pb-4 lg:px-5 lg:pt-3 lg:pb-5 z-40 space-y-2">
              {image && <PromptTemplates />}
              <AIPromptInput />
            </div>
          </main>

          {/* RIGHT COLUMN: EDIT HISTORY */}
          {showHistory && <RightSidebar />}
        </div>
      </div>

      {showBeforeAfter && <BeforeAfterSlider />}
    </>
  );
}
