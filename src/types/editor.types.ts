import type { FileUIPart } from 'ai';
import type { ToolType } from '@/config/tools.config';
import type { Adjustments, CropRect, TextLayer } from './index';

// ── Canvas Effects ──────────────────────────────────────────────────────────
export type CanvasEffects = {
  blur: number;
  vignette: number;
  grain: number;
};

// ── Store Slice Interfaces ──────────────────────────────────────────────────

export type CoreSlice = {
  image: string | null;
  originalImage: string | null;
  mask: string | null;
  prompt: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
  userFiles: FileUIPart[];
  selectedTool: ToolType;
  brushSize: number;
  credits: number | null;
  apiKey: string | null;

  setMask: (mask: string) => void;
  setBrushSize: (size: number) => void;
  setUserFiles: (files: FileUIPart[]) => void;
  setHistory: (history: string[]) => void;
  setHistoryIndex: (index: number) => void;
  undo: () => void;
  redo: () => void;
  setLoading: (val: boolean) => void;
  setImage: (imageData: string) => void;
  setPrompt: (prompt: string) => void;
  setCredits: (credits: number) => void;
  setApiKey: (key: string | null) => void;
  fetchCredits: () => Promise<void>;
  setSelectedTool: (tool: ToolType) => void;
  resetEditor: () => void;
};

export type UISlice = {
  showHistory: boolean;
  showBeforeAfter: boolean;
  showShortcutsModal: boolean;
  showApiKeyModal: boolean;
  generatedVariations: string[] | null;
  blendSource: string | null;
  pickedColor: string | null;
  cropRect: CropRect | null;
  canvasEffects: CanvasEffects;
  adjustments: Adjustments;
  penColor: string;
  recentColors: string[];

  toggleHistory: () => void;
  toggleBeforeAfter: () => void;
  setShowShortcutsModal: (show: boolean) => void;
  setShowApiKeyModal: (show: boolean) => void;
  setGeneratedVariations: (variations: string[] | null) => void;
  setBlendSource: (img: string | null) => void;
  setPickedColor: (color: string | null) => void;
  setCropRect: (rect: CropRect | null) => void;
  setCanvasEffect: (effects: Partial<CanvasEffects>) => void;
  setAdjustments: (adj: Partial<Adjustments>) => void;
  resetAdjustments: () => void;
  setPenColor: (color: string) => void;
  addRecentColor: (color: string) => void;
};

export type CanvasSlice = {
  textLayers: TextLayer[];

  applyAdjustments: () => void;
  applyCrop: () => void;
  addTextLayer: (
    text: string,
    x?: number,
    y?: number,
    options?: { fontSize?: number; fontFamily?: string; color?: string },
  ) => void;
  updateTextLayer: (id: string, updates: Partial<TextLayer>) => void;
  removeTextLayer: (id: string) => void;
  flattenTextLayers: () => void;
  flipHorizontal: () => void;
  flipVertical: () => void;
  rotateLeft: () => void;
  rotateRight: () => void;
  applyCanvasEffects: () => void;
  applySharpen: () => void;
  commitCanvas: (imageData: string) => void;
};

export type AIActionsSlice = {
  generateEdit: () => Promise<void>;
  generateFromPrompt: () => Promise<void>;
  applyFilter: (prompt: string) => Promise<void>;
  applyExpansion: (aspectRatio: string) => Promise<void>;
  removeBackground: () => Promise<void>;
  enhanceImage: () => Promise<void>;
  enhanceFace: () => Promise<void>;
  applyBlend: (blendPrompt: string) => Promise<void>;
  saveCurrentImage: (title?: string) => Promise<string>;
  recolorArea: (targetColor: string) => Promise<void>;
  replaceBackground: (scene: string) => Promise<void>;
};

/** Composite type for the full Zustand store */
export type EditorState = CoreSlice & UISlice & CanvasSlice & AIActionsSlice;
