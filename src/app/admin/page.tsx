import { prisma } from '@/lib/prisma';
import { Users, Image as ImageIcon, Zap, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = { title: 'Admin Overview | ImgStudio' };

export default async function AdminDashboardPage() {
  const [userCount, imageCount, recentUsers, recentImages] = await Promise.all([
    prisma.user.count(),
    prisma.generatedImage.count(),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true, role: true },
    }),
    prisma.generatedImage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: { user: { select: { name: true, email: true } } },
    }),
  ]);

  const stats = [
    { label: 'Total Users', value: userCount, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Generated Images', value: imageCount, icon: ImageIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    // A simplified metric:
    { label: 'System Health', value: 'Online', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className='space-y-8'>
      <div className='space-y-1'>
        <h1 className='text-3xl font-bold text-zinc-100'>Overview</h1>
        <p className='text-zinc-400'>A high-level look at ImgStudio usage.</p>
      </div>

      {/* Top Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6'>
        {stats.map((stat) => (
          <div key={stat.label} className='p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 flex items-center gap-4'>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className='text-zinc-400 text-sm font-medium'>{stat.label}</p>
              <h3 className={`text-2xl font-bold text-zinc-100`}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Recent Users */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-zinc-100'>Newest Users</h3>
            <Link href='/admin/users' className='text-sm text-purple-400 hover:text-purple-300'>View All</Link>
          </div>
          <div className='bg-zinc-900/50 rounded-2xl border border-zinc-800/50 overflow-hidden'>
            {recentUsers.length === 0 ? (
              <div className='p-6 text-center text-zinc-500 text-sm'>No users yet.</div>
            ) : (
              <div className='divide-y divide-zinc-800/50'>
                {recentUsers.map(u => (
                  <div key={u.id} className='p-4 flex items-center justify-between'>
                    <div className='min-w-0'>
                      <p className='font-medium text-zinc-200 truncate'>{u.name || 'Anonymous'}</p>
                      <p className='text-xs text-zinc-500 truncate'>{u.email}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      {u.role === 'ADMIN' && <span className='text-[10px] uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded'>Admin</span>}
                      <span className='text-xs text-zinc-500'>{u.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Images */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-zinc-100'>Latest Generations</h3>
            <Link href='/admin/images' className='text-sm text-purple-400 hover:text-purple-300'>View All</Link>
          </div>
          <div className='bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-4'>
            {recentImages.length === 0 ? (
               <div className='p-6 text-center text-zinc-500 text-sm'>No images yet.</div>
            ) : (
              <div className='grid grid-cols-3 gap-2'>
                {recentImages.map(img => (
                  <div key={img.id} className='aspect-square relative rounded-lg overflow-hidden border border-zinc-800/50 bg-zinc-800 group'>
                    <Image
                      src={img.imageData}
                      alt={img.prompt || 'Generated image'}
                      fill
                      className='object-cover'
                      unoptimized
                    />
                    <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2'>
                      <span className='text-[10px] text-white truncate w-full'>{img.user.name || img.user.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}