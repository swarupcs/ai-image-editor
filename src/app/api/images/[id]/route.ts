import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const image = await prisma.generatedImage.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!image || image.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.generatedImage.delete({ where: { id } });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { isPublic, title } = await req.json();

  const image = await prisma.generatedImage.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!image || image.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.generatedImage.update({
    where: { id },
    data: {
      ...(isPublic !== undefined ? { isPublic } : {}),
      ...(title !== undefined ? { title } : {}),
    },
    select: { id: true, isPublic: true, title: true },
  });

  return NextResponse.json(updated);
}
