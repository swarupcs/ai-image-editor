"use client";
import Image from "next/image";
import { Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEditorStore } from "@/store/useEditorState";

export const RightSidebar = () => {
  const {
    history,
    setHistory,
    historyIndex,
    setHistoryIndex,
  } = useEditorStore();

  const clearHistory = () => {
    if (history.length > 0) {
      const currentImage = history[historyIndex];
      setHistory([currentImage]);
      setHistoryIndex(0);
    }
  };

  return (
    <aside className="flex h-full w-44 flex-col shrink-0 border-l border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl z-20 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-zinc-800/30">
        <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          History
        </h3>
      </div>

      <div className="flex-1 min-h-0 w-full">
        <ScrollArea className="h-full w-full">
          <div className="flex flex-col gap-2 p-2.5">
            {history.length === 0 && (
              <div className="text-center py-10">
                <span className="text-xs text-zinc-600">No history yet</span>
              </div>
            )}

            {history.map((imgState, idx) => {
              const isActive = historyIndex === idx;

              return (
                <div className="relative group" key={idx}>
                  <button
                    onClick={() => setHistoryIndex(idx)}
                    className={cn(
                      "relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200",
                      isActive
                        ? "border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                        : "border-zinc-800/50 hover:border-zinc-600 opacity-50 hover:opacity-100",
                    )}
                  >
                    <Image
                      width={500}
                      height={500}
                      src={imgState}
                      alt={`Version ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {isActive && (
                      <div className="absolute inset-0 bg-purple-500/5 pointer-events-none" />
                    )}
                  </button>

                  <div
                    className={cn(
                      "absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-md text-[9px] font-bold shadow-md z-10 pointer-events-none",
                      isActive
                        ? "bg-purple-500 text-white"
                        : "bg-zinc-900/80 text-zinc-500 border border-zinc-700/50 backdrop-blur-sm",
                    )}
                  >
                    {idx + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-zinc-800/30 shrink-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg h-8"
                onClick={clearHistory}
                disabled={history.length <= 1}
              >
                <Trash2 size={12} className="mr-1.5" />
                <span className="text-[10px]">Clear History</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              <p>Clear all except current</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
};
