import { ToolType } from '@/lib/constants';
import { Adjustments, CropRect, TextLayer } from '@/types';
import { FileUIPart } from 'ai';
import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

type EditorState = {
  // Core image state
  image: string | null;
  originalImage: string | null;
  mask: string | null;
  prompt: string;
  history: string[];
  historyIndex: number;
  showHistory: boolean;
  isLoading: boolean;
  userFiles: FileUIPart[];
  selectedTool: ToolType;
  brushSize: number;
  credits: number | null;

  // Feature: Text Overlay
  textLayers: TextLayer[];

  // Feature: Adjustments
  adjustments: Adjustments;

  // Feature: Blend / Composite
  blendSource: string | null;

  // Feature: Color Picker
  pickedColor: string | null;

  // Feature: Before/After
  showBeforeAfter: boolean;

  // Feature: Crop
  cropRect: CropRect | null;

  // --- Setters ---
  setMask: (mask: string) => void;
  setBrushSize: (size: number) => void;
  setUserFiles: (files: FileUIPart[]) => void;
  setHistory: (history: string[]) => void;
  setHistoryIndex: (index: number) => void;
  undo: () => void;
  redo: () => void;
  toggleHistory: () => void;
  setLoading: (val: boolean) => void;
  setImage: (imageData: string) => void;
  setPrompt: (prompt: string) => void;
  setCredits: (credits: number) => void;
  fetchCredits: () => Promise<void>;
  setSelectedTool: (tool: ToolType) => void;
  setPickedColor: (color: string | null) => void;
  toggleBeforeAfter: () => void;
  setCropRect: (rect: CropRect | null) => void;
  setBlendSource: (img: string | null) => void;

  // --- AI Actions ---
  generateEdit: () => Promise<void>;
  generateFromPrompt: () => Promise<void>;
  applyFilter: (prompt: string) => Promise<void>;
  applyExpansion: (aspectRatio: string) => Promise<void>;
  removeBackground: () => Promise<void>;
  enhanceImage: () => Promise<void>;
  enhanceFace: () => Promise<void>;
  applyBlend: (blendPrompt: string) => Promise<void>;
  saveCurrentImage: (title?: string) => Promise<string>;

  // --- Local (no-credit) Actions ---
  applyAdjustments: () => void;
  resetAdjustments: () => void;
  setAdjustments: (adj: Partial<Adjustments>) => void;
  applyCrop: () => void;

  // --- Text Layer Actions ---
  addTextLayer: (text: string, x?: number, y?: number) => void;
  updateTextLayer: (id: string, updates: Partial<TextLayer>) => void;
  removeTextLayer: (id: string) => void;
  flattenTextLayers: () => void;
};

async function callEditImage(
  imageBase64: string,
  prompt: string,
  extra?: object
) {
  const res = await fetch('/api/edit-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, prompt, ...extra }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate');
  }
  return res.json() as Promise<{ result: string; credits: number }>;
}

function pushToHistory(
  state: { history: string[]; historyIndex: number },
  newImage: string
) {
  const base = state.history.slice(0, state.historyIndex + 1);
  return {
    image: newImage,
    history: [...base, newImage],
    historyIndex: base.length,
  };
}

