import { ToolType } from '@/lib/constants';
import { Adjustments, CropRect, TextLayer } from '@/types';
import { FileUIPart } from 'ai';
import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';

const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
};

type EditorState = {
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
  textLayers: TextLayer[];
  adjustments: Adjustments;
  blendSource: string | null;
  pickedColor: string | null;
  showBeforeAfter: boolean;
  cropRect: CropRect | null;
  canvasEffects: { blur: number; vignette: number; grain: number };
  penColor: string;
  recentColors: string[];
  showShortcutsModal: boolean;
  generatedVariations: string[] | null;

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
  setAdjustments: (adj: Partial<Adjustments>) => void;
  resetAdjustments: () => void;
  generateEdit: () => Promise<void>;
  generateFromPrompt: () => Promise<void>;
  setGeneratedVariations: (variations: string[] | null) => void;
  applyFilter: (prompt: string) => Promise<void>;

  applyExpansion: (aspectRatio: string) => Promise<void>;
  removeBackground: () => Promise<void>;
  enhanceImage: () => Promise<void>;
  enhanceFace: () => Promise<void>;
  applyBlend: (blendPrompt: string) => Promise<void>;
  saveCurrentImage: (title?: string) => Promise<string>;
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
  setCanvasEffect: (
    effects: Partial<{ blur: number; vignette: number; grain: number }>,
  ) => void;
  applyCanvasEffects: () => void;
  applySharpen: () => void;
  recolorArea: (targetColor: string) => Promise<void>;
  setPenColor: (color: string) => void;
  commitCanvas: (imageData: string) => void;
  addRecentColor: (color: string) => void;
  setShowShortcutsModal: (show: boolean) => void;
  replaceBackground: (scene: string) => Promise<void>;
  resetEditor: () => void;
};

// Keys persisted to localStorage across reloads
const PERSISTED_KEYS: (keyof EditorState)[] = [
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
];

// Safe localStorage adapter — swallows quota errors and large payloads silently
const safeStorage = createJSONStorage(() => ({
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      // Skip writes larger than 30 MB to avoid quota errors on large undo stacks
      if (value.length > 30_000_000) return;
      localStorage.setItem(key, value);
    } catch {
      // QuotaExceededError — silently ignore
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
}));

function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

async function resizeImageIfNeeded(dataurl: string, maxSizeMB: number = 4.5): Promise<string> {
  const blob = dataURLtoBlob(dataurl);
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (blob.size <= maxBytes) return dataurl;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataurl);

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Try WebP compression first to preserve dimensions
      let newDataUrl = canvas.toDataURL('image/webp', 0.9);
      let newBlob = dataURLtoBlob(newDataUrl);

      if (newBlob.size <= maxBytes) {
        return resolve(newDataUrl);
      }

      // If still too big, scale down dimensions
      let scale = Math.sqrt(maxBytes / newBlob.size) * 0.95;

      const attemptResize = () => {
        canvas.width = Math.floor(img.width * scale);
        canvas.height = Math.floor(img.height * scale);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        newDataUrl = canvas.toDataURL('image/webp', 0.9);
        newBlob = dataURLtoBlob(newDataUrl);
        
        if (newBlob.size <= maxBytes) {
          resolve(newDataUrl);
        } else {
          scale *= 0.9;
          if (scale < 0.1) return resolve(newDataUrl);
          attemptResize();
        }
      };
      attemptResize();
    };
    img.onerror = () => resolve(dataurl);
    img.src = dataurl;
  });
}

