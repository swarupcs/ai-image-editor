/**
 * UI state slice.
 * Manages transient UI state: panels, modals, adjustments, effects, pen color, etc.
 */
import type { StateCreator } from 'zustand';
import type { EditorState, UISlice } from '@/types/editor.types';
import { DEFAULT_ADJUSTMENTS, DEFAULT_CANVAS_EFFECTS } from '@/config/editor.config';

export const createUISlice: StateCreator<EditorState, [], [], UISlice> = (
  set,
) => ({
  showHistory: false,
  showBeforeAfter: false,
  showShortcutsModal: false,
  showApiKeyModal: false,
  generatedVariations: null,
  blendSource: null,
  pickedColor: null,
  cropRect: null,
  canvasEffects: { ...DEFAULT_CANVAS_EFFECTS },
  adjustments: { ...DEFAULT_ADJUSTMENTS },
  penColor: '#e74c3c',
  recentColors: [],

  toggleHistory: () => set((s) => {
    if (s.history.length) return { showHistory: !s.showHistory };
    return {};
  }),
  toggleBeforeAfter: () => set((s) => ({ showBeforeAfter: !s.showBeforeAfter })),
  setShowShortcutsModal: (show) => set({ showShortcutsModal: show }),
  setShowApiKeyModal: (show) => set({ showApiKeyModal: show }),
  setGeneratedVariations: (variations) => set({ generatedVariations: variations }),
  setBlendSource: (img) => set({ blendSource: img }),
  setPickedColor: (color) => {
    set({ pickedColor: color });
    if (color) {
      set((s) => ({
        recentColors: [color, ...s.recentColors.filter((c) => c !== color)].slice(0, 8),
      }));
    }
  },
  setCropRect: (rect) => set({ cropRect: rect }),
  setCanvasEffect: (effects) => set((s) => ({ canvasEffects: { ...s.canvasEffects, ...effects } })),
  setAdjustments: (adj) => set((s) => ({ adjustments: { ...s.adjustments, ...adj } })),
  resetAdjustments: () => set({ adjustments: { ...DEFAULT_ADJUSTMENTS } }),
  setPenColor: (color) => set({ penColor: color }),
  addRecentColor: (color) => {
    set((s) => ({
      recentColors: [color, ...s.recentColors.filter((c) => c !== color)].slice(0, 8),
    }));
  },
});
