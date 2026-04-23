import { NextResponse } from 'next/server';
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import sharp from 'sharp';

function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/png';
}

function cleanBase64Image(dataUrl: string): string {
  return dataUrl.replace(/^data:(.*);base64,/, '');
}

async function generateWithRetry(
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
        const waitMs = Math.pow(2, attempt) * 5000; // 5s, 10s, 20s
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

async function fixImageOrientation(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64');
  const fixed = await sharp(buffer).rotate().png().toBuffer();
  return fixed.toString('base64');
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });

  if (!user || user.credits <= 0) {
    return NextResponse.json(
      { error: 'Insufficient credits', credits: 0 },
      { status: 402 },
    );
  }

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

  const inputImagesCount = 1 + (maskFile ? 1 : 0) + userFiles.length;
  const filterCost = isFilter ? 1 : 0;
  const upfrontCost = inputImagesCount + filterCost;

  if (!user || user.credits < upfrontCost) {
    return NextResponse.json(
      { error: `Insufficient credits. Need at least ${upfrontCost} credits for this operation.`, credits: user?.credits || 0 },
      { status: 402 },
    );
  }

  // Deduct upfront cost
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: upfrontCost } },
    }),
    prisma.creditTransaction.create({
      data: {
        userId: session.user.id,
        amount: -upfrontCost,
        type: 'USAGE',
        description: `API Call: Edit Image (${inputImagesCount} inputs${isFilter ? ', filter' : ''})`,
      },
    }),
  ]);

  const config = await prisma.systemConfig.findUnique({
    where: { id: 'default' },
  });
  
  const maxSizeBytes = (config?.maxImageSize ?? 5) * 1024 * 1024;
  if (imageFile.size > maxSizeBytes) {
    return NextResponse.json(
      { error: `Image exceeds maximum upload size of ${config?.maxImageSize ?? 5}MB` },
      { status: 413 }
    );
  }

  const fileToBase64 = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer).toString('base64');
  };

  const imageBase64 = await fileToBase64(imageFile);
  const maskBase64 = maskFile ? await fileToBase64(maskFile) : null;

  // ✅ Vertex AI initialization instead of API key
  const googleAuthOptions = process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY
    ? {
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }
      }
    : undefined;

  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GCP_LOCATION,
    ...(googleAuthOptions && { googleAuthOptions }),
  });

  const fixedInputBase64 = await fixImageOrientation(
    cleanBase64Image(imageBase64),
  );

  const parts: object[] = [
    { text: prompt },
    {
      inlineData: {
        mimeType: 'image/png',
        data: fixedInputBase64,
      },
    },
  ];

  if (maskBase64) {
    const fixedMask = await fixImageOrientation(cleanBase64Image(maskBase64));
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: fixedMask,
      },
    });
  }

  if (userFiles && userFiles.length > 0) {
    const processedFiles = await Promise.all(
      userFiles.map(async (file: File) => {
        const fileBase64 = await fileToBase64(file);
        const fixed = await fixImageOrientation(cleanBase64Image(fileBase64));
        return {
          inlineData: {
            mimeType: file.type || 'image/png',
            data: fixed,
          },
        };
      }),
    );
    parts.push(...processedFiles);
  }

  const response = await generateWithRetry(ai, {
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts }],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      imageConfig: {
        aspectRatio: aspectRatio || undefined,
      },
    },
  });

  const content = response?.candidates?.[0]?.content;

  if (content?.parts) {
    for (const part of content.parts) {
      if (part.text) {
        console.log(part.text);
      } else if (part.inlineData) {
        // ✅ Decrement credits on successful generation and log transaction
        const [updatedUser] = await prisma.$transaction([
          prisma.user.update({
            where: { id: session.user.id },
            data: { credits: { decrement: 1 } },
            select: { credits: true },
          }),
          prisma.creditTransaction.create({
            data: {
              userId: session.user.id,
              amount: -1,
              type: 'USAGE',
              description: 'Successfully generated edited image',
            },
          }),
        ]);

        const mimeType = part.inlineData.mimeType ?? 'image/png';

        return NextResponse.json({
          result: `data:${mimeType};base64,${part.inlineData.data}`,
          credits: updatedUser.credits,
        });
      }
    }
  }

  return NextResponse.json(
    { error: 'Failed to generate the image' },
    { status: 500 },
  );
}
