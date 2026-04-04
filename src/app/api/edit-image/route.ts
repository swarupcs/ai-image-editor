import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getMimeType(dataUrl: string): string {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : "image/png";
import { NextResponse } from 'next/server';
import { GenerateContentResponse, GoogleGenAI } from '@google/genai';
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
    } catch (error: any) {
      const is429 = error?.status === 429 || error?.message?.includes('429');
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

  // This is only reached if maxRetries is 0
  throw new Error('generateWithRetry called with maxRetries <= 0');
}

// ✅ Auto-rotates based on EXIF orientation and converts to PNG
async function fixImageOrientation(base64: string): Promise<string> {
  const buffer = Buffer.from(base64, 'base64');
  const fixed = await sharp(buffer)
    .rotate() // reads EXIF orientation and corrects it
    .png()
    .toBuffer();
  return fixed.toString('base64');
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { credits: true },
  });

  if (!user || user.credits <= 0) {
    return NextResponse.json(
      { error: "Insufficient credits", credits: 0 },
      { status: 402 }
    );
  }

  const { imageBase64, prompt, userFiles, aspectRatio, maskBase64 } =
    await request.json();

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const { imageBase64, prompt, userFiles, aspectRatio, maskBase64 } =
    await request.json();

  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GCP_PROJECT_ID,
    location: 'global',
  });

  // ✅ Fix orientation before sending to the model
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

  if (userFiles && Array.isArray(userFiles) && userFiles.length > 0) {
    const processedFiles = userFiles.map((file: { url: string }) => ({
      inlineData: {
        mimeType: getMimeType(file.url),
        data: cleanBase64Image(file.url),
      },
    }));
    const processedFiles = await Promise.all(
      userFiles.map(async (file) => {
        const fixed = await fixImageOrientation(cleanBase64Image(file.url));
        return {
          inlineData: {
            mimeType: 'image/png',
            data: fixed,
          },
        };
      }),
    );
    parts.push(...processedFiles);
  }

  const response = await generateWithRetry(ai, {
    // model: 'gemini-3.1-flash-image-preview',
    model: 'gemini-2.5-flash-image',
    contents: [{ role: 'user', parts }],
    config: {
      imageConfig: { aspectRatio: aspectRatio || undefined },
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
        const updated = await prisma.user.update({
          where: { id: session.user.id },
          data: { credits: { decrement: 1 } },
          select: { credits: true },
        });

        return NextResponse.json({
          result: `data:image/png;base64,${part.inlineData.data}`,
          credits: updated.credits,
        });
      }
    }
  }

  return NextResponse.json({ error: "Failed to generate the image" }, { status: 500 });
        const imageData = part.inlineData.data;
        const mimeType = part.inlineData.mimeType ?? 'image/png';
        return NextResponse.json({
          result: `data:${mimeType};base64,${imageData}`,
        });
      }
    }
  }

  return NextResponse.json({ message: 'Failed to generate the image' });
}
