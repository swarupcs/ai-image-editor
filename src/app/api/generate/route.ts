import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

  const { prompt, aspectRatio } = await request.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const ai = new GoogleGenAI({
    vertexai: true,
    project: process.env.GOOGLE_CLOUD_PROJECT,
    location: process.env.GCP_LOCATION,
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-05-20',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
      candidateCount: 4,
      imageConfig: { 
        aspectRatio: aspectRatio || undefined,
      },
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
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: { decrement: 1 } },
      select: { credits: true },
    });

    return NextResponse.json({
      results,
      credits: updated.credits,
    });
  }

  return NextResponse.json(
    { error: 'Failed to generate image' },
    { status: 500 },
  );
}
