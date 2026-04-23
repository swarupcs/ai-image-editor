/**
 * Server-side Google Generative AI service.
 * Centralizes Vertex AI client creation and retry logic.
 */
import { GoogleGenAI, type GenerateContentResponse } from '@google/genai';
import sharp from 'sharp';

/**
 * Create a configured GoogleGenAI client using Vertex AI,
 * or a standard client if a user API key is provided.
 */
export function createGoogleAI(userApiKey?: string | null): GoogleGenAI {
  if (userApiKey) {
    return new GoogleGenAI({ apiKey: userApiKey });
  }

  const googleAuthOptions =
    process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
      ? {
          credentials: {
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          },
        }
      : undefined;

  return new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GCP_LOCATION,
    ...(googleAuthOptions && { googleAuthOptions }),
  });
}

/**
 * Generate content with automatic exponential-backoff retry on 429 errors.
 */
export async function generateWithRetry(
  ai: GoogleGenAI,
  params: Parameters<typeof ai.models.generateContent>[0],
  maxRetries = 3,
): Promise<GenerateContentResponse> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const is429 = err?.status === 429 || err?.message?.includes('429');
      const isLastAttempt = attempt === maxRetries - 1;

      if (is429 && !isLastAttempt) {
        const waitMs = Math.pow(2, attempt) * 5000;
        console.log(
          `Rate limited. Retrying in ${waitMs / 1000}s... (attempt ${attempt + 1}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      } else {
        throw error;
      }
    }
  }

  throw new Error('generateWithRetry called with maxRetries <= 0');
}

/**
 * Fix image orientation using EXIF data and convert to PNG.
 */
export async function fixImageOrientation(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64');
  const fixed = await sharp(buffer).rotate().png().toBuffer();
  return fixed.toString('base64');
}

/**
 * Build an inline-data part object for the Gemini API.
 */
export function buildImagePart(data: string, mimeType: string = 'image/png') {
  return {
    inlineData: {
      mimeType,
      data,
    },
  };
}
