import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/signin');
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { credits: true },
  });

  if (!user) {
    redirect('/signin');
  }

  return (
    <div className='min-h-dvh bg-zinc-950'>
      {/* Background pattern */}
      <div className='fixed inset-0 pointer-events-none'>
        <div
          className='absolute inset-0 opacity-[0.03]'
          style={{
            backgroundImage:
              'radial-gradient(circle, #a855f7 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className='absolute inset-0 bg-gradient-to-b from-purple-950/10 via-transparent to-transparent' />
      </div>

      <DashboardHeader credits={user.credits} />
      
      {/* Main Content Area */}
      <main className='relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-12'>
        {children}
      </main>
    </div>
  );
}