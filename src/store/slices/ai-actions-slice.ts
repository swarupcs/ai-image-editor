/**
 * AI actions slice.
 * All async operations that call the AI backend.
 */
import type { StateCreator } from 'zustand';
import type { EditorState, AIActionsSlice } from '@/types/editor.types';
import { callEditImage, callGenerate, saveImageToGallery } from '@/lib/services/api.service';
import {
  INPAINTING_PROMPT,
  FILTER_PROMPT_SUFFIX,
  EXPANSION_PROMPT,
  REMOVE_BG_PROMPT,
  ENHANCE_IMAGE_PROMPT,
  ENHANCE_FACE_PROMPT,
  BLEND_PROMPT_DEFAULT,
  RECOLOR_PROMPT,
  REPLACE_BG_PROMPT,
} from '@/config/prompts.config';
import { pushToHistory } from './core-slice';
import { toast } from 'sonner';
import { calculateEditCost, calculateGenerateCost } from '@/lib/utils/credits.utils';

function checkSufficientCredits(
  credits: number | null, 
  required: number, 
  apiKey: string | null,
  setShowApiKeyModal: (show: boolean) => void
): boolean {
  if (apiKey) return true; // Bypass internal credit check if using own key

  if (credits !== null && credits < required) {
    setShowApiKeyModal(true);
    toast.error(`Insufficient credits. Please add your own Gemini API key to continue.`);
    return false;
  }
  return true;
}

export const createAIActionsSlice: StateCreator<EditorState, [], [], AIActionsSlice> = (
  set,
  get,
) => ({
  generateEdit: async () => {
    const state = get();
    const cost = calculateEditCost({
      hasMask: !!state.mask,
      userFilesCount: state.userFiles.length,
    });
    if (!checkSufficientCredits(state.credits, cost, state.apiKey, state.setShowApiKeyModal)) return;
    
    set({ isLoading: true });
    try {
      const data = await callEditImage(state.image!, INPAINTING_PROMPT(state.prompt), {
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
    
    const cost = calculateGenerateCost();
    if (!checkSufficientCredits(state.credits, cost, state.apiKey, state.setShowApiKeyModal)) return;

    set({ isLoading: true });
    try {
      const data = await callGenerate(state.prompt);
      if (data.credits !== undefined) set({ credits: data.credits });

      if (data.results && data.results.length > 1) {
        set({ generatedVariations: data.results, isLoading: false });
        toast.success('Variations generated! Please select one.');
      } else {
        const result = data.results ? data.results[0] : data.result;
        set({
          image: result!,
          originalImage: result!,
          history: [result!],
          historyIndex: 0,
          isLoading: false,
          textLayers: [],
        });
        toast.success('Image generated!');
      }
    } catch (err) {
      set({ isLoading: false });
      toast.error(err instanceof Error ? err.message : 'Generation failed');
      throw err;
    }
  },

  applyFilter: async (prompt) => {
    const state = get();
    const cost = calculateEditCost({ isFilter: true });
    if (!checkSufficientCredits(state.credits, cost, state.apiKey, state.setShowApiKeyModal)) return;

    set({ isLoading: true });
    const finalPrompt = `${prompt}${FILTER_PROMPT_SUFFIX}`;
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
    
    const cost = calculateEditCost();
    if (!checkSufficientCredits(state.credits, cost, state.apiKey, state.setShowApiKeyModal)) return;

    set({ isLoading: true });
    try {
      const data = await callEditImage(state.image, EXPANSION_PROMPT(state.prompt), { aspectRatio });
      if (data.credits !== undefined) set({ credits: data.credits });
      set({ ...pushToHistory(get(), data.result), isLoading: false });
      toast.success('Canvas expanded!');
    } catch (err) {
      set({ isLoading: false });
      toast.error(err instanceof Error ? err.message : 'Expansion failed');
      throw err;
    }
  },

  removeBackground: async () => {
    const state = get();
    if (!state.image) return;

    const cost = calculateEditCost();
    if (!checkSufficientCredits(state.credits, cost, state.apiKey, state.setShowApiKeyModal)) return;

    set({ isLoading: true });
    try {
      const data = await callEditImage(state.image, REMOVE_BG_PROMPT);
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

    const cost = calculateEditCost();
    if (!checkSufficientCredits(state.credits, cost, state.apiKey, state.setShowApiKeyModal)) return;

    set({ isLoading: true });
    try {
      const data = await callEditImage(state.image, ENHANCE_IMAGE_PROMPT);
      if (data.credits !== undefined) set({ credits: data.credits });
      set({ ...pushToHistory(get(), data.result), isLoading: false });
      toast.success('Image enhanced!');
    } catch (err) {
      set({ isLoading: false });
      toast.error(err instanceof Error ? err.message : 'Enhancement failed');
      throw err;
    }
  },

  enhanceFace: async () => {
    const state = get();
    if (!state.image) return;

    const cost = calculateEditCost();
    if (!checkSufficientCredits(state.credits, cost, state.apiKey, state.setShowApiKeyModal)) return;

    set({ isLoading: true });
    try {
      const data = await callEditImage(state.image, ENHANCE_FACE_PROMPT);
      if (data.credits !== undefined) set({ credits: data.credits });
      set({ ...pushToHistory(get(), data.result), isLoading: false });
      toast.success('Face enhanced!');
    } catch (err) {
      set({ isLoading: false });
      toast.error(err instanceof Error ? err.message : 'Face enhancement failed');
      throw err;
    }
  },

  applyBlend: async (blendPrompt) => {
    const state = get();
    if (!state.image || !state.blendSource) return;

    const cost = calculateEditCost({ userFilesCount: 1 });
    if (!checkSufficientCredits(state.credits, cost, state.apiKey, state.setShowApiKeyModal)) return;

    set({ isLoading: true });
    const prompt = blendPrompt || BLEND_PROMPT_DEFAULT;
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
    return saveImageToGallery(state.image, state.prompt, title);
  },

  recolorArea: async (targetColor) => {
    const state = get();
    if (!state.image) return;

    const cost = calculateEditCost({ hasMask: !!state.mask });
    if (!checkSufficientCredits(state.credits, cost, state.apiKey, state.setShowApiKeyModal)) return;

    set({ isLoading: true });
    try {
      const data = await callEditImage(state.image, RECOLOR_PROMPT(targetColor), {
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

  replaceBackground: async (scene) => {
    const state = get();
    if (!state.image) return;

    const cost = calculateEditCost();
    if (!checkSufficientCredits(state.credits, cost, state.apiKey, state.setShowApiKeyModal)) return;

    set({ isLoading: true });
    try {
      const data = await callEditImage(state.image, REPLACE_BG_PROMPT(scene));
      if (data.credits !== undefined) set({ credits: data.credits });
      set({ ...pushToHistory(get(), data.result), isLoading: false });
      toast.success('Background replaced!');
    } catch (err) {
      set({ isLoading: false });
      toast.error(err instanceof Error ? err.message : 'Background replacement failed');
      throw err;
    }
  },
});
