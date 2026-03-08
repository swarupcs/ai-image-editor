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
} from "lucide-react";

import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import GridItem from "@/components/grid-item";
import { filters, ratios, ToolType } from "@/lib/constants";
import { ToolButton } from "@/components//tool-button";
import { useEditorStore } from "@/store/useEditorState";

export const LeftSidebar = () => {
  const {
    applyFilter,
    isLoading,
    applyExpansion,
    removeBackground,
    enhanceImage,
    setSelectedTool,
    selectedTool,
    setBrushSize,
    brushSize,
    image,
  } = useEditorStore();

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
            </div>

            {/* Brush Size */}
            <div className="space-y-2.5 pt-1">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                  Size
                </span>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                  {brushSize}px
                </span>
              </div>

              <Slider
                defaultValue={[brushSize]}
                max={100}
                min={5}
                step={1}
                onValueChange={(value) => setBrushSize(value[0])}
                className="py-1.5 [&>.relative>.absolute]:bg-purple-500 **:[[role=slider]]:border-purple-500 **:[[role=slider]]:bg-zinc-950 **:[[role=slider]]:ring-offset-zinc-950 **:[[role=slider]]:focus-visible:ring-purple-500"
              />
            </div>
          </div>

          {/* 2. AI Options Section */}
          <div className="space-y-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/30">
            <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
              AI Options
            </h3>

            <Accordion
              type="single"
              collapsible
              className="w-full"
              defaultValue="filters"
            >
              {/* AI Editing Options */}
              <AccordionItem value="options" className="border-zinc-800/30">
                <AccordionTrigger className="text-zinc-300 hover:text-purple-400 hover:no-underline py-2.5 transition-colors text-sm">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-purple-400" />
                    <span className="text-xs font-medium">
                      Editing Options
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-3 space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <GridItem
                      icon={Delete}
                      label={"Remove BG"}
                      onClick={removeBackground}
                      disabled={isLoading || !image}
                    />
                    <GridItem
                      icon={Sparkles}
                      label={"AI Enhance"}
                      desc={""}
                      onClick={enhanceImage}
                      disabled={isLoading || !image}
                    />
                  </div>
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
