import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/services/auth-guard';
import { checkCredits, deductCredits } from '@/lib/services/credits.service';
import { checkRateLimit, recordRequest } from '@/lib/services/rate-limit.service';
import { createGoogleAI, generateWithRetry, fixImageOrientation, buildImagePart } from '@/lib/services/ai.service';
import { cleanBase64Image, fileToBase64 } from '@/lib/utils/image.utils';
import { calculateEditCost } from '@/lib/utils/credits.utils';

export async function POST(request: Request) {
  try {
    const { userId } = await requireAuth();

    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const maskFile = formData.get('mask') as File | null;
    const prompt = formData.get('prompt') as string;
    const aspectRatio = formData.get('aspectRatio') as string;
    const isFilter = formData.get('isFilter') === 'true';
    const userFiles = formData.getAll('userFiles') as File[];

    if (!imageFile || !prompt) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const userApiKey = request.headers.get('X-Gemini-API-Key') || undefined;

    // Rate limit check
    await checkRateLimit(userId, 'edit-image');

    // Calculate and check credits for the entire operation
    const totalMaxCost = calculateEditCost({
      hasMask: !!maskFile,
      userFilesCount: userFiles.length,
      isFilter,
    });
    
    if (!userApiKey) {
      await checkCredits(userId, totalMaxCost);
    }

    // Record this request for rate limiting
    await recordRequest(userId, 'edit-image');

    // Check image size
    const config = await prisma.systemConfig.findUnique({ where: { id: 'default' } });
    const maxSizeBytes = (config?.maxImageSize ?? 5) * 1024 * 1024;
    if (imageFile.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `Image exceeds maximum upload size of ${config?.maxImageSize ?? 5}MB` },
        { status: 413 },
      );
    }

    // Deduct upfront cost (base + inputs + filter)
    // We deduct the generation cost (1) later when the image is successfully returned.
    const upfrontCost = totalMaxCost - 1;
    if (!userApiKey) {
      await deductCredits(userId, upfrontCost, `API Call: Edit Image (${userFiles.length} inputs${isFilter ? ', filter' : ''})`);
    }

    // Process images
    const imageBase64 = await fileToBase64(imageFile);
    const fixedInputBase64 = await fixImageOrientation(cleanBase64Image(imageBase64));

    const parts: object[] = [
      { text: prompt },
      buildImagePart(fixedInputBase64),
    ];

    if (maskFile) {
      const maskBase64 = await fileToBase64(maskFile);
      const fixedMask = await fixImageOrientation(cleanBase64Image(maskBase64));
      parts.push(buildImagePart(fixedMask));
    }

    if (userFiles.length > 0) {
      const processedFiles = await Promise.all(
        userFiles.map(async (file: File) => {
          const fileBase64 = await fileToBase64(file);
          const fixed = await fixImageOrientation(cleanBase64Image(fileBase64));
          return buildImagePart(fixed, file.type || 'image/png');
        }),
      );
      parts.push(...processedFiles);
    }

    // Generate
    const ai = createGoogleAI(userApiKey);
    const response = await generateWithRetry(ai, {
      model: 'gemini-2.5-flash-image',
      contents: [{ role: 'user', parts }],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: aspectRatio || undefined },
      },
    });

    const content = response?.candidates?.[0]?.content;
    if (content?.parts) {
      for (const part of content.parts) {
        if (part.text) {
          console.log(part.text);
        } else if (part.inlineData) {
          let updatedCredits = null;
          if (!userApiKey) {
            updatedCredits = await deductCredits(userId, 1, 'Successfully generated edited image');
          }
          const mimeType = part.inlineData.mimeType ?? 'image/png';
          return NextResponse.json({
            result: `data:${mimeType};base64,${part.inlineData.data}`,
            ...(updatedCredits !== null && { credits: updatedCredits }),
          });
        }
      }
    }

    return NextResponse.json({ error: 'Failed to generate the image' }, { status: 500 });
  } catch (e) {
    // If it's already a NextResponse (from requireAuth/checkCredits), return it
    if (e instanceof Response) return e;
    throw e;
  }
}
