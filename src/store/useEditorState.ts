import { ToolType } from '@/lib/constants';
import { FileUIPart } from 'ai';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type EditorState = {
  image: string | null;
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
  setMask: (mask: string) => void;
  setBrushSize: (size: number) => void;
  setUserFiles: (files: FileUIPart[]) => void;
  setHistory: (history: string[]) => void;
  setHistoryIndex: (index: number) => void;
  undo: () => void;
  redo: () => void;
  toggleHistory: () => void;
  setLoading: (val: boolean) => void;
  setImage: (ImageData: string) => void;
  setPrompt: (prompt: string) => void;
  setCredits: (credits: number) => void;
  fetchCredits: () => Promise<void>;
  generateEdit: () => Promise<void>;
  generateFromPrompt: () => Promise<void>;
  applyFilter: (prompt: string) => void;
  applyExpansion: (aspectRatio: string) => void;
  removeBackground: () => Promise<void>;
  enhanceImage: () => Promise<void>;
  saveCurrentImage: (title?: string) => Promise<string>;
  setSelectedTool: (tool: ToolType) => void;
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

export const useEditorStore = create<EditorState>()(
  devtools((set, get) => ({
    image: null,
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

    setMask: (mask) => set({ mask }),
    setBrushSize: (size) => set({ brushSize: size }),
    setSelectedTool: (tool) => set({ selectedTool: tool }),
    setUserFiles: (files) => set({ userFiles: files }),
    setCredits: (credits) => set({ credits }),
    setImage: (imageData) =>
      set({ image: imageData, history: [imageData], historyIndex: 0 }),
    setHistory: (history) => set({ history }),
    setHistoryIndex: (index) => {
      const state = get();
      set({ historyIndex: index, image: state.history[index] });
    },
    undo: () => {
      const state = get();
      if (state.historyIndex > 0) {
        const newIndex = state.historyIndex - 1;
        set({ image: state.history[newIndex], historyIndex: newIndex });
      }
    },
    redo: () => {
      const state = get();
      if (state.historyIndex < state.history.length - 1) {
        const newIndex = state.historyIndex + 1;
        set({ historyIndex: newIndex, image: state.history[newIndex] });
      }
    },
    toggleHistory: () => {
      const state = get();
      if (state.history.length) {
        set({ showHistory: !state.showHistory });
      }
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
        // silently fail
      }
    },

    generateEdit: async () => {
      const state = get();
      set({ isLoading: true });

      const finalPrompt = `
    TASK: Professional Image In-painting / Generative Fill.
    ROLE: Expert Photo Retoucher.

    INPUT DATA EXPLANATION:
    - You have received a primary image and a corresponding mask image.
    - The mask defines the precise editing region.
    - WHITE pixels in the mask indicate the area where you must apply the user's instruction.
    - BLACK pixels in the mask must remain exactly as they are in the original image.

    USER GOAL:
    "${state.prompt}"

    EXECUTION GUIDELINES (CRITICAL):
    1. IF REMOVING/ERASING: If the user asks to "remove", "erase", or "delete" an object, you MUST perform "Background Reconstruction". Analyze the surrounding background (wall, floor, nature) and seamlessly extend it over the masked area to hide the object.
    2. IF CHANGING/REPLACING: If the user asks to add or change something, generate the new object strictly within the white mask, matching the scene's lighting and perspective.
    3. SEAMLESS INTEGRATION: The new content generated inside the white masked area must perfectly match the surrounding environment's perspective, lighting direction, shadows, and color grading.
    4. TEXTURE MATCHING: Replicate the exact film grain, noise level, and sharpness of the original photo to prevent a "pasted-on" look. The transition at the mask boundary must be invisible.
    5. STRICT ISOLATION: Do not modify any pixels outside the designated white masked area under any circumstances`;

      try {
        const data = await callEditImage(state.image!, finalPrompt, {
          userFiles: state.userFiles,
          maskBase64: state.mask,
        });

        if (data.credits !== undefined) set({ credits: data.credits });
        const clonedHistory = [...state.history, data.result];
        set({
          image: data.result,
          history: clonedHistory,
          historyIndex: state.history.length,
          isLoading: false,
        });
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
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to generate');
        }
        const data = await res.json();
        if (data.credits !== undefined) set({ credits: data.credits });
        set({
          image: data.result,
          history: [data.result],
          historyIndex: 0,
          isLoading: false,
        });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    applyFilter: async (prompt) => {
      const state = get();
      set({ isLoading: true });

      const finalPrompt = `
        ${prompt}
        TECHNICAL CONSTRAINTS:
        1. STRICTLY PRESERVE COMPOSITION: Do not change the subject's pose, the camera angle, or the placement of objects.
        2. OUTPUT FORMAT: This is a style transfer. Keep the underlying structure of the image identical to the original, only changing the texture, lighting, and colors to match the requested style.
      `;

      try {
        const data = await callEditImage(state.image!, finalPrompt);
        if (data.credits !== undefined) set({ credits: data.credits });
        const clonedHistory = [...state.history, data.result];
        set({
          image: data.result,
          history: clonedHistory,
          historyIndex: state.history.length,
          isLoading: false,
        });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    applyExpansion: async (aspectRatio) => {
      const state = get();
      if (!state.image) return;

      const baseInstruction = `High-fidelity outpainting. Analyze the visual context of the original image and seamlessly extend the scenery into the empty areas. Ensure the person's face and features remain completely unchanged`;
      const technicalConstraint = `Strictly maintain the continuity of existing lines, horizon, textures, lighting, and perspective. The transition must be invisible. Do not alter the style or content of the original center image`;
      const userContext = state.prompt
        ? `Additional context/subject for extension: ${state.prompt}`
        : '';
      const finalPrompt = `${baseInstruction}\n${technicalConstraint}\n${userContext}`;

      set({ isLoading: true });

      try {
        const data = await callEditImage(state.image, finalPrompt, {
          aspectRatio,
        });
        if (data.credits !== undefined) set({ credits: data.credits });
        const clonedHistory = [...state.history, data.result];
        set({
          image: data.result,
          history: clonedHistory,
          historyIndex: state.history.length,
          isLoading: false,
        });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    removeBackground: async () => {
      const state = get();
      if (!state.image) return;
      set({ isLoading: true });

      const prompt = `Remove the background from this image completely. Replace the background with a clean solid white background. Keep only the main subject perfectly intact with clean, precise edges. Do not alter the subject in any way.`;

      try {
        const data = await callEditImage(state.image, prompt);
        if (data.credits !== undefined) set({ credits: data.credits });
        const clonedHistory = [...state.history, data.result];
        set({
          image: data.result,
          history: clonedHistory,
          historyIndex: state.history.length,
          isLoading: false,
        });
      } catch (err) {
        set({ isLoading: false });
        throw err;
      }
    },

    enhanceImage: async () => {
      const state = get();
      if (!state.image) return;
      set({ isLoading: true });

      const prompt = `Enhance and upscale this image: improve overall sharpness, clarity, and fine detail. Reconstruct high-frequency texture details to increase apparent resolution. Remove noise, compression artifacts, and blur. Improve color vibrancy and dynamic range while maintaining a natural look. Output a high-quality, crisp version of the input image with no compositional changes.`;

      try {
        const data = await callEditImage(state.image, prompt);
        if (data.credits !== undefined) set({ credits: data.credits });
        const clonedHistory = [...state.history, data.result];
        set({
          image: data.result,
          history: clonedHistory,
          historyIndex: state.history.length,
          isLoading: false,
        });
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
      const data = await res.json();
      return data.id as string;
    },
  }))
);
