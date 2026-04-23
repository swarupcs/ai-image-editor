import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/services/auth-guard";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true },
    });

    return NextResponse.json({ 
      credits: user?.credits ?? 0,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
}
