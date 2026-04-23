import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/services/auth-guard';
import { checkCredits, deductCredits } from '@/lib/services/credits.service';
import { checkRateLimit, recordRequest } from '@/lib/services/rate-limit.service';
import { createGoogleAI } from '@/lib/services/ai.service';
import { calculateGenerateCost } from '@/lib/utils/credits.utils';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();
    // Rate limit check
    await checkRateLimit(userId, 'generate');
    
    const userApiKey = request.headers.get('X-Gemini-API-Key') || undefined;

    // Check if the user has enough credits for the max possible cost (1 upfront + 4 results)
    const maxCost = calculateGenerateCost();
    if (!userApiKey) {
      await checkCredits(userId, maxCost);
    }

    const { prompt, aspectRatio } = await request.json();
    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Record this request for rate limiting
    await recordRequest(userId, 'generate');

    // Deduct 1 credit upfront for calling the LLM
    if (!userApiKey) {
      await deductCredits(userId, 1, 'API Call: Text to Image');
    }

    const ai = createGoogleAI(userApiKey);
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-05-20',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        candidateCount: 4,
        imageConfig: { aspectRatio: aspectRatio || undefined },
      },
    });

    const results: string[] = [];
    if (response.candidates) {
      for (const candidate of response.candidates) {
        const content = candidate.content;
        if (content?.parts) {
          for (const part of content.parts) {
            if (part.inlineData) {
              results.push(`data:image/png;base64,${part.inlineData.data}`);
            }
          }
        }
      }
    }

    if (results.length > 0) {
      if (!userApiKey) {
        const updatedCredits = await deductCredits(userId, results.length, `Successfully generated ${results.length} image(s)`);
        return NextResponse.json({ results, credits: updatedCredits });
      }
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
