import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const INITIAL_CREDITS = 10; // change this to whatever your starting credits value is

  const [user, totalImages, publicImages] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    }),
    prisma.generatedImage.count({ where: { userId: session.user.id } }),
    prisma.generatedImage.count({ where: { userId: session.user.id, isPublic: true } }),
  ]);

  const creditsRemaining = user?.credits ?? 0;
  const creditsUsed = INITIAL_CREDITS - creditsRemaining;

  return NextResponse.json({
    totalImages,
    publicImages,
    creditsUsed,
    creditsRemaining,
  });
}
