import type { Adjustments, CanvasEffects } from '@/types';
import type { BlankCanvasSize } from '@/types/config.types';
import type { EditorState } from '@/types/editor.types';

/** Default adjustments (100 = no change) */
export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

/** Default canvas effects (all zeroed) */
export const DEFAULT_CANVAS_EFFECTS: CanvasEffects = {
  blur: 0,
  vignette: 0,
  grain: 0,
};

/** Zoom limits */
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8;

/** Blank canvas size presets */
export const BLANK_SIZES: BlankCanvasSize[] = [
  { label: '512 × 512', w: 512, h: 512 },
  { label: '768 × 768', w: 768, h: 768 },
  { label: '1024 × 1024', w: 1024, h: 1024 },
  { label: '1280 × 720', w: 1280, h: 720 },
  { label: '1920 × 1080', w: 1920, h: 1080 },
];

/** Keys persisted to localStorage across reloads */
export const PERSISTED_KEYS: (keyof EditorState)[] = [
  'image',
  'originalImage',
  'history',
  'historyIndex',
  'prompt',
  'credits',
  'penColor',
  'recentColors',
  'adjustments',
  'canvasEffects',
  'apiKey',
];
