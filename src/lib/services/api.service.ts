/**
 * Client-side API service.
 * Provides typed fetch wrappers used by Zustand store actions.
 */
import { dataURLtoBlob, resizeImageIfNeeded } from '@/lib/utils/image.utils';
import type { EditImageResponse, GenerateResponse } from '@/types';
import { useEditorStore } from '@/store/useEditorState';

/**
 * Call the /api/edit-image endpoint with image, prompt, and optional extras.
 */
export async function callEditImage(
  imageBase64: string,
  prompt: string,
  extra?: Record<string, unknown>,
): Promise<EditImageResponse> {
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

  const apiKey = useEditorStore.getState().apiKey;
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['X-Gemini-API-Key'] = apiKey;
  }

  const res = await fetch('/api/edit-image', {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string; retryAfter?: number };
    if (res.status === 429 && err.retryAfter) {
      const mins = Math.ceil(err.retryAfter / 60);
      throw new Error(err.error || `Rate limit exceeded. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`);
    }
    throw new Error(err.error || 'Failed to generate');
  }
  return res.json() as Promise<EditImageResponse>;
}

/**
 * Call the /api/generate endpoint with a text prompt.
 */
export async function callGenerate(
  prompt: string,
  aspectRatio?: string,
): Promise<GenerateResponse> {
  const apiKey = useEditorStore.getState().apiKey;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['X-Gemini-API-Key'] = apiKey;
  }

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ prompt, aspectRatio }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string; retryAfter?: number };
    if (res.status === 429 && err.retryAfter) {
      const mins = Math.ceil(err.retryAfter / 60);
      throw new Error(err.error || `Rate limit exceeded. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`);
    }
    throw new Error(err.error || 'Failed to generate');
  }
  return res.json() as Promise<GenerateResponse>;
}

/**
 * Fetch the current user's credit count.
 */
export async function fetchUserCredits(): Promise<{ credits: number }> {
  const res = await fetch('/api/credits');
  if (!res.ok) return { credits: 0 };
  const data = await res.json();
  return {
    credits: data.credits ?? 0,
  };
}

/**
 * Save the current image to the user's gallery.
 */
export async function saveImageToGallery(
  imageBase64: string,
  prompt?: string,
  title?: string,
): Promise<string> {
  const { resizeImageIfNeeded: resize, dataURLtoBlob: toBlob } = await import('@/lib/utils/image.utils');
  const formData = new FormData();

  const resizedImageBase64 = await resize(imageBase64);
  const imageMime = resizedImageBase64.match(/:(.*?);/)?.[1] || 'image/png';
  const imageExt = imageMime.split('/')[1] || 'png';
  formData.append('image', toBlob(resizedImageBase64), `image.${imageExt}`);

  if (prompt) formData.append('prompt', prompt);
  const finalTitle = title || prompt?.slice(0, 80);
  if (finalTitle) formData.append('title', finalTitle);

  const res = await fetch('/api/images', {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to save image');
  return (await res.json()).id as string;
}
