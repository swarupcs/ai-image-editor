"use client";

import { useEffect } from "react";
import { ToolType } from "@/lib/constants";
import { useEditorStore } from "@/store/useEditorState";

const TOOL_KEYS: Record<string, ToolType> = {
  m: ToolType.MOVE,
  b: ToolType.BRUSH,
  e: ToolType.ERASER,
  c: ToolType.CROP,
  t: ToolType.TEXT,
  p: ToolType.COLOR_PICKER,
  w: ToolType.SMART_REMOVE,
};

export function useKeyboardShortcuts() {
  const { setSelectedTool, setBrushSize, undo, redo, setShowShortcutsModal } = useEditorStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip when typing in an input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      )
        return;

      // ? key opens shortcuts modal
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcutsModal(true);
        return;
      }

      // Skip Space (handled inside image-editor for panning)
      if (e.code === "Space") return;

      // Ctrl / Meta shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
        return;
      }

      const key = e.key.toLowerCase();

      // Tool shortcuts
      if (key in TOOL_KEYS) {
        e.preventDefault();
        setSelectedTool(TOOL_KEYS[key]);
        return;
      }

      // Escape → Move tool
      if (e.key === "Escape") {
        setSelectedTool(ToolType.MOVE);
        return;
      }

      // Brush size: [ and ]
      if (e.key === "[") {
        setBrushSize(Math.max(5, useEditorStore.getState().brushSize - 10));
        return;
      }
      if (e.key === "]") {
        setBrushSize(Math.min(300, useEditorStore.getState().brushSize + 10));
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSelectedTool, setBrushSize, undo, redo, setShowShortcutsModal]);
}
