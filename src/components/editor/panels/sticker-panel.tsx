"use client";

import { useState } from "react";
import { STICKER_CATEGORIES } from "@/lib/constants";
import { ToolType } from "@/lib/constants";
import { useEditorStore } from "@/store/useEditorState";

export function StickerPanel() {
  const { addTextLayer, setSelectedTool, image } = useEditorStore();
  const categories = Object.keys(STICKER_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  const handleStickerClick = (emoji: string) => {
    addTextLayer(emoji, 0.5, 0.5, {
      fontSize: 64,
      fontFamily: "Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif",
      color: "#ffffff",
    });
    setSelectedTool(ToolType.TEXT);
  };

  return (
    <div className="space-y-2.5 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/30">
      <h3 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
        Stickers
      </h3>

      {/* Category tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full border transition-all ${
              activeCategory === cat
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                : "bg-zinc-800/60 border-zinc-700/50 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="grid grid-cols-4 gap-1">
        {STICKER_CATEGORIES[activeCategory]?.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleStickerClick(emoji)}
            disabled={!image}
            title={`Add ${emoji}`}
            className="text-2xl py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {emoji}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-zinc-600 px-1">
        Click to add · drag to reposition · double-click to remove
      </p>
    </div>
  );
}