async function callEditImage(
  imageBase64: string,
  prompt: string,
  extra?: Record<string, unknown>,
) {
  const formData = new FormData();
  
  const resizedImageBase64 = await resizeImageIfNeeded(imageBase64);
  const imageMime = resizedImageBase64.match(/:(.*?);/)?.[1] || 'image/png';
  const imageExt = imageMime.split('/')[1] || 'png';
  formData.append('image', dataURLtoBlob(resizedImageBase64), `image.${imageExt}`);
  
  formData.append('prompt', prompt);

  if (extra) {
    if (extra.isFilter) {
      formData.append('isFilter', 'true');
    }
    if (extra.maskBase64) {
      const resizedMaskBase64 = await resizeImageIfNeeded(extra.maskBase64 as string);
      const maskMime = resizedMaskBase64.match(/:(.*?);/)?.[1] || 'image/png';
      const maskExt = maskMime.split('/')[1] || 'png';
      formData.append('mask', dataURLtoBlob(resizedMaskBase64), `mask.${maskExt}`);
    }
    if (extra.aspectRatio) {
      formData.append('aspectRatio', String(extra.aspectRatio));
    }
    if (extra.userFiles && Array.isArray(extra.userFiles)) {
      for (let i = 0; i < extra.userFiles.length; i++) {
        const filePart = extra.userFiles[i];
        if (filePart.url) {
          const resizedUrl = await resizeImageIfNeeded(filePart.url);
          const urlMime = resizedUrl.match(/:(.*?);/)?.[1] || 'image/png';
          const urlExt = urlMime.split('/')[1] || 'png';
          formData.append('userFiles', dataURLtoBlob(resizedUrl), `userFile-${i}.${urlExt}`);
        }
      }
    }
  }

  const res = await fetch('/api/edit-image', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to generate');
  }
  return res.json() as Promise<{ result: string; credits: number }>;
}

