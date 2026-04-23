import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/services/auth-guard';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    let config = await prisma.systemConfig.findUnique({
      where: { id: 'default' },
    });

    if (!config) {
      config = await prisma.systemConfig.create({
        data: {
          id: 'default',
        },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('Failed to update system config:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const data = await request.json();

    // Only pick allowed fields
    const {
      maintenanceMode,
      publicGalleryEnabled,
      allowSignups,
      defaultCredits,
      maxImageSize,
      rateLimitEnabled,
      rateLimitMaxRequests,
      rateLimitWindowMin,
      announcementMessage,
      announcementEnabled,
    } = data;

    const updatedConfig = await prisma.systemConfig.upsert({
      where: { id: 'default' },
      update: {
        maintenanceMode,
        publicGalleryEnabled,
        allowSignups,
        defaultCredits,
        maxImageSize,
        rateLimitEnabled,
        rateLimitMaxRequests,
        rateLimitWindowMin,
        announcementMessage,
        announcementEnabled,
      },
      create: {
        id: 'default',
        maintenanceMode: maintenanceMode ?? false,
        publicGalleryEnabled: publicGalleryEnabled ?? true,
        allowSignups: allowSignups ?? true,
        defaultCredits: defaultCredits ?? 20,
        maxImageSize: maxImageSize ?? 5.0,
        rateLimitEnabled: rateLimitEnabled ?? true,
        rateLimitMaxRequests: rateLimitMaxRequests ?? 20,
        rateLimitWindowMin: rateLimitWindowMin ?? 60,
        announcementMessage: announcementMessage ?? null,
        announcementEnabled: announcementEnabled ?? false,
      },
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {    if (error instanceof Response) return error;
    console.error('Failed to update system config:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
