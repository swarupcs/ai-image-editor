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
  
  await prisma.user.update({
    where: { id: userId },
    data: { credits: newCredits }
  });
  
  revalidatePath('/admin/users');
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