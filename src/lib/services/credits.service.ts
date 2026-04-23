/**
 * Server-side credit management service.
 * Handles credit checks, deductions, and transaction logging.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Check if a user has enough credits. Returns current credit count.
 * Throws a 402 response if insufficient.
 */
export async function checkCredits(userId: string, required: number = 1): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  if (!user || user.credits < required) {
    throw NextResponse.json(
      {
        error: `Insufficient credits. Need at least ${required} credits for this operation.`,
        credits: user?.credits || 0,
      },
      { status: 402 },
    );
  }

  return user.credits;
}

/**
 * Deduct credits and log the transaction atomically.
 * Returns the updated credit count.
 */
export async function deductCredits(
  userId: string,
  amount: number,
  description: string,
  type: string = 'USAGE',
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
      select: { credits: true },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: -amount,
        type,
        description,
      },
    }),
  ]);

  return updatedUser.credits;
}
