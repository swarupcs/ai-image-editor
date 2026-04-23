import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Images, Globe, Wand2, Palette, Sparkles, BarChart2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dashboard | ImgStudio',
  description: 'Manage your creations and credits.',
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) redirect('/signin');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      images: {
        orderBy: { createdAt: 'desc' },
        take: 6,
      },
    },
  });

  if (!user) redirect('/signin');

  // Calculate stats
  const totalImages = await prisma.generatedImage.count({
    where: { userId: user.id },
  });

  const publicImages = await prisma.generatedImage.count({
    where: { userId: user.id, isPublic: true },
  });

  const usageTransactions = await prisma.creditTransaction.aggregate({
    where: { userId: user.id, type: 'USAGE' },
    _sum: { amount: true }
  });
  const creditsUsed = Math.abs(usageTransactions._sum.amount || 0);

  const stats = {
    totalImages,
    publicImages,
    creditsUsed,
    creditsRemaining: user.credits,
  };
  const recentImages = user.images;

  return (
    <div className='space-y-10'>
      {/* Welcome */}
      <div className='space-y-2'>
        <h1 className='text-3xl md:text-4xl font-bold text-zinc-100'>
          Welcome back{session.user.name ? `, ${session.user.name}` : ''}
        </h1>
        <p className='text-zinc-500 text-lg'>
          What would you like to create today?
        </p>
      </div>

      {/* Quick Start */}
      <Link href='/editor' className="block">
        <div className='group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-violet-600/20 border border-purple-500/20 p-8 md:p-10 hover:border-purple-500/40 transition-all duration-300 cursor-pointer'>
          <div className='flex items-center justify-between'>
            <div className='space-y-3'>
              <h2 className='text-2xl font-bold text-zinc-100'>
                Open Editor
              </h2>
              <p className='text-zinc-400 max-w-md'>
                Upload an image or generate from a prompt. Inpaint, apply
                filters, expand, enhance, and more.
              </p>
              <div className='flex items-center gap-2 text-purple-400 font-medium text-sm'>
                Launch Editor
                <ArrowRight
                  size={16}
                  className='group-hover:translate-x-1 transition-transform'
                />
              </div>
            </div>
            <div className='hidden md:block'></div>
          </div>
        </div>
      </Link>

      {/* Usage Stats */}
      <div className='space-y-3'>
        <div className='flex items-center gap-2'>
          <BarChart2 size={14} className='text-zinc-500' />
          <h3 className='text-sm font-medium text-zinc-500 uppercase tracking-wider'>
            Usage
          </h3>
        </div>
        <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
          {[
            {
              label: 'Images Saved',
              value: stats.totalImages,
              color: 'text-purple-400',
            },
            {
              label: 'Public Images',
              value: stats.publicImages,
              color: 'text-violet-400',
            },
            {
              label: 'Credits Used',
              value: stats.creditsUsed,
              color: 'text-amber-400',
            },
            {
              label: 'Credits Left',
              value: stats.creditsRemaining,
              color:
                stats.creditsRemaining > 5
                  ? 'text-emerald-400'
                  : 'text-red-400',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className='p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-1'
            >
              <p className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className='text-xs text-zinc-500'>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Nav links: Gallery + Public */}
      <div className='grid grid-cols-2 gap-4'>
        <Link href='/gallery/user' className="block">
          <div className='group p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors space-y-3 cursor-pointer h-full'>
            <div className='w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center'>
              <Images size={18} className='text-purple-400' />
            </div>
            <div>
              <p className='font-semibold text-zinc-200 text-sm'>
                My Gallery
              </p>
              <p className='text-xs text-zinc-500'>
                Saved images & collections
              </p>
            </div>
          </div>
        </Link>
        <Link href='/gallery' className="block">
          <div className='group p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors space-y-3 cursor-pointer h-full'>
            <div className='w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center'>
              <Globe size={18} className='text-violet-400' />
            </div>
            <div>
              <p className='font-semibold text-zinc-200 text-sm'>
                Community Gallery
              </p>
              <p className='text-xs text-zinc-500'>Browse public creations</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent images */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h3 className='text-sm font-medium text-zinc-500 uppercase tracking-wider'>
            Recent Saves
          </h3>
          <Link
            href='/gallery/user'
            className='text-xs text-purple-400 hover:text-purple-300 transition-colors'
          >
            View all →
          </Link>
        </div>
        {recentImages.length === 0 ? (
          <div className='text-center py-12 rounded-xl border border-zinc-800/50 border-dashed'>
            <p className='text-zinc-600 text-sm'>
              No saved images yet. Open the editor and hit Save.
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-3 sm:grid-cols-6 gap-3'>
            {recentImages.map((img) => (
              <Link href={`/p/${img.id}`} key={img.id} className="block group">
                <div className='aspect-square rounded-xl overflow-hidden border border-zinc-800/50 bg-zinc-900 relative'>
                  <Image
                    src={img.imageData}
                    alt={img.title ?? 'Recent Image'}
                    fill
                    className='object-cover group-hover:scale-105 transition-transform duration-300'
                    unoptimized
                  />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className='space-y-4'>
        <h3 className='text-sm font-medium text-zinc-500 uppercase tracking-wider'>
          Available Tools
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {[
            {
              icon: Wand2,
              title: 'Inpainting',
              description:
                'Select areas and describe changes. Remove objects, add elements, or transform regions.',
            },
            {
              icon: Palette,
              title: 'AI Filters',
              description:
                'Apply artistic styles like Ghibli, Cyberpunk, Oil Painting, and more.',
            },
            {
              icon: Sparkles,
              title: 'Image Expansion',
              description:
                'Expand your images to different aspect ratios with AI-generated content.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className='p-5 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-3'
            >
              <div className='w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center'>
                <feature.icon size={18} className='text-purple-400' />
              </div>
              <h4 className='font-semibold text-zinc-200'>{feature.title}</h4>
              <p className='text-sm text-zinc-500 leading-relaxed'>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}