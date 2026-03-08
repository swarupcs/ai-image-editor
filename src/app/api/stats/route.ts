import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, totalImages, publicImages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true, createdAt: true },
    }),
    prisma.generatedImage.count({ where: { userId: session.user.id } }),
    prisma.generatedImage.count({ where: { userId: session.user.id, isPublic: true } }),
  ]);

  const creditsUsed = Math.max(0, 20 - (user?.credits ?? 0));

  return NextResponse.json({ totalImages, publicImages, creditsUsed, creditsRemaining: user?.credits ?? 0 });
}
