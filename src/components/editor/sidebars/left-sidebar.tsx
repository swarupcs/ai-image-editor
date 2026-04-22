"use client";

import {
  Hand,
  Square,
  Brush,
  Eraser,
  Sparkles,
  Image as ImageIcon,
  Maximize,
  Delete,
  Crop,
  Type,
  Pipette,
  Wand2,
  SunMedium,
  Contrast,
  Droplets,
  Blend,
  Smile,
  Upload,
  Layers,
  Plus,
  RotateCcw,
  FlipHorizontal2,
  FlipVertical2,
  RotateCw,
  Aperture,
  Sparkle,
  Wind,
  Palette,
  PenLine,
  ImagePlus,
} from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import GridItem from "@/components/grid-item";
import { StickerPanel } from "@/components/editor/panels/sticker-panel";
import { filters, ratios, ToolType } from "@/lib/constants";
import { ToolButton } from "@/components/tool-button";
import { useEditorStore } from "@/store/useEditorState";
import { useRef, useState } from "react";

export const LeftSidebar = () => {
  const {
    applyFilter,
    isLoading,
    applyExpansion,
    removeBackground,
    enhanceImage,
    enhanceFace,
    setSelectedTool,
    selectedTool,
    setBrushSize,
    brushSize,
    image,
    mask,
    adjustments,
    setAdjustments,
    resetAdjustments,
    applyAdjustments,
    addTextLayer,
    flattenTextLayers,
    blendSource,
    setBlendSource,
    applyBlend,
    pickedColor,
    recentColors,
    canvasEffects,
    setCanvasEffect,
    applyCanvasEffects,
    applySharpen,
    flipHorizontal,
    flipVertical,
    rotateLeft,
    rotateRight,
    recolorArea,
    penColor,
    setPenColor,
    replaceBackground,
  } = useEditorStore();

  const blendInputRef = useRef<HTMLInputElement>(null);
  const [newText, setNewText] = useState("Your Text");
  const [blendPrompt, setBlendPrompt] = useState("");
  const [recolorTarget, setRecolorTarget] = useState("#ff0000");
  const [bgScene, setBgScene] = useState("");

  const handleBlendUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setBlendSource(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const hasAdjustmentChanges =
    adjustments.brightness !== 100 ||
    adjustments.contrast !== 100 ||
    adjustments.saturation !== 100;

  const hasEffectChanges =
    canvasEffects.blur > 0 ||
    canvasEffects.vignette > 0 ||
    canvasEffects.grain > 0;

  return (
    <aside className="hidden md:flex w-72 flex-col border-r border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl z-20 shrink-0 h-full">
      <ScrollArea className="h-full w-full">
        <div className="p-3 space-y-3">

          {/* 1. Tools Section */}
          <div className="space-y-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/30">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
              Tools
            </h3>

            <div className="grid grid-cols-4 gap-1.5">
              <ToolButton
                active={selectedTool === ToolType.MOVE}
                onClick={() => setSelectedTool(ToolType.MOVE)}
                icon={<Hand size={16} />}
                label="Pan"
              />
              <ToolButton
                active={selectedTool === ToolType.RECTANGLE}
                onClick={() => setSelectedTool(ToolType.RECTANGLE)}
                icon={<Square size={16} />}
                label="Select"
              />
              <ToolButton
                active={selectedTool === ToolType.BRUSH}
                onClick={() => setSelectedTool(ToolType.BRUSH)}
                icon={<Brush size={16} />}
                label="Brush"
              />
              <ToolButton
                active={selectedTool === ToolType.ERASER}
                onClick={() => setSelectedTool(ToolType.ERASER)}
                icon={<Eraser size={16} />}
                label="Erase"
              />
              <ToolButton
                active={selectedTool === ToolType.CROP}
                onClick={() => setSelectedTool(ToolType.CROP)}
                icon={<Crop size={16} />}
                label="Crop"
              />
              <ToolButton
                active={selectedTool === ToolType.TEXT}
                onClick={() => setSelectedTool(ToolType.TEXT)}
                icon={<Type size={16} />}
                label="Text"
              />
              <ToolButton
                active={selectedTool === ToolType.COLOR_PICKER}
                onClick={() => setSelectedTool(ToolType.COLOR_PICKER)}
                icon={<Pipette size={16} />}
                label="Picker"
              />
              <ToolButton
                active={selectedTool === ToolType.SMART_REMOVE}
                onClick={() => setSelectedTool(ToolType.SMART_REMOVE)}
                icon={<Wand2 size={16} />}
                label="Remove"
              />
              <ToolButton
                active={selectedTool === ToolType.PEN}
                onClick={() => setSelectedTool(ToolType.PEN)}
                icon={<PenLine size={16} />}
                label="Draw"
              />
            </div>

            {/* Brush Size */}
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                  Brush Size
                </span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                  {brushSize}px
                </span>
              </div>
              <Slider
                defaultValue={[brushSize]}
                max={300}
                min={5}
                step={1}
                onValueChange={(value) => setBrushSize(value[0])}
                className="py-1.5 [&>.relative>.absolute]:bg-purple-500 **:[[role=slider]]:border-purple-500 **:[[role=slider]]:bg-zinc-950 **:[[role=slider]]:ring-offset-zinc-950 **:[[role=slider]]:focus-visible:ring-purple-500"
              />
            </div>

            {/* Pen color when PEN tool is active */}
            {selectedTool === ToolType.PEN && (
              <div className="flex items-center gap-2 px-1 pt-1">
                <input
                  type="color"
                  value={penColor}
                  onChange={(e) => setPenColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer p-0.5 shrink-0"
                />
                <span className="text-[10px] font-mono text-zinc-400">{penColor}</span>
              </div>
            )}

            {/* Color Picker display + recent colors */}
            {selectedTool === ToolType.COLOR_PICKER && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2 px-1">
                  <div
                    className="w-5 h-5 rounded border border-zinc-700 shrink-0"
                    style={{ background: pickedColor ?? "transparent" }}
                  />
                  <span className="text-xs font-mono text-zinc-400">
                    {pickedColor ?? "Click image to pick"}
                  </span>
                </div>
                {recentColors.length > 0 && (
                  <div className="space-y-1 px-1">
                    <p className="text-[10px] text-zinc-600">Recent</p>
                    <div className="flex gap-1 flex-wrap">
                      {recentColors.map((c) => (
                        <div
                          key={c}
                          title={c}
                          className="w-5 h-5 rounded border border-zinc-700 cursor-pointer hover:scale-110 transition-transform"
                          style={{ background: c }}
                          onClick={() => {
                            useEditorStore.getState().setPenColor(c);
                            setSelectedTool(ToolType.PEN);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Transform Section */}
          <div className="space-y-2.5 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/30">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
              Transform
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={flipHorizontal}
                disabled={!image}
                title="Flip Horizontal"
                className="flex flex-col items-center gap-1 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <FlipHorizontal2 size={15} />
                <span className="text-[9px]">Flip H</span>
              </button>
              <button
                onClick={flipVertical}
                disabled={!image}
                title="Flip Vertical"
                className="flex flex-col items-center gap-1 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <FlipVertical2 size={15} />
                <span className="text-[9px]">Flip V</span>
              </button>
              <button
                onClick={rotateLeft}
                disabled={!image}
                title="Rotate 90° Left"
                className="flex flex-col items-center gap-1 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <RotateCcw size={15} />
                <span className="text-[9px]">Rot L</span>
              </button>
              <button
                onClick={rotateRight}
                disabled={!image}
                title="Rotate 90° Right"
                className="flex flex-col items-center gap-1 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50 hover:border-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <RotateCw size={15} />
                <span className="text-[9px]">Rot R</span>
              </button>
            </div>
          </div>

          {/* 3. Adjustments Section */}
          <div className="space-y-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/30">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
                Adjustments
              </h3>
              {hasAdjustmentChanges && (
                <button
                  onClick={resetAdjustments}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={10} />
                  Reset
                </button>
              )}
            </div>

            {/* Brightness */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                  <SunMedium size={11} className="text-zinc-500" />
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Brightness</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{adjustments.brightness}%</span>
              </div>
              <Slider
                value={[adjustments.brightness]}
                min={0} max={200} step={1}
                onValueChange={([v]) => setAdjustments({ brightness: v })}
                className="py-1 [&>.relative>.absolute]:bg-yellow-500/70 **:[[role=slider]]:border-yellow-500/70 **:[[role=slider]]:bg-zinc-950"
              />
            </div>

            {/* Contrast */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                  <Contrast size={11} className="text-zinc-500" />
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Contrast</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{adjustments.contrast}%</span>
              </div>
              <Slider
                value={[adjustments.contrast]}
                min={0} max={200} step={1}
                onValueChange={([v]) => setAdjustments({ contrast: v })}
                className="py-1 [&>.relative>.absolute]:bg-blue-500/70 **:[[role=slider]]:border-blue-500/70 **:[[role=slider]]:bg-zinc-950"
              />
            </div>

            {/* Saturation */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                  <Droplets size={11} className="text-zinc-500" />
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Saturation</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{adjustments.saturation}%</span>
              </div>
              <Slider
                value={[adjustments.saturation]}
                min={0} max={200} step={1}
                onValueChange={([v]) => setAdjustments({ saturation: v })}
                className="py-1 [&>.relative>.absolute]:bg-pink-500/70 **:[[role=slider]]:border-pink-500/70 **:[[role=slider]]:bg-zinc-950"
              />
            </div>

            <Button
              onClick={applyAdjustments}
              disabled={!image || !hasAdjustmentChanges || isLoading}
              size="sm"
              className="w-full h-8 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-0"
            >
              Apply Adjustments
            </Button>
          </div>

          {/* 4. Canvas Effects Section */}
          <div className="space-y-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/30">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
              Canvas Effects
            </h3>

            {/* Blur */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                  <Wind size={11} className="text-zinc-500" />
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Blur</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{canvasEffects.blur}px</span>
              </div>
              <Slider
                value={[canvasEffects.blur]}
                min={0} max={20} step={0.5}
                onValueChange={([v]) => setCanvasEffect({ blur: v })}
                className="py-1 [&>.relative>.absolute]:bg-sky-500/70 **:[[role=slider]]:border-sky-500/70 **:[[role=slider]]:bg-zinc-950"
              />
            </div>

            {/* Vignette */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                  <Aperture size={11} className="text-zinc-500" />
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Vignette</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{canvasEffects.vignette}%</span>
              </div>
              <Slider
                value={[canvasEffects.vignette]}
                min={0} max={100} step={1}
                onValueChange={([v]) => setCanvasEffect({ vignette: v })}
                className="py-1 [&>.relative>.absolute]:bg-violet-500/70 **:[[role=slider]]:border-violet-500/70 **:[[role=slider]]:bg-zinc-950"
              />
            </div>

            {/* Film Grain */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-1.5">
                  <Sparkle size={11} className="text-zinc-500" />
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Film Grain</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">{canvasEffects.grain}</span>
              </div>
              <Slider
                value={[canvasEffects.grain]}
                min={0} max={100} step={1}
                onValueChange={([v]) => setCanvasEffect({ grain: v })}
                className="py-1 [&>.relative>.absolute]:bg-amber-500/70 **:[[role=slider]]:border-amber-500/70 **:[[role=slider]]:bg-zinc-950"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <Button
                onClick={applyCanvasEffects}
                disabled={!image || !hasEffectChanges || isLoading}
                size="sm"
                className="h-8 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-0"
              >
                Apply Effects
              </Button>
              <Button
                onClick={applySharpen}
                disabled={!image || isLoading}
                size="sm"
                className="h-8 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-0"
              >
                Sharpen
              </Button>
            </div>
          </div>

          {/* 5. Text Overlay Section */}
          <div className="space-y-2.5 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/30">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
              <Type size={10} />
              Text Overlay
            </h3>
            <div className="flex gap-1.5">
              <Input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Enter text…"
                className="h-8 text-xs bg-zinc-800/60 border-zinc-700/50 text-zinc-200 placeholder:text-zinc-600 flex-1"
              />
              <Button
                size="sm"
                disabled={!image || !newText.trim()}
                onClick={() => {
                  addTextLayer(newText.trim());
                  setSelectedTool(ToolType.TEXT);
                }}
                className="h-8 w-8 p-0 bg-purple-600 hover:bg-purple-500 border-0 shrink-0"
              >
                <Plus size={14} />
              </Button>
            </div>
            <Button
              onClick={flattenTextLayers}
              disabled={!image || isLoading}
              variant="ghost"
              size="sm"
              className="w-full h-7 text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            >
              <Layers size={11} className="mr-1.5" />
              Flatten to Image
            </Button>
          </div>

          {/* 6. Stickers Section */}
          <StickerPanel />

          {/* 7. AI Options Section */}
          <div className="space-y-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/30">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
              AI Options
            </h3>

            <Accordion type="single" collapsible className="w-full" defaultValue="filters">
              {/* AI Editing Options */}
              <AccordionItem value="options" className="border-zinc-800/30">
                <AccordionTrigger className="text-zinc-300 hover:text-purple-400 hover:no-underline py-2.5 transition-colors text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    <span className="text-xs font-medium">Editing Options</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3 space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <GridItem icon={Delete} label="Remove BG" onClick={removeBackground} disabled={isLoading || !image} />
                    <GridItem icon={Sparkles} label="AI Enhance" onClick={enhanceImage} disabled={isLoading || !image} />
                    <GridItem icon={Smile} label="Face Enhance" onClick={enhanceFace} disabled={isLoading || !image} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Background Replace */}
              <AccordionItem value="bg-replace" className="border-zinc-800/30">
                <AccordionTrigger className="text-zinc-300 hover:text-purple-400 hover:no-underline py-2.5 transition-colors text-sm">
                  <div className="flex items-center gap-2">
                    <ImagePlus size={14} className="text-purple-400" />
                    <span className="text-xs font-medium">Replace Background</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3 space-y-2.5">
                  <p className="text-[10px] text-zinc-500 px-0.5">
                    Describe the new background scene.
                  </p>
                  <Input
                    value={bgScene}
                    onChange={(e) => setBgScene(e.target.value)}
                    placeholder="e.g. sunset beach, snowy mountains…"
                    className="h-8 text-xs bg-zinc-800/60 border-zinc-700/50 text-zinc-200 placeholder:text-zinc-600"
                  />
                  <Button
                    onClick={() => replaceBackground(bgScene)}
                    disabled={isLoading || !image || !bgScene.trim()}
                    size="sm"
                    className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-500 border-0"
                  >
                    <ImagePlus size={12} className="mr-1.5" />
                    Replace Background
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* AI Recolor */}
              <AccordionItem value="recolor" className="border-zinc-800/30">
                <AccordionTrigger className="text-zinc-300 hover:text-purple-400 hover:no-underline py-2.5 transition-colors text-sm">
                  <div className="flex items-center gap-2">
                    <Palette size={14} className="text-purple-400" />
                    <span className="text-xs font-medium">AI Recolor</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3 space-y-2.5">
                  <p className="text-[10px] text-zinc-500 px-0.5">
                    Paint a mask over the area, then pick a target color.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={recolorTarget}
                      onChange={(e) => setRecolorTarget(e.target.value)}
                      className="w-10 h-8 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer p-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono text-zinc-400">{recolorTarget}</div>
                    </div>
                  </div>
                  <Button
                    onClick={() => recolorArea(recolorTarget)}
                    disabled={isLoading || !image || !mask}
                    size="sm"
                    className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-500 border-0"
                  >
                    <Palette size={12} className="mr-1.5" />
                    Apply Recolor
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Image Blend */}
              <AccordionItem value="blend" className="border-zinc-800/30">
                <AccordionTrigger className="text-zinc-300 hover:text-purple-400 hover:no-underline py-2.5 transition-colors text-sm">
                  <div className="flex items-center gap-2">
                    <Blend size={14} className="text-purple-400" />
                    <span className="text-xs font-medium">Blend / Composite</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3 space-y-2.5">
                  <input
                    ref={blendInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBlendUpload}
                  />
                  {blendSource ? (
                    <div className="space-y-2">
                      <div className="relative rounded-lg overflow-hidden border border-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={blendSource} alt="Blend source" className="w-full h-24 object-cover" />
                        <button
                          onClick={() => setBlendSource(null)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-zinc-300 hover:text-white"
                        >
                          ×
                        </button>
                      </div>
                      <Input
                        value={blendPrompt}
                        onChange={(e) => setBlendPrompt(e.target.value)}
                        placeholder="Blend instruction (optional)…"
                        className="h-8 text-xs bg-zinc-800/60 border-zinc-700/50 text-zinc-200 placeholder:text-zinc-600"
                      />
                      <Button
                        onClick={() => applyBlend(blendPrompt)}
                        disabled={isLoading || !image}
                        size="sm"
                        className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-500 border-0"
                      >
                        <Blend size={12} className="mr-1.5" />
                        Apply Blend
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => blendInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="w-full h-9 text-xs border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 bg-transparent"
                    >
                      <Upload size={13} className="mr-1.5" />
                      Upload Second Image
                    </Button>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* AI Filters */}
              <AccordionItem value="filters" className="border-zinc-800/30">
                <AccordionTrigger className="text-zinc-300 hover:text-purple-400 hover:no-underline py-2.5 transition-colors text-sm">
                  <div className="flex items-center gap-2">
                    <ImageIcon size={14} className="text-purple-400" />
                    <span className="text-xs font-medium">Filters</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3">
                  <div className="grid grid-cols-2 gap-1.5">
                    {filters.map((item, index) => (
                      <GridItem
                        key={index}
                        image={item.image}
                        label={item.name}
                        desc={item.prompt}
                        onClick={() => applyFilter(item.prompt)}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* AI Expansion */}
              <AccordionItem value="expansion" className="border-none">
                <AccordionTrigger className="text-zinc-300 hover:text-purple-400 hover:no-underline py-2.5 transition-colors text-sm">
                  <div className="flex items-center gap-2">
                    <Maximize size={14} className="text-purple-400" />
                    <span className="text-xs font-medium">Expansion</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3">
                  <div className="grid grid-cols-2 gap-1.5">
                    {ratios.map((r) => (
                      <GridItem
                        key={r.label}
                        icon={r.icon}
                        label={r.label}
                        desc={r.desc}
                        onClick={() => applyExpansion(r.aspectRatio)}
                        disabled={false}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
};
