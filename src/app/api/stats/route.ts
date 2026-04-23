import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [user, totalImages, publicImages, usageTransactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true },
    }),
    prisma.generatedImage.count({ where: { userId: session.user.id } }),
    prisma.generatedImage.count({ where: { userId: session.user.id, isPublic: true } }),
    prisma.creditTransaction.aggregate({
      where: { userId: session.user.id, type: 'USAGE' },
      _sum: { amount: true }
    })
  ]);

  const creditsRemaining = user?.credits ?? 0;
  const creditsUsed = Math.abs(usageTransactions._sum.amount || 0);

  return NextResponse.json({
    totalImages,
    publicImages,
    creditsUsed,
    creditsRemaining,
  });
}
