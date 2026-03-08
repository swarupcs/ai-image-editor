import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "24");
  const cursor = searchParams.get("cursor") ?? undefined;

  const images = await prisma.generatedImage.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    select: {
      id: true,
      title: true,
      prompt: true,
      imageData: true,
      createdAt: true,
      user: { select: { name: true, image: true } },
    },
  });

  const nextCursor =
    images.length === limit ? images[images.length - 1].id : null;

  return NextResponse.json({ images, nextCursor });
}
