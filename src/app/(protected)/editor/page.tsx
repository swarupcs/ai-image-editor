"use client";

import Image from "next/image";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { LeftSidebar } from "@/components/left-sidebar";
import ImageGenerationLoading from "@/components/image-generation";
import { AIPromptInput } from "@/components/prompt-input";
import { RightSidebar } from "@/components/right-sidebar";
import { useCallback, useRef, useState } from "react";
import { useEditorStore } from "@/store/useEditorState";
import ImageEditor from "@/components/image-editor";
import { BeforeAfterSlider } from "@/components/before-after-slider";
import {
  ImagePlus,
  Upload,
  Sparkles,
  Wand2,
  Palette,
  Zap,
  Loader2,
} from "lucide-react";

export default function EditorPage() {
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
  const [tab, setTab] = useState<"upload" | "generate">("upload");
  const [generateError, setGenerateError] = useState("");

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
                    {/* Logo */}
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-violet-600/20 rounded-2xl border border-purple-500/20 flex items-center justify-center mx-auto backdrop-blur-sm animate-pulse-glow">
                      <Image
                        src="/logo.png"
                        width={500}
                        height={500}
                        alt="logo"
                      />
                    </div>

                    {/* Tab switcher */}
                    <div className="flex bg-zinc-900/50 border border-zinc-800 rounded-xl p-1 gap-1">
                      <button
                        onClick={() => setTab("upload")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          tab === "upload"
                            ? "bg-zinc-800 text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <ImagePlus size={15} />
                        Upload Image
                      </button>
                      <button
                        onClick={() => setTab("generate")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          tab === "generate"
                            ? "bg-zinc-800 text-zinc-100"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        <Sparkles size={15} />
                        Generate
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
                    ) : (
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
                    )}
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <ImageEditor />
                  </div>
                )}
              </div>

              {isLoading && <ImageGenerationLoading />}
            </div>

            {/* PROMPT INPUT AREA */}
            <div className="shrink-0 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/50 p-4 lg:p-5 z-40">
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
