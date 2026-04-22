import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const cursor = searchParams.get("cursor") ?? undefined;

  const images = await prisma.generatedImage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      title: true,
      prompt: true,
      imageData: true,
      isPublic: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ images });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const imageFile = formData.get("image") as File | null;
  const prompt = formData.get("prompt") as string;
  const title = formData.get("title") as string;

  if (!imageFile) {
    return NextResponse.json({ error: "Image data is required" }, { status: 400 });
  }

  const arrayBuffer = await imageFile.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString("base64");
  const mimeType = imageFile.type || 'image/png';
  const imageData = `data:${mimeType};base64,${base64String}`;

  const image = await prisma.generatedImage.create({
    data: {
      userId: session.user.id,
      imageData,
      prompt: prompt || null,
      title: title || (prompt ? prompt.slice(0, 80) : "Generated Image"),
    },
    select: { id: true, title: true, createdAt: true },
  });

  return NextResponse.json(image, { status: 201 });
}
