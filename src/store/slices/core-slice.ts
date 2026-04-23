/**
 * Core editor state slice.
 * Manages image, mask, prompt, history, undo/redo, loading, tool selection, and credits.
 */
import type { StateCreator } from 'zustand';
import type { EditorState, CoreSlice } from '@/types/editor.types';
import { ToolType } from '@/config/tools.config';
import { DEFAULT_ADJUSTMENTS, DEFAULT_CANVAS_EFFECTS } from '@/config/editor.config';
import { fetchUserCredits } from '@/lib/services/api.service';
import { toast } from 'sonner';

export function pushToHistory(
  state: { history: string[]; historyIndex: number },
  newImage: string,
) {
  const base = state.history.slice(0, state.historyIndex + 1);
  return {
    image: newImage,
    history: [...base, newImage],
    historyIndex: base.length,
  };
}

export const createCoreSlice: StateCreator<EditorState, [], [], CoreSlice> = (
  set,
  get,
) => ({
  image: null,
  originalImage: null,
  mask: null,
  prompt: '',
  history: [],
  historyIndex: 0,
  isLoading: false,
  userFiles: [],
  selectedTool: ToolType.MOVE,
  brushSize: 100,
  credits: null,
  apiKey: null,

  setMask: (mask) => set({ mask }),
  setBrushSize: (size) => set({ brushSize: size }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setUserFiles: (files) => set({ userFiles: files }),
  setCredits: (credits) => set({ credits }),
  setApiKey: (key) => set({ apiKey: key }),
  setLoading: (val) => set({ isLoading: val }),
  setPrompt: (prompt) => set({ prompt }),

  setImage: (imageData) =>
    set(() => ({
      image: imageData,
      originalImage: imageData,
      history: [imageData],
      historyIndex: 0,
      textLayers: [],
      cropRect: null,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      canvasEffects: { ...DEFAULT_CANVAS_EFFECTS },
      generatedVariations: null,
    })),

  setHistory: (history) => set({ history }),
  setHistoryIndex: (index) => {
    const state = get();
    set({ historyIndex: index, image: state.history[index] });
  },

  undo: () => {
    const s = get();
    if (s.historyIndex > 0) {
      const i = s.historyIndex - 1;
      set({ image: s.history[i], historyIndex: i });
    }
  },

  redo: () => {
    const s = get();
    if (s.historyIndex < s.history.length - 1) {
      const i = s.historyIndex + 1;
      set({ image: s.history[i], historyIndex: i });
    }
  },

  fetchCredits: async () => {
    try {
      const data = await fetchUserCredits();
      set({ credits: data.credits });
    } catch {
      /* silent */
    }
  },

  resetEditor: () => {
    set({
      image: null,
      originalImage: null,
      mask: null,
      prompt: '',
      history: [],
      historyIndex: 0,
      showHistory: false,
      isLoading: false,
      userFiles: [],
      selectedTool: ToolType.MOVE,
      brushSize: 100,
      textLayers: [],
      adjustments: { ...DEFAULT_ADJUSTMENTS },
      blendSource: null,
      pickedColor: null,
      showBeforeAfter: false,
      cropRect: null,
      canvasEffects: { ...DEFAULT_CANVAS_EFFECTS },
      generatedVariations: null,
    });
    toast.success('Session reset - ready for new image');
  },
});
