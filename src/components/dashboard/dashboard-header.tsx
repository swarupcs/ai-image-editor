import Link from 'next/link';
import { Zap } from 'lucide-react';
import { UserNav } from '@/components/layout/user-nav';

export function DashboardHeader({ credits }: { credits: number }) {
  return (
    <header className='relative z-10 h-14 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 md:px-6 sticky top-0'>
      <Link
        href='/dashboard'
        className='flex items-center gap-2.5 font-bold text-lg'
      >
        <span className='text-zinc-100 tracking-tight text-base'>
          Img<span className='text-purple-400'>Studio</span>
        </span>
      </Link>

      <div className='flex items-center gap-3'>
        {/* Credits badge */}
        <div
          className={`hidden sm:flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-xs font-medium ${
            credits > 5
              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          <Zap size={12} />
          {credits} credit{credits !== 1 ? 's' : ''}
        </div>
        <UserNav />
      </div>
    </header>
  );
}