function pushToHistory(
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

export const useEditorStore = create<EditorState>()(
  devtools(
    persist(
      (set, get) => ({
        // ── Initial state ────────────────────────────────────────────────
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
        canvasEffects: { blur: 0, vignette: 0, grain: 0 },
        penColor: '#e74c3c',
        recentColors: [],
        showShortcutsModal: false,
        generatedVariations: null,

        // ── Setters ──────────────────────────────────────────────────────
        setMask: (mask) => set({ mask }),
        setBrushSize: (size) => set({ brushSize: size }),
        setSelectedTool: (tool) => set({ selectedTool: tool }),
        setUserFiles: (files) => set({ userFiles: files }),
        setCredits: (credits) => set({ credits }),
        setGeneratedVariations: (variations) => set({ generatedVariations: variations }),
        setPickedColor: (color) => {
          set({ pickedColor: color });
          if (color) {
            set((s) => ({
              recentColors: [
                color,
                ...s.recentColors.filter((c) => c !== color),
              ].slice(0, 8),
            }));
          }
        },
        toggleBeforeAfter: () =>
          set((s) => ({ showBeforeAfter: !s.showBeforeAfter })),
        setCropRect: (rect) => set({ cropRect: rect }),
        setBlendSource: (img) => set({ blendSource: img }),
        setAdjustments: (adj) =>
          set((s) => ({ adjustments: { ...s.adjustments, ...adj } })),
        resetAdjustments: () =>
          set({ adjustments: { ...DEFAULT_ADJUSTMENTS } }),
        setImage: (imageData) =>
          set(() => ({
            image: imageData,
            originalImage: imageData,
            history: [imageData],
            historyIndex: 0,
            textLayers: [],
            cropRect: null,
            adjustments: { ...DEFAULT_ADJUSTMENTS },
            canvasEffects: { blur: 0, vignette: 0, grain: 0 },
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
          } catch {
            /* silent */
          }
        },

        // ── Reset Editor (New Session) ───────────────────────────────────
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
            canvasEffects: { blur: 0, vignette: 0, grain: 0 },
            generatedVariations: null,
          });
          toast.success('Session reset - ready for new image');
        },

        // ── AI Actions ───────────────────────────────────────────────────
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
            toast.success('Edit applied!');
          } catch (err) {
            set({ isLoading: false });
            toast.error(err instanceof Error ? err.message : 'Edit failed');
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
            
            if (data.results && data.results.length > 1) {
              set({
                generatedVariations: data.results,
                isLoading: false,
              });
              toast.success('Variations generated! Please select one.');
            } else {
              const result = data.results ? data.results[0] : data.result;
              set({
                image: result,
                originalImage: result,
                history: [result],
                historyIndex: 0,
                isLoading: false,
                textLayers: [],
              });
              toast.success('Image generated!');
            }
          } catch (err) {
            set({ isLoading: false });
            toast.error(
              err instanceof Error ? err.message : 'Generation failed',
            );
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
            const data = await callEditImage(state.image!, finalPrompt, { isFilter: 'true' });
            if (data.credits !== undefined) set({ credits: data.credits });
            set({ ...pushToHistory(get(), data.result), isLoading: false });
            toast.success('Filter applied!');
          } catch (err) {
            set({ isLoading: false });
            toast.error(err instanceof Error ? err.message : 'Filter failed');
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
            const data = await callEditImage(state.image, finalPrompt, {
              aspectRatio,
            });
            if (data.credits !== undefined) set({ credits: data.credits });
            set({ ...pushToHistory(get(), data.result), isLoading: false });
            toast.success('Canvas expanded!');
          } catch (err) {
            set({ isLoading: false });
            toast.error(
              err instanceof Error ? err.message : 'Expansion failed',
            );
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
            toast.success('Background removed!');
          } catch (err) {
            set({ isLoading: false });
            toast.error(err instanceof Error ? err.message : 'Failed');
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
            toast.success('Image enhanced!');
          } catch (err) {
            set({ isLoading: false });
            toast.error(
              err instanceof Error ? err.message : 'Enhancement failed',
            );
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
            toast.success('Face enhanced!');
          } catch (err) {
            set({ isLoading: false });
            toast.error(
              err instanceof Error ? err.message : 'Face enhancement failed',
            );
            throw err;
          }
        },

        applyBlend: async (blendPrompt) => {
          const state = get();
          if (!state.image || !state.blendSource) return;
          set({ isLoading: true });
          const prompt =
            blendPrompt ||
            `Seamlessly blend and composite these two images together. Merge subjects naturally with matching lighting, perspective and color grading. The result should look like a single cohesive photograph.`;
          try {
            const data = await callEditImage(state.image, prompt, {
              userFiles: [
                {
                  type: 'file',
                  url: state.blendSource,
                  mediaType: 'image/png',
                  filename: 'blend-source.png',
                },
              ],
            });
            if (data.credits !== undefined) set({ credits: data.credits });
            set({
              ...pushToHistory(get(), data.result),
              isLoading: false,
              blendSource: null,
            });
            toast.success('Blend applied!');
          } catch (err) {
            set({ isLoading: false });
            toast.error(err instanceof Error ? err.message : 'Blend failed');
            throw err;
          }
        },

        saveCurrentImage: async (title) => {
          const state = get();
          if (!state.image) throw new Error('No image to save');
          
          const formData = new FormData();
          const resizedImageBase64 = await resizeImageIfNeeded(state.image);
          const imageMime = resizedImageBase64.match(/:(.*?);/)?.[1] || 'image/png';
          const imageExt = imageMime.split('/')[1] || 'png';
          formData.append('image', dataURLtoBlob(resizedImageBase64), `image.${imageExt}`);
          
          if (state.prompt) {
            formData.append('prompt', state.prompt);
          }
          const finalTitle = title || state.prompt?.slice(0, 80);
          if (finalTitle) {
            formData.append('title', finalTitle);
          }

          const res = await fetch('/api/images', {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error('Failed to save image');
          return (await res.json()).id as string;
        },

        // ── Local canvas actions (no credits) ────────────────────────────
        applyAdjustments: () => {
          const state = get();
          if (!state.image) return;
          const { brightness, contrast, saturation } = state.adjustments;
          if (brightness === 100 && contrast === 100 && saturation === 100)
            return;
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
            ctx.drawImage(
              img,
              Math.round(x),
              Math.round(y),
              Math.round(width),
              Math.round(height),
              0,
              0,
              Math.round(width),
              Math.round(height),
            );
            const newImg = canvas.toDataURL('image/png');
            set({
              ...pushToHistory(get(), newImg),
              cropRect: null,
              selectedTool: ToolType.MOVE,
            });
          };
        },

        // ── Text layers ──────────────────────────────────────────────────
        addTextLayer: (text, x = 0.5, y = 0.5, options) => {
          set((s) => ({
            textLayers: [
              ...s.textLayers,
              {
                id: nanoid(),
                text,
                x,
                y,
                fontSize: options?.fontSize ?? 32,
                color: options?.color ?? '#ffffff',
                fontFamily: options?.fontFamily ?? 'Inter, sans-serif',
              },
            ],
          }));
        },

        updateTextLayer: (id, updates) => {
          set((s) => ({
            textLayers: s.textLayers.map((l) =>
              l.id === id ? { ...l, ...updates } : l,
            ),
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
              ctx.fillText(
                layer.text,
                layer.x * canvas.width,
                layer.y * canvas.height,
              );
              ctx.restore();
            }
            const newImg = canvas.toDataURL('image/png');
            set({ ...pushToHistory(get(), newImg), textLayers: [] });
          };
        },

        // ── Flip & Rotate ────────────────────────────────────────────────
        flipHorizontal: () => {
          const { image } = get();
          if (!image) return;
          const img = new window.Image();
          img.src = image;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(img, 0, 0);
            set({ ...pushToHistory(get(), canvas.toDataURL('image/png')) });
          };
        },

        flipVertical: () => {
          const { image } = get();
          if (!image) return;
          const img = new window.Image();
          img.src = image;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.translate(0, canvas.height);
            ctx.scale(1, -1);
            ctx.drawImage(img, 0, 0);
            set({ ...pushToHistory(get(), canvas.toDataURL('image/png')) });
          };
        },

        rotateLeft: () => {
          const { image } = get();
          if (!image) return;
          const img = new window.Image();
          img.src = image;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalHeight;
            canvas.height = img.naturalWidth;
            const ctx = canvas.getContext('2d')!;
            ctx.translate(0, canvas.height);
            ctx.rotate(-Math.PI / 2);
            ctx.drawImage(img, 0, 0);
            set({ ...pushToHistory(get(), canvas.toDataURL('image/png')) });
          };
        },

        rotateRight: () => {
          const { image } = get();
          if (!image) return;
          const img = new window.Image();
          img.src = image;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalHeight;
            canvas.height = img.naturalWidth;
            const ctx = canvas.getContext('2d')!;
            ctx.translate(canvas.width, 0);
            ctx.rotate(Math.PI / 2);
            ctx.drawImage(img, 0, 0);
            set({ ...pushToHistory(get(), canvas.toDataURL('image/png')) });
          };
        },

        // ── Canvas Effects ───────────────────────────────────────────────
        setCanvasEffect: (effects) =>
          set((s) => ({ canvasEffects: { ...s.canvasEffects, ...effects } })),

        applyCanvasEffects: () => {
          const state = get();
          if (!state.image) return;
          const { blur, vignette, grain } = state.canvasEffects;
          if (blur === 0 && vignette === 0 && grain === 0) return;
          const img = new window.Image();
          img.src = state.image;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            if (blur > 0) ctx.filter = `blur(${blur}px)`;
            ctx.drawImage(img, 0, 0);
            ctx.filter = 'none';
            if (grain > 0) {
              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
              );
              const d = imageData.data;
              for (let i = 0; i < d.length; i += 4) {
                const n = (Math.random() - 0.5) * grain * 2;
                d[i] = Math.max(0, Math.min(255, d[i] + n));
                d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
                d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
              }
              ctx.putImageData(imageData, 0, 0);
            }
            if (vignette > 0) {
              const g = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                canvas.width * 0.25,
                canvas.width / 2,
                canvas.height / 2,
                canvas.width * 0.75,
              );
              g.addColorStop(0, 'rgba(0,0,0,0)');
              g.addColorStop(1, `rgba(0,0,0,${vignette / 100})`);
              ctx.fillStyle = g;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            set({
              ...pushToHistory(get(), canvas.toDataURL('image/png')),
              canvasEffects: { blur: 0, vignette: 0, grain: 0 },
            });
          };
        },

        applySharpen: () => {
          const { image } = get();
          if (!image) return;
          const img = new window.Image();
          img.src = image;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const w = canvas.width;
            const h = canvas.height;
            const src = ctx.getImageData(0, 0, w, h);
            const s = src.data;
            const out = new Uint8ClampedArray(s.length);
            const k = [0, -1, 0, -1, 5, -1, 0, -1, 0];
            for (let y = 1; y < h - 1; y++) {
              for (let x = 1; x < w - 1; x++) {
                for (let c = 0; c < 3; c++) {
                  let v = 0;
                  for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                      v +=
                        s[((y + ky) * w + (x + kx)) * 4 + c] *
                        k[(ky + 1) * 3 + (kx + 1)];
                    }
                  }
                  out[(y * w + x) * 4 + c] = Math.max(0, Math.min(255, v));
                }
                out[(y * w + x) * 4 + 3] = s[(y * w + x) * 4 + 3];
              }
            }
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                if (y === 0 || y === h - 1 || x === 0 || x === w - 1) {
                  for (let c = 0; c < 4; c++)
                    out[(y * w + x) * 4 + c] = s[(y * w + x) * 4 + c];
                }
              }
            }
            ctx.putImageData(new ImageData(out, w, h), 0, 0);
            set({ ...pushToHistory(get(), canvas.toDataURL('image/png')) });
          };
        },

        // ── AI Recolor ───────────────────────────────────────────────────
        recolorArea: async (targetColor) => {
          const state = get();
          if (!state.image) return;
          set({ isLoading: true });
          const prompt = `Recolor only the masked white area to exactly ${targetColor}. Maintain all existing textures, material properties, lighting direction, shadows, and highlights. Only change the hue and saturation. The result must look photorealistic and seamlessly integrated.`;
          try {
            const data = await callEditImage(state.image, prompt, {
              maskBase64: state.mask,
            });
            if (data.credits !== undefined) set({ credits: data.credits });
            set({ ...pushToHistory(get(), data.result), isLoading: false });
            toast.success('Recolor applied!');
          } catch (err) {
            set({ isLoading: false });
            toast.error(err instanceof Error ? err.message : 'Recolor failed');
            throw err;
          }
        },

        // ── Pen / Drawing ────────────────────────────────────────────────
        setPenColor: (color) => set({ penColor: color }),
        commitCanvas: (imageData) =>
          set({ ...pushToHistory(get(), imageData) }),

        // ── Recent Colors ────────────────────────────────────────────────
        addRecentColor: (color) => {
          set((s) => ({
            recentColors: [
              color,
              ...s.recentColors.filter((c) => c !== color),
            ].slice(0, 8),
          }));
        },

        // ── Shortcuts Modal ──────────────────────────────────────────────
        setShowShortcutsModal: (show) => set({ showShortcutsModal: show }),

        // ── AI Background Replacement ────────────────────────────────────
        replaceBackground: async (scene) => {
          const state = get();
          if (!state.image) return;
          set({ isLoading: true });
          const prompt = `Replace the background of this image with: ${scene}. Keep the main subject (person/object) completely unchanged with precise edges. The new background should seamlessly integrate with the subject's existing lighting and shadows. Photorealistic result.`;
          try {
            const data = await callEditImage(state.image, prompt);
            if (data.credits !== undefined) set({ credits: data.credits });
            set({ ...pushToHistory(get(), data.result), isLoading: false });
            toast.success('Background replaced!');
          } catch (err) {
            set({ isLoading: false });
            toast.error(
              err instanceof Error
                ? err.message
                : 'Background replacement failed',
            );
            throw err;
          }
        },
      }),
      {
        name: 'imgstudio-session',
        storage: safeStorage,
        // Only persist the listed keys — skip all UI/loading/transient state
        partialize: (state) =>
          Object.fromEntries(
            PERSISTED_KEYS.map((k) => [k, state[k]]),
          ) as Partial<EditorState>,
        // After rehydration, guard against a stale historyIndex
        onRehydrateStorage: () => (state) => {
          if (!state || !state.history.length) return;
          if (state.historyIndex >= state.history.length) {
            state.historyIndex = state.history.length - 1;
          }
          state.image = state.history[state.historyIndex];
        },
      },
    ),
  ),
);
