import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: collectionId } = await params;
  const { imageId } = await req.json();

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { userId: true },
  });

  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const image = await prisma.generatedImage.findUnique({
    where: { id: imageId },
    select: { userId: true },
  });

  if (!image || image.userId !== session.user.id) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const entry = await prisma.collectionImage.upsert({
    where: { collectionId_imageId: { collectionId, imageId } },
    create: { collectionId, imageId },
    update: {},
    select: { id: true },
  });

  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: collectionId } = await params;
  const { imageId } = await req.json();

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { userId: true },
  });

  if (!collection || collection.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.collectionImage.deleteMany({
    where: { collectionId, imageId },
  });

  return NextResponse.json({ success: true });
}
