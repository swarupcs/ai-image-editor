'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@/generated/prisma/client';
import { revalidatePath } from 'next/cache';

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthorized');
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { role: true }
  });

  if (user?.role !== 'ADMIN') throw new Error('Forbidden');
  return session;
}

export async function updateUserCredits(userId: string, newCredits: number) {
  await checkAdmin();

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { credits: true }});
  if (!user) throw new Error('User not found');

  const diff = newCredits - user.credits;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: newCredits }
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: diff,
        type: diff >= 0 ? 'ADDON' : 'ADMIN_UPDATE',
        description: `Admin updated credits from ${user.credits} to ${newCredits}`,
      }
    })
  ]);

  revalidatePath('/admin/users');
}

export async function resetAllCredits() {
  await checkAdmin();

  const config = await prisma.systemConfig.findUnique({
    where: { id: 'default' },
    select: { defaultCredits: true }
  });
  const defaultCredits = config?.defaultCredits ?? 20;

  const users = await prisma.user.findMany({ select: { id: true, credits: true }});

  // Create transactions for all users and update their credits
  const transactions = users.map(user => {
    const diff = defaultCredits - user.credits;
    return prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: diff,
        type: 'ADMIN_UPDATE',
        description: `Admin reset credits to default (${defaultCredits})`
      }
    });
  });

  await prisma.$transaction([
    prisma.user.updateMany({
      data: { credits: defaultCredits }
    }),
    ...transactions
  ]);

  revalidatePath('/admin/users');
  return { message: `Successfully reset credits for ${users.length} users to ${defaultCredits}.` };
}
export async function toggleUserRole(userId: string, newRole: Role) {
  await checkAdmin();
  
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole }
  });
  
  revalidatePath('/admin/users');
}

export async function deleteUser(userId: string) {
  await checkAdmin();
  
  // Cascade delete is handled by Prisma relation (onDelete: Cascade)
  await prisma.user.delete({
    where: { id: userId }
  });
  
  revalidatePath('/admin/users');
}

export async function deleteImage(imageId: string) {
  await checkAdmin();
  
  await prisma.generatedImage.delete({
    where: { id: imageId }
  });
  
  revalidatePath('/admin/images');
  revalidatePath('/admin');
}