export const useEditorStore = create<EditorState>()(
  devtools((set, get) => ({
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
    credits: null,
    textLayers: [],
    adjustments: { ...DEFAULT_ADJUSTMENTS },
    blendSource: null,
    pickedColor: null,
    showBeforeAfter: false,
    cropRect: null,

    // --- Setters ---
    setMask: (mask) => set({ mask }),
    setBrushSize: (size) => set({ brushSize: size }),
    setSelectedTool: (tool) => set({ selectedTool: tool }),
    setUserFiles: (files) => set({ userFiles: files }),
    setCredits: (credits) => set({ credits }),
    setPickedColor: (color) => set({ pickedColor: color }),
    toggleBeforeAfter: () => set((s) => ({ showBeforeAfter: !s.showBeforeAfter })),
    setCropRect: (rect) => set({ cropRect: rect }),
    setBlendSource: (img) => set({ blendSource: img }),
    setAdjustments: (adj) =>
      set((s) => ({ adjustments: { ...s.adjustments, ...adj } })),
    resetAdjustments: () => set({ adjustments: { ...DEFAULT_ADJUSTMENTS } }),
    setImage: (imageData) =>
      set((s) => ({
        image: imageData,
        originalImage: s.originalImage ?? imageData,
        history: [imageData],
        historyIndex: 0,
        textLayers: [],
        cropRect: null,
        adjustments: { ...DEFAULT_ADJUSTMENTS },
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
    toggleHistory: () => {
      const s = get();
      if (s.history.length) set({ showHistory: !s.showHistory });
    },
    setLoading: (val) => set({ isLoading: val }),
    setPrompt: (prompt) => set({ prompt }),

    fetchCredits: async () => {
      try {
        const res = await fetch('/api/credits');
        if (res.ok) {
          const data = await res.json();
          set({ credits: data.credits });
        }
      } catch { /* silent */ }
    },

    // --- AI Actions ---
    generateEdit: async () => {
      const state = get();
      set({ isLoading: true });
      const finalPrompt = `
    TASK: Professional Image In-painting / Generative Fill.
    ROLE: Expert Photo Retoucher.
    INPUT DATA EXPLANATION:
    - WHITE pixels in the mask = area to edit. BLACK pixels = preserve exactly.
    USER GOAL: "${state.prompt}"
    EXECUTION GUIDELINES:
    1. IF REMOVING: Perform Background Reconstruction. Seamlessly extend surrounding background over masked area.
    2. IF CHANGING: Generate new content strictly within white mask, matching scene lighting and perspective.
    3. SEAMLESS INTEGRATION: Match surrounding perspective, lighting, shadows, color grading.
    4. TEXTURE MATCHING: Replicate film grain, noise, sharpness. Transition at mask boundary must be invisible.
    5. STRICT ISOLATION: Do not modify pixels outside the white masked area.`;
      try {
        const data = await callEditImage(state.image!, finalPrompt, {
          userFiles: state.userFiles,
          maskBase64: state.mask,
        });
        if (data.credits !== undefined) set({ credits: data.credits });
        set({ ...pushToHistory(get(), data.result), isLoading: false });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    generateFromPrompt: async () => {
      const state = get();
      if (!state.prompt.trim()) return;
      set({ isLoading: true });
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: state.prompt }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Failed');
        const data = await res.json();
        if (data.credits !== undefined) set({ credits: data.credits });
        set({
          image: data.result,
          originalImage: data.result,
          history: [data.result],
          historyIndex: 0,
          isLoading: false,
          textLayers: [],
        });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    applyFilter: async (prompt) => {
      const state = get();
      set({ isLoading: true });
      const finalPrompt = `${prompt}
        TECHNICAL CONSTRAINTS:
        1. STRICTLY PRESERVE COMPOSITION: Do not change pose, camera angle, or object placement.
        2. Style transfer only — keep structure identical, only change texture/lighting/colors.`;
      try {
        const data = await callEditImage(state.image!, finalPrompt);
        if (data.credits !== undefined) set({ credits: data.credits });
        set({ ...pushToHistory(get(), data.result), isLoading: false });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    applyExpansion: async (aspectRatio) => {
      const state = get();
      if (!state.image) return;
      const finalPrompt = `High-fidelity outpainting. Seamlessly extend the scenery into empty areas. Person's face and features remain completely unchanged.
        Maintain continuity of lines, horizon, textures, lighting, perspective. Transition must be invisible.
        ${state.prompt ? `Additional context: ${state.prompt}` : ''}`;
      set({ isLoading: true });
      try {
        const data = await callEditImage(state.image, finalPrompt, { aspectRatio });
        if (data.credits !== undefined) set({ credits: data.credits });
        set({ ...pushToHistory(get(), data.result), isLoading: false });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    removeBackground: async () => {
      const state = get();
      if (!state.image) return;
      set({ isLoading: true });
      const prompt = `Remove the background from this image completely. Replace with clean solid white background. Keep only the main subject perfectly intact with clean, precise edges.`;
      try {
        const data = await callEditImage(state.image, prompt);
        if (data.credits !== undefined) set({ credits: data.credits });
        set({ ...pushToHistory(get(), data.result), isLoading: false });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    enhanceImage: async () => {
      const state = get();
      if (!state.image) return;
      set({ isLoading: true });
      const prompt = `Enhance and upscale this image: improve sharpness, clarity, fine detail. Reconstruct high-frequency textures. Remove noise, compression artifacts, blur. Improve color vibrancy and dynamic range while maintaining natural look. No compositional changes.`;
      try {
        const data = await callEditImage(state.image, prompt);
        if (data.credits !== undefined) set({ credits: data.credits });
        set({ ...pushToHistory(get(), data.result), isLoading: false });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    enhanceFace: async () => {
      const state = get();
      if (!state.image) return;
      set({ isLoading: true });
      const prompt = `Enhance the face(s) in this portrait photo: smooth skin texture while keeping natural pores, reduce blemishes, brighten and sharpen eyes, enhance eyelashes, slightly whiten teeth if visible, reduce under-eye shadows, improve overall skin tone evenness. Keep all facial features, expressions, and identity exactly the same. Do not alter background, hair, or clothing.`;
      try {
        const data = await callEditImage(state.image, prompt);
        if (data.credits !== undefined) set({ credits: data.credits });
        set({ ...pushToHistory(get(), data.result), isLoading: false });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    applyBlend: async (blendPrompt) => {
      const state = get();
      if (!state.image || !state.blendSource) return;
      set({ isLoading: true });
      const prompt = blendPrompt || `Seamlessly blend and composite these two images together. Merge subjects naturally with matching lighting, perspective and color grading. The result should look like a single cohesive photograph.`;
      try {
        const data = await callEditImage(state.image, prompt, {
          userFiles: [{ type: 'file', url: state.blendSource, mediaType: 'image/png', filename: 'blend-source.png' }],
        });
        if (data.credits !== undefined) set({ credits: data.credits });
        set({ ...pushToHistory(get(), data.result), isLoading: false, blendSource: null });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    saveCurrentImage: async (title) => {
      const state = get();
      if (!state.image) throw new Error('No image to save');
      const res = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: state.image,
          prompt: state.prompt || undefined,
          title: title || state.prompt?.slice(0, 80) || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to save image');
      return (await res.json()).id as string;
    },

    // --- Local (no-credit) Actions ---
    applyAdjustments: () => {
      const state = get();
      if (!state.image) return;
      const { brightness, contrast, saturation } = state.adjustments;
      if (brightness === 100 && contrast === 100 && saturation === 100) return;

      const img = new window.Image();
      img.src = state.image;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
        ctx.drawImage(img, 0, 0);
        const newImg = canvas.toDataURL('image/png');
        set({
          ...pushToHistory(get(), newImg),
          adjustments: { ...DEFAULT_ADJUSTMENTS },
        });
      };
    },

    applyCrop: () => {
      const state = get();
      if (!state.image || !state.cropRect) return;
      const { x, y, width, height } = state.cropRect;
      if (width <= 0 || height <= 0) return;

      const img = new window.Image();
      img.src = state.image;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, Math.round(x), Math.round(y), Math.round(width), Math.round(height), 0, 0, Math.round(width), Math.round(height));
        const newImg = canvas.toDataURL('image/png');
        set({
          ...pushToHistory(get(), newImg),
          cropRect: null,
          selectedTool: ToolType.MOVE,
        });
      };
    },

    // --- Text Layer Actions ---
    addTextLayer: (text, x = 0.5, y = 0.5) => {
      set((s) => ({
        textLayers: [
          ...s.textLayers,
          {
            id: nanoid(),
            text,
            x,
            y,
            fontSize: 32,
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
          },
        ],
      }));
    },

    updateTextLayer: (id, updates) => {
      set((s) => ({
        textLayers: s.textLayers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
      }));
    },

    removeTextLayer: (id) => {
      set((s) => ({ textLayers: s.textLayers.filter((l) => l.id !== id) }));
    },

    flattenTextLayers: () => {
      const state = get();
      if (!state.image || state.textLayers.length === 0) return;

      const img = new window.Image();
      img.src = state.image;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);

        for (const layer of state.textLayers) {
          ctx.save();
          ctx.font = `bold ${layer.fontSize}px ${layer.fontFamily}`;
          ctx.fillStyle = layer.color;
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.6)';
          ctx.shadowBlur = 4;
          ctx.fillText(layer.text, layer.x * canvas.width, layer.y * canvas.height);
          ctx.restore();
        }

        const newImg = canvas.toDataURL('image/png');
        set({ ...pushToHistory(get(), newImg), textLayers: [] });
      };
    },
  }))
);
