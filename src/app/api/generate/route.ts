import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      { status: 402 },
    );
  }

  const { prompt, aspectRatio } = await request.json();

  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio: aspectRatio || undefined },
    },
  });

  const content = response.candidates?.[0]?.content;

  if (content?.parts) {
    for (const part of content.parts) {
      if (part.inlineData) {
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

  return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
}
