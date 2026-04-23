import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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
    console.error('Failed to update system config:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    // Check if the user is an admin
    const user = session?.user?.email ? await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { role: true }
    }) : null;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Only pick allowed fields
    const { 
      maintenanceMode, 
      publicGalleryEnabled, 
      allowSignups, 
      defaultCredits, 
      maxImageSize 
    } = data;

    const updatedConfig = await prisma.systemConfig.upsert({
      where: { id: 'default' },
      update: {
        maintenanceMode,
        publicGalleryEnabled,
        allowSignups,
        defaultCredits,
        maxImageSize,
      },
      create: {
        id: 'default',
        maintenanceMode: maintenanceMode ?? false,
        publicGalleryEnabled: publicGalleryEnabled ?? true,
        allowSignups: allowSignups ?? true,
        defaultCredits: defaultCredits ?? 20,
        maxImageSize: maxImageSize ?? 5.0,
      },
    });

    return NextResponse.json(updatedConfig);
  } catch (error) {
    console.error('Failed to update system config:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
