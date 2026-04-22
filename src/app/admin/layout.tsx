import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Images, Home, ShieldAlert } from 'lucide-react';
import { UserNav } from '@/components/layout/user-nav';

export default async function AdminLayout({
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
    select: { role: true },
  });

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-dvh bg-zinc-950 flex items-center justify-center flex-col gap-4 text-center px-4">
        <ShieldAlert size={48} className="text-red-500" />
        <h1 className="text-2xl font-bold text-zinc-100">Access Denied</h1>
        <p className="text-zinc-400">You do not have permission to view the admin dashboard.</p>
        <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 mt-4">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/images', label: 'Images', icon: Images },
  ];

  return (
    <div className='min-h-dvh bg-zinc-950 flex flex-col md:flex-row'>
      {/* Sidebar */}
      <aside className='w-full md:w-64 border-b md:border-b-0 md:border-r border-zinc-800/50 bg-zinc-950/80 md:bg-zinc-950 flex flex-col'>
        <div className='h-14 md:h-16 flex items-center px-4 md:px-6 border-b border-zinc-800/50 shrink-0'>
          <Link
            href='/admin'
            className='flex items-center gap-2.5 font-bold text-lg'
          >
            <span className='text-zinc-100 tracking-tight text-base'>
              Admin<span className='text-purple-400'>Panel</span>
            </span>
          </Link>
        </div>
        
        <nav className='flex-1 p-3 md:p-4 space-y-1 overflow-y-auto flex flex-row md:flex-col gap-2 md:gap-1'>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className='flex items-center gap-3 px-3 py-2 md:py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 transition-colors'
            >
              <item.icon size={16} />
              <span className='hidden md:block'>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className='p-3 md:p-4 border-t border-zinc-800/50 hidden md:block'>
          <Link
            href='/dashboard'
            className='flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/80 transition-colors'
          >
            <Home size={16} />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className='flex-1 flex flex-col min-w-0'>
        <header className='h-14 md:h-16 flex items-center justify-between px-4 md:px-8 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-10'>
          <h2 className='text-sm md:text-base font-semibold text-zinc-100'>Admin Dashboard</h2>
          <UserNav />
        </header>

        <main className='flex-1 p-4 md:p-8 overflow-y-auto'>
          {children}
        </main>
      </div>
    </div>
  );